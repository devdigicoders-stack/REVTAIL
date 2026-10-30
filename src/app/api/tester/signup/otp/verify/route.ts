import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createVerifiedToken,
  normalizeTesterMobile,
  TESTER_SIGNUP_OTP_COOKIE,
  TESTER_SIGNUP_VERIFIED_COOKIE,
  VERIFIED_EXPIRY_SECONDS,
  verifyOtpChallenge,
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

    const otp =
      String(
        body.otp ?? ""
      ).trim();

    // ============================================================
    // VALIDATION
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
            "Invalid mobile number.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !/^\d{6}$/.test(
        otp
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please enter the 6-digit OTP.",
        },
        {
          status:
            400,
        }
      );
    }

    // ============================================================
    // VERIFY OTP COOKIE
    // ============================================================

    const otpToken =
      request.cookies.get(
        TESTER_SIGNUP_OTP_COOKIE
      )?.value;

    const result =
      verifyOtpChallenge(
        otpToken,
        mobile,
        otp
      );

    if (
      !result.success
    ) {
      let message =
        "Invalid OTP.";

      if (
        result.reason ===
        "EXPIRED"
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
        "MOBILE_MISMATCH"
      ) {
        message =
          "Mobile number does not match the OTP request.";
      }

      const response =
        NextResponse.json(
          {
            success:
              false,

            message,
          },
          {
            status:
              400,
          }
        );

      // Save incremented attempt count.
      if (
        result.newToken
      ) {
        response.cookies.set(
          TESTER_SIGNUP_OTP_COOKIE,
          result.newToken,
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
              5 * 60,
          }
        );
      }

      return response;
    }

    // ============================================================
    // MOBILE VERIFIED
    // ============================================================

    const verifiedToken =
      createVerifiedToken(
        mobile
      );

    const response =
      NextResponse.json(
        {
          success:
            true,

          message:
            "Mobile number verified successfully.",
        }
      );

    response.cookies.set(
      TESTER_SIGNUP_VERIFIED_COOKIE,
      verifiedToken,
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
          VERIFIED_EXPIRY_SECONDS,
      }
    );

    // OTP challenge is no longer required.
    response.cookies.set(
      TESTER_SIGNUP_OTP_COOKIE,
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
      "TESTER SIGNUP OTP VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to verify OTP.",
      },
      {
        status:
          500,
      }
    );
  }
}