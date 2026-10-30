import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// DATE HELPER
// ============================================================

function safeDate(
  value: Date | string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

// ============================================================
// GET ADMIN ACCOUNT
// ============================================================

export async function GET() {
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
      currentUser.role !== "ADMIN"
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

    // ========================================================
    // LOAD USER
    // ========================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            currentUser.userId,
        },

        select: {
          id: true,

          email: true,

          mobile: true,

          role: true,

          status: true,

          lastLoginAt:
            true,

          createdAt:
            true,

          adminProfile: {
            select: {
              id: true,

              fullName:
                true,

              designation:
                true,

              profileImage:
                true,

              updatedAt:
                true,
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !user.adminProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // IMPORTANT
    //
    // Do not send raw Date objects.
    // Convert them explicitly.
    // ========================================================

    const data = {
      userId:
        user.id,

      adminProfileId:
        user.adminProfile.id,

      fullName:
        user.adminProfile.fullName,

      designation:
        user.adminProfile.designation,

      profileImage:
        user.adminProfile.profileImage,

      email:
        user.email,

      mobile:
        user.mobile,

      role:
        user.role,

      status:
        user.status,

      lastLoginAt:
        safeDate(
          user.lastLoginAt
        ),

      createdAt:
        safeDate(
          user.createdAt
        ),

      updatedAt:
        safeDate(
          user.adminProfile.updatedAt
        ),
    };

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ADMIN ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load account information.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// UPDATE ADMIN ACCOUNT
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
      currentUser.role !== "ADMIN"
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

    const fullName =
      typeof body.fullName ===
      "string"
        ? body.fullName.trim()
        : "";

    const designation =
      typeof body.designation ===
      "string"
        ? body.designation.trim()
        : "";

    const mobile =
      typeof body.mobile ===
      "string"
        ? body.mobile
            .trim()
            .replace(
              /\s+/g,
              ""
            )
        : "";

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fullName.length >
      100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      designation.length >
      100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Designation cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      mobile &&
      !/^\d{10}$/.test(
        mobile
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid 10-digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // MOBILE UNIQUE VALIDATION
    // ========================================================

    if (mobile) {
      const existingUser =
        await prisma.user.findFirst({
          where: {
            mobile,

            id: {
              not:
                currentUser.userId,
            },
          },

          select: {
            id: true,
          },
        });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,

            message:
              "This mobile number is already being used by another account.",
          },
          {
            status: 409,
          }
        );
      }
    }

    // ========================================================
    // UPDATE
    // ========================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          const user =
            await tx.user.update({
              where: {
                id:
                  currentUser.userId,
              },

              data: {
                mobile:
                  mobile ||
                  null,
              },

              select: {
                id: true,

                email: true,

                mobile: true,

                role: true,

                status: true,
              },
            });

          const profile =
            await tx.adminProfile.update({
              where: {
                userId:
                  currentUser.userId,
              },

              data: {
                fullName,

                designation:
                  designation ||
                  null,
              },

              select: {
                id: true,

                fullName:
                  true,

                designation:
                  true,

                profileImage:
                  true,
              },
            });

          return {
            user,
            profile,
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "Account updated successfully.",

      data: {
        id:
          result.profile.id,

        fullName:
          result.profile.fullName,

        designation:
          result.profile.designation,

        profileImage:
          result.profile.profileImage,

        email:
          result.user.email,

        mobile:
          result.user.mobile,

        role:
          result.user.role,

        status:
          result.user.status,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE ADMIN ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to update account.",
      },
      {
        status: 500,
      }
    );
  }
}