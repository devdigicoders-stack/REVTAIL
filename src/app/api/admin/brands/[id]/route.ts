// This API route is for Admin to get a single Brand by ID.

import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// GET /api/admin/brands/[id]
// ============================================================

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
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
            "Unauthorized.",
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
            "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. BRAND ID
    // ========================================================

    const { id } =
      await params;

    const brandId =
      Number(id);

    if (
      !Number.isInteger(
        brandId
      ) ||
      brandId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Brand ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. LOAD BRAND
    // ========================================================
    //
    // IMPORTANT:
    //
    // category is now an Interest relation.
    //
    // DO NOT use:
    //
    // category: true
    //
    // That loads the entire Interest record,
    // including DateTime fields.
    //
    // Select only the fields we actually need.
    // ========================================================

    const brand =
      await prisma.brandProfile.findUnique({
        where: {
          id:
            brandId,
        },

        select: {
          // ==================================================
          // BRAND PROFILE
          // ==================================================

          id:
            true,

          userId:
            true,

          companyName:
            true,

          companyType:
            true,

          // ==================================================
          // CATEGORY / INTEREST
          // ==================================================

          categoryId:
            true,

          category: {
            select: {
              id:
                true,

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

          rejectionReason:
            true,

          // ==================================================
          // USER
          // ==================================================

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

          // ==================================================
          // CAMPAIGN COUNT
          // ==================================================

          _count: {
            select: {
              campaigns:
                true,
            },
          },

          // ==================================================
          // LATEST CAMPAIGNS
          // ==================================================

          campaigns: {
            select: {
              id:
                true,

              campaignCode:
                true,

              productName:
                true,

              status:
                true,

              totalSlots:
                true,

              filledSlots:
                true,

              availableSlots:
                true,

              earningAmount:
                true,
            },

            orderBy: {
              id:
                "desc",
            },

            take:
              10,
          },
        },
      });

    // ========================================================
    // 4. BRAND NOT FOUND
    // ========================================================

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 5. FORMAT CAMPAIGNS
    // ========================================================
    //
    // Prisma Decimal is converted to Number for frontend use.
    // ========================================================

    const campaigns =
      brand.campaigns.map(
        (campaign) => ({
          id:
            campaign.id,

          campaignCode:
            campaign.campaignCode,

          productName:
            campaign.productName,

          status:
            campaign.status,

          totalSlots:
            campaign.totalSlots,

          filledSlots:
            campaign.filledSlots,

          availableSlots:
            campaign.availableSlots,

          earningAmount:
            Number(
              campaign.earningAmount
            ),
        })
      );

    // ========================================================
    // 6. FORMAT BRAND RESPONSE
    // ========================================================
    //
    // category stays as a STRING for compatibility with
    // existing frontend code.
    //
    // New relation information is also available through:
    //
    // categoryId
    // categoryDetails
    // ========================================================

    const formattedBrand = {
      id:
        brand.id,

      userId:
        brand.userId,

      companyName:
        brand.companyName,

      companyType:
        brand.companyType,

      // ======================================================
      // CATEGORY
      // ======================================================

      category:
        brand.category
          ?.name ??
        null,

      categoryId:
        brand.categoryId,

      categoryDetails:
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

      rejectionReason:
        brand.rejectionReason,

      // ======================================================
      // USER
      //
      // Keep nested structure because existing Brand detail
      // frontend likely uses:
      //
      // brand.user.email
      // brand.user.mobile
      // brand.user.status
      // ======================================================

      user: {
        email:
          brand.user.email,

        mobile:
          brand.user.mobile,

        status:
          brand.user.status,
      },

      campaignCount:
        brand._count
          .campaigns,

      campaigns,
    };

    // ========================================================
    // 7. RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data:
        formattedBrand,
    });
  } catch (error) {
    console.error(
      "GET ADMIN BRAND DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load Brand.",
      },
      {
        status: 500,
      }
    );
  }
}