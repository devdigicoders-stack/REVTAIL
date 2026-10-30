import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createPasswordResetVerifiedToken,
  normalizeResetIdentifier,
  PASSWORD_RESET_OTP_COOKIE,
  PASSWORD_RESET_OTP_EXPIRY_SECONDS,
  PASSWORD_RESET_VERIFIED_COOKIE,
  PASSWORD_RESET_VERIFIED_EXPIRY_SECONDS,
  verifyPasswordResetOtp,
} from "@/lib/password-reset-otp";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const identifier =
      normalizeResetIdentifier(
        body.identifier
      );

    const otp =
      String(
        body.otp ?? ""
      ).trim();

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

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the 6-digit OTP.",
        },
        { status: 400 }
      );
    }

    const otpToken =
      request.cookies.get(
        PASSWORD_RESET_OTP_COOKIE
      )?.value;

    const result =
      verifyPasswordResetOtp(
        otpToken,
        identifier,
        otp
      );

    if (!result.success) {
      let message =
        "Invalid OTP.";

      if (
        result.reason === "EXPIRED"
      ) {
        message =
          "OTP has expired. Please request a new OTP.";
      }

      if (
        result.reason ===
        "TOO_MANY_ATTEMPTS"
      ) {
        message =
          "Too many incorrect attempts. Please request a new OTP.";
      }

      if (
        result.reason ===
        "IDENTIFIER_MISMATCH"
      ) {
        message =
          "The email/mobile does not match the OTP request.";
      }

      const response =
        NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );

      if (result.newToken) {
        response.cookies.set(
          PASSWORD_RESET_OTP_COOKIE,
          result.newToken,
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
      }

      return response;
    }

    const verifiedToken =
      createPasswordResetVerifiedToken({
        userId: result.userId,
        role: result.role,
        identifier,
      });

    const response =
      NextResponse.json({
        success: true,
        message:
          "OTP verified successfully.",
        expiresIn:
          PASSWORD_RESET_VERIFIED_EXPIRY_SECONDS,
      });

    response.cookies.set(
      PASSWORD_RESET_VERIFIED_COOKIE,
      verifiedToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          PASSWORD_RESET_VERIFIED_EXPIRY_SECONDS,
      }
    );

    response.cookies.set(
      PASSWORD_RESET_OTP_COOKIE,
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
      "VERIFY RESET OTP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify OTP.",
      },
      { status: 500 }
    );
  }
}
