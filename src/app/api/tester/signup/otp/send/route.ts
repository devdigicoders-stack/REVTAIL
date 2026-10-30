import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  sendWhatsAppTemplate,
} from "@/lib/whatsapp";

import {
  createOtpChallenge,
  generateSignupOtp,
  getOtpResendWaitSeconds,
  normalizeTesterMobile,
  OTP_EXPIRY_SECONDS,
  TESTER_SIGNUP_OTP_COOKIE,
  TESTER_SIGNUP_VERIFIED_COOKIE,
} from "@/lib/tester-signup-otp";

export const runtime =
  "nodejs";


export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const mobile =
      normalizeTesterMobile(
        body.mobile
      );

    // ============================================================
    // MOBILE VALIDATION
    // ============================================================

    if (
      !/^[6-9]\d{9}$/.test(
        mobile
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please enter a valid 10-digit Indian mobile number.",
        },
        {
          status:
            400,
        }
      );
    }

    // ============================================================
    // EXISTING USER CHECK
    // ============================================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          mobile,
        },

        select: {
          id:
            true,
        },
      });

    if (
      existingUser
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "A user with this mobile number already exists.",
        },
        {
          status:
            409,
        }
      );
    }

    // ============================================================
    // RESEND LIMIT
    // ============================================================

    const existingOtpToken =
      request.cookies.get(
        TESTER_SIGNUP_OTP_COOKIE
      )?.value;

    const waitSeconds =
      getOtpResendWaitSeconds(
        existingOtpToken,
        mobile
      );

    if (
      waitSeconds > 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Please wait ${waitSeconds} seconds before requesting another OTP.`,

          retryAfter:
            waitSeconds,
        },
        {
          status:
            429,
        }
      );
    }

    // ============================================================
    // WHATSAPP TEMPLATE
    // ============================================================

    const templateName =
      process.env
        .WHATSAPP_OTP_TEMPLATE_NAME;

    if (
      !templateName
    ) {
      throw new Error(
        "WHATSAPP_OTP_TEMPLATE_NAME is not configured."
      );
    }

    const otp =
      generateSignupOtp();

    await sendWhatsAppTemplate({
      to:
        mobile,

      templateName,

      parameters: [
        otp,
      ],

      buttonUrlParameter:
        otp,

      languageCode:
        process.env
          .WHATSAPP_OTP_LANGUAGE ??
        "en",

      callbackData:
        `tester-signup:${mobile}`,
    });

    // ============================================================
    // CREATE SECURE OTP COOKIE
    // ============================================================

    const otpToken =
      createOtpChallenge(
        mobile,
        otp
      );

    const response =
      NextResponse.json(
        {
          success:
            true,

          message:
            "OTP sent to your WhatsApp number.",

          expiresIn:
            OTP_EXPIRY_SECONDS,

          resendAfter:
            60,
        }
      );

    response.cookies.set(
      TESTER_SIGNUP_OTP_COOKIE,
      otpToken,
      {
        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          OTP_EXPIRY_SECONDS,
      }
    );

    // Sending a new OTP invalidates
    // any previous verification.
    response.cookies.set(
      TESTER_SIGNUP_VERIFIED_COOKIE,
      "",
      {
        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "TESTER SIGNUP OTP SEND ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to send OTP. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}