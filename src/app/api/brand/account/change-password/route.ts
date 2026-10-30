import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

// ============================================================
// POST
// /api/brand/account/change-password
// BRAND ONLY
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

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
      "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Brand access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. REQUEST BODY
    // ========================================================

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
    // 3. BASIC VALIDATION
    // ========================================================

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Confirm password is required.",
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
            "New password must be at least 8 characters long.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // PASSWORD COMPLEXITY
    // ========================================================

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (
      !passwordPattern.test(
        newPassword
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must contain at least one uppercase letter, one lowercase letter and one number.",
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
            "New password and confirmation password do not match.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. LOAD BRAND PROFILE + USER
    //
    // We deliberately resolve the User through BrandProfile.
    // This guarantees that the password being checked belongs
    // to the logged-in Brand account.
    // ========================================================

    const brandProfile =
      await prisma.brandProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,

          companyName:
            true,

          userId:
            true,

          user: {
            select: {
              id: true,

              role:
                true,

              email:
                true,

              mobile:
                true,

              password:
                true,

              status:
                true,
            },
          },
        },
      });

    if (!brandProfile) {
      console.error(
        "CHANGE PASSWORD: Brand profile not found",
        {
          currentUserId:
            currentUser.userId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Brand profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    const user =
      brandProfile.user;

    // ========================================================
    // 5. VERIFY USER
    // ========================================================

    if (
      user.id !==
      currentUser.userId
    ) {
      console.error(
        "CHANGE PASSWORD USER MISMATCH:",
        {
          tokenUserId:
            currentUser.userId,

          brandUserId:
            user.id,

          brandProfileId:
            brandProfile.id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Authenticated user does not match the Brand account.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      user.role !==
      "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand account required.",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.password) {
      console.error(
        "CHANGE PASSWORD: Password missing",
        {
          userId:
            user.id,

          email:
            user.email,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No password is configured for this account. Please use Forgot Password to set a password.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 6. VERIFY STORED HASH FORMAT
    // ========================================================

    const storedPassword =
      user.password;

    const looksLikeBcryptHash =
      storedPassword.startsWith(
        "$2a$"
      ) ||
      storedPassword.startsWith(
        "$2b$"
      ) ||
      storedPassword.startsWith(
        "$2y$"
      );

    if (!looksLikeBcryptHash) {
      console.error(
        "CHANGE PASSWORD: Existing password is not a bcrypt hash",
        {
          userId:
            user.id,

          email:
            user.email,

          passwordLength:
            storedPassword.length,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Your existing password record needs to be reset. Please use Forgot Password once and then try again.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 7. VERIFY CURRENT PASSWORD
    //
    // Exactly the same approach used by your login API.
    // ========================================================

    const isCurrentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        storedPassword
      );

    console.log(
      "BRAND CHANGE PASSWORD CHECK:",
      {
        userId:
          user.id,

        brandProfileId:
          brandProfile.id,

        role:
          user.role,

        passwordHashValid:
          looksLikeBcryptHash,

        passwordMatched:
          isCurrentPasswordValid,
      }
    );

    if (
      !isCurrentPasswordValid
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
    // 8. NEW PASSWORD MUST DIFFER
    // ========================================================

    const newMatchesOld =
      await bcrypt.compare(
        newPassword,
        storedPassword
      );

    if (newMatchesOld) {
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
    // 9. HASH NEW PASSWORD
    //
    // Existing project already hashes passwords with cost 12.
    // ========================================================

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    // ========================================================
    // 10. SAVE
    // ========================================================

    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        password:
          hashedPassword,
      },

      select: {
        id: true,
      },
    });

    // ========================================================
    // 11. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Password changed successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "BRAND CHANGE PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to change password. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}