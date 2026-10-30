import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

import {
  PASSWORD_RESET_OTP_COOKIE,
  PASSWORD_RESET_VERIFIED_COOKIE,
  verifyPasswordResetVerifiedToken,
} from "@/lib/password-reset-otp";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const newPassword =
      typeof body.newPassword ===
      "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    if (
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password and confirm password are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

    const verifiedToken =
      request.cookies.get(
        PASSWORD_RESET_VERIFIED_COOKIE
      )?.value;

    const resetSession =
      verifyPasswordResetVerifiedToken(
        verifiedToken
      );

    if (!resetSession) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password reset verification has expired. Please start again.",
        },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: resetSession.userId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (
      !user ||
      user.role !==
        resetSession.role
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to reset password.",
        },
        { status: 403 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password:
          hashedPassword,
      },
    });

    const response =
      NextResponse.json({
        success: true,
        message:
          "Password reset successfully. You can now sign in with your new password.",
      });

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
      "RESET PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}
