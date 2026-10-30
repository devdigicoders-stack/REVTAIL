import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// CHANGE ADMIN PASSWORD
//
// Current password is required.
// ============================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      currentUser.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Admin only.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const currentPassword =
      typeof body.currentPassword ===
      "string"
        ? body.currentPassword
        : "";

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

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Current password, new password and confirmation are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      newPassword.length <
      8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 8 characters.",
        },
        {
          status: 400,
        }
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
            "New password and confirm password do not match.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "New password must be different from the current password.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // LOAD CURRENT PASSWORD
    // ========================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            currentUser.userId,
        },

        select: {
          id: true,
          password: true,
        },
      });

    if (
      !user ||
      !user.password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // VERIFY CURRENT PASSWORD
    // ========================================================

    const passwordValid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (
      !passwordValid
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // HASH NEW PASSWORD
    // ========================================================

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id:
          currentUser.userId,
      },

      data: {
        password:
          passwordHash,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN PASSWORD CHANGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change password.",
      },
      {
        status: 500,
      }
    );
  }
}