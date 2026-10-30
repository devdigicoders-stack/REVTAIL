import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import {
  getCurrentUser,
} from "@/lib/current-user";

// ============================================================
// GET /api/brand/analytics/campaigns
//
// Returns only COMPLETED campaigns belonging to the
// currently logged-in Brand.
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // 1. AUTH
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
            "Access denied. Brand only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. BRAND PROFILE
    // ========================================================

    const brandProfile =
      await prisma.brandProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id:
            true,

          companyName:
            true,
        },
      });

    if (!brandProfile) {
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
    // 3. BRAND'S COMPLETED CAMPAIGNS ONLY
    // ========================================================

    const campaigns =
      await prisma.campaign.findMany({
        where: {
          brandId:
            brandProfile.id,

          status:
            "COMPLETED",
        },

        select: {
          id:
            true,

          campaignCode:
            true,

          productName:
            true,

          updatedAt:
            true,

          brand: {
            select: {
              companyName:
                true,
            },
          },
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    // ========================================================
    // 4. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        data:
          campaigns.map(
            (
              campaign
            ) => ({
              id:
                campaign.id,

              campaignCode:
                campaign.campaignCode,

              productName:
                campaign.productName,

              brandName:
                campaign.brand
                  .companyName,

              // Current Campaign implementation does not use a
              // dedicated completedAt field, so updatedAt is used
              // after Admin marks the campaign COMPLETED.
              completedAt:
                campaign.updatedAt.toISOString(),
            })
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET BRAND COMPLETED ANALYTICS CAMPAIGNS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load completed campaigns.",
      },
      {
        status: 500,
      }
    );
  }
}
