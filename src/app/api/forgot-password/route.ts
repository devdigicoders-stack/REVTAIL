import {
  NextRequest,
  NextResponse,
} from "next/server";

import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

import {
  sendWhatsAppTemplate,
} from "@/lib/whatsapp";

import {
  createPasswordResetOtpToken,
  generatePasswordResetOtp,
  getPasswordResetResendWaitSeconds,
  normalizeResetIdentifier,
  PASSWORD_RESET_OTP_COOKIE,
  PASSWORD_RESET_OTP_EXPIRY_SECONDS,
  PASSWORD_RESET_RESEND_SECONDS,
  PASSWORD_RESET_VERIFIED_COOKIE,
} from "@/lib/password-reset-otp";

export const runtime = "nodejs";

const transporter =
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(
      process.env.SMTP_PORT || 587
    ),
    secure:
      Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const identifier =
      normalizeResetIdentifier(
        body.identifier
      );

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email address or mobile number is required.",
        },
        { status: 400 }
      );
    }

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        identifier
      );

    const isMobile =
      /^[6-9]\d{9}$/.test(
        identifier
      );

    if (!isEmail && !isMobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address or 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    const existingOtpToken =
      request.cookies.get(
        PASSWORD_RESET_OTP_COOKIE
      )?.value;

    const waitSeconds =
      getPasswordResetResendWaitSeconds(
        existingOtpToken,
        identifier
      );

    if (waitSeconds > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Please wait ${waitSeconds} seconds before requesting another OTP.`,
          retryAfter: waitSeconds,
        },
        { status: 429 }
      );
    }

    let user:
      | {
          id: number;
          role:
            | "ADMIN"
            | "BRAND"
            | "TESTER";
          email: string | null;
          mobile: string | null;
        }
      | null = null;

    if (isEmail) {
      user =
        await prisma.user.findUnique({
          where: {
            email: identifier,
          },
          select: {
            id: true,
            role: true,
            email: true,
            mobile: true,
          },
        });

      if (
        user &&
        user.role !== "ADMIN" &&
        user.role !== "BRAND"
      ) {
        user = null;
      }
    }

    if (isMobile) {
      user =
        await prisma.user.findUnique({
          where: {
            mobile: identifier,
          },
          select: {
            id: true,
            role: true,
            email: true,
            mobile: true,
          },
        });

      if (
        user &&
        user.role !== "TESTER"
      ) {
        user = null;
      }
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          isMobile
            ? "If the mobile number is registered, an OTP has been sent to the registered WhatsApp number."
            : "If the email address is registered, an OTP has been sent to the registered email address.",
        delivery:
          isMobile
            ? "WHATSAPP"
            : "EMAIL",
        expiresIn:
          PASSWORD_RESET_OTP_EXPIRY_SECONDS,
        resendAfter:
          PASSWORD_RESET_RESEND_SECONDS,
      });
    }

    const otp =
      generatePasswordResetOtp();

    if (user.role === "TESTER") {
      const templateName =
        process.env
          .WHATSAPP_OTP_TEMPLATE_NAME;

      if (!templateName) {
        throw new Error(
          "WHATSAPP_OTP_TEMPLATE_NAME is not configured."
        );
      }

      await sendWhatsAppTemplate({
        to: identifier,
        templateName,
        parameters: [otp],
        buttonUrlParameter: otp,
        languageCode:
          process.env
            .WHATSAPP_OTP_LANGUAGE ??
          "en",
        callbackData:
          `password-reset:${identifier}`,
      });
    } else {
      if (!user.email) {
        throw new Error(
          "User email is missing."
        );
      }

      const minutes = Math.floor(
        PASSWORD_RESET_OTP_EXPIRY_SECONDS /
          60
      );

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        to: user.email,
        subject:
          "Revtail - Password Reset OTP",
        text:
          `Your Revtail password reset OTP is ${otp}.\n\n` +
          `This OTP is valid for ${minutes} minutes.\n\n` +
          "If you did not request a password reset, please ignore this email.",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Revtail Password Reset</h2>
            <p>We received a request to reset your Revtail account password.</p>
            <p>Your password reset OTP is:</p>
            <div style="font-size:30px;font-weight:bold;letter-spacing:8px;margin:20px 0;">
              ${otp}
            </div>
            <p>This OTP is valid for <strong>${minutes} minutes</strong>.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Regards,<br />Revtail Team</p>
          </div>
        `,
      });
    }

    const otpToken =
      createPasswordResetOtpToken({
        userId: user.id,
        role: user.role,
        identifier,
        channel:
          user.role === "TESTER"
            ? "WHATSAPP"
            : "EMAIL",
        otp,
      });

    const response =
      NextResponse.json({
        success: true,
        message:
          user.role === "TESTER"
            ? "OTP sent to your registered WhatsApp number."
            : "OTP sent to your registered email address.",
        delivery:
          user.role === "TESTER"
            ? "WHATSAPP"
            : "EMAIL",
        expiresIn:
          PASSWORD_RESET_OTP_EXPIRY_SECONDS,
        resendAfter:
          PASSWORD_RESET_RESEND_SECONDS,
      });

    response.cookies.set(
      PASSWORD_RESET_OTP_COOKIE,
      otpToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          PASSWORD_RESET_OTP_EXPIRY_SECONDS,
      }
    );

    response.cookies.set(
      PASSWORD_RESET_VERIFIED_COOKIE,
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process the password reset request. Please try again.",
      },
      { status: 500 }
    );
  }
}
