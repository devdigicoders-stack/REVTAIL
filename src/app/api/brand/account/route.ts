import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

// ============================================================
// GET
// /api/brand/account
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // AUTH
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
    // BRAND PROFILE
    // ========================================================

    const brand =
      await prisma.brandProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,

          userId:
            true,

          companyName:
            true,

          companyType:
            true,

          categoryId:
            true,

          category: {
            select: {
              id: true,

              name:
                true,
            },
          },

          website:
            true,

          pocFullName:
            true,

          pocMobile:
            true,

          designation:
            true,

          approvalStatus:
            true,

          user: {
            select: {
              email:
                true,

              mobile:
                true,

              status:
                true,
            },
          },
        },
      });

    if (!brand) {
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

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data: {
        id:
          brand.id,

        companyName:
          brand.companyName,

        companyType:
          brand.companyType,

        categoryId:
          brand.categoryId,

        category:
          brand.category
            ? {
                id:
                  brand.category.id,

                name:
                  brand.category.name,
              }
            : null,

        website:
          brand.website,

        pocFullName:
          brand.pocFullName,

        pocMobile:
          brand.pocMobile,

        designation:
          brand.designation,

        approvalStatus:
          brand.approvalStatus,

        email:
          brand.user.email,

        mobile:
          brand.user.mobile,

        userStatus:
          brand.user.status,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "GET BRAND ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load Brand account.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PATCH
// /api/brand/account
//
// JSON BODY
//
// Editable:
// - website
// - pocFullName
// - pocMobile
// - designation
// ============================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    // ========================================================
    // AUTH
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
    // CURRENT PROFILE
    // ========================================================

    const existingBrand =
      await prisma.brandProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
        },
      });

    if (!existingBrand) {
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

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      await request.json();

    const website =
      String(
        body.website ??
          ""
      ).trim();

    const pocFullName =
      String(
        body.pocFullName ??
          ""
      ).trim();

    const pocMobile =
      String(
        body.pocMobile ??
          ""
      ).trim();

    const designation =
      String(
        body.designation ??
          ""
      ).trim();

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!pocFullName) {
      return NextResponse.json(
        {
          success: false,

          message:
            "POC Full Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!pocMobile) {
      return NextResponse.json(
        {
          success: false,

          message:
            "POC Mobile is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[0-9]{10}$/.test(
        pocMobile
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "POC Mobile must contain exactly 10 digits.",
        },
        {
          status: 400,
        }
      );
    }

    if (!designation) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Designation is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (website) {
      try {
        const parsed =
          new URL(
            website
          );

        if (
          parsed.protocol !==
            "http:" &&
          parsed.protocol !==
            "https:"
        ) {
          throw new Error();
        }
      } catch {
        return NextResponse.json(
          {
            success: false,

            message:
              "Please enter a valid website URL.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ========================================================
    // DATABASE UPDATE
    // ========================================================

    const updatedBrand =
      await prisma.brandProfile.update({
        where: {
          id:
            existingBrand.id,
        },

        data: {
          website:
            website ||
            null,

          pocFullName,

          pocMobile,

          designation,
        },

        select: {
          id: true,

          companyName:
            true,

          companyType:
            true,

          categoryId:
            true,

          category: {
            select: {
              id: true,

              name:
                true,
            },
          },

          website:
            true,

          pocFullName:
            true,

          pocMobile:
            true,

          designation:
            true,

          approvalStatus:
            true,

          user: {
            select: {
              email:
                true,

              mobile:
                true,

              status:
                true,
            },
          },
        },
      });

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      message:
        "Brand account updated successfully.",

      data: {
        id:
          updatedBrand.id,

        companyName:
          updatedBrand.companyName,

        companyType:
          updatedBrand.companyType,

        categoryId:
          updatedBrand.categoryId,

        category:
          updatedBrand.category,

        website:
          updatedBrand.website,

        pocFullName:
          updatedBrand.pocFullName,

        pocMobile:
          updatedBrand.pocMobile,

        designation:
          updatedBrand.designation,

        approvalStatus:
          updatedBrand.approvalStatus,

        email:
          updatedBrand.user.email,

        mobile:
          updatedBrand.user.mobile,

        userStatus:
          updatedBrand.user.status,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "UPDATE BRAND ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to update Brand account.",
      },
      {
        status: 500,
      }
    );
  }
}