import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// ROUTE PARAM TYPE
// ============================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ============================================================
// GET CAMPAIGN DETAIL
//
// ADMIN
//   -> can view any campaign
//
// BRAND
//   -> can view only own campaign
//
// Used by:
//   Brand campaign detail
//   Admin approval detail
//   Admin LIVE campaign detail
// ============================================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
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
        "ADMIN" &&
      currentUser.role !==
        "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only Admin or Brand can view campaign details.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      id,
    } =
      await context.params;

    const campaignId =
      Number(id);

    if (
      !Number.isInteger(
        campaignId
      ) ||
      campaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid campaign ID.",
        },
        {
          status: 400,
        }
      );
    }

    let brandProfileId:
      number | null =
      null;

    if (
      currentUser.role ===
      "BRAND"
    ) {
      const brandProfile =
        await prisma.brandProfile.findUnique({
          where: {
            userId:
              currentUser.userId,
          },

          select: {
            id: true,
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

      brandProfileId =
        brandProfile.id;
    }

    const campaign =
      await prisma.campaign.findFirst({
        where: {
          id:
            campaignId,

          ...(currentUser.role ===
          "BRAND"
            ? {
                brandId:
                  brandProfileId!,
              }
            : {}),
        },

        select: {
          id: true,

          campaignCode:
            true,

          productName:
            true,

          productImage:
            true,

          productLink:
            true,

          productDescription:
            true,

          earningAmount:
            true,

          currency:
            true,

          totalSlots:
            true,

          filledSlots:
            true,

          availableSlots:
            true,

          targetGender:
            true,

          targetState:
            true,

          targetCity:
            true,

          startDate:
            true,

          endDate:
            true,

          task4Required:
            true,

          status:
            true,

          submittedAt:
            true,

          approvedAt:
            true,

          rejectedAt:
            true,

          rejectionReason:
            true,

          createdBy:
            true,

          approvedBy:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          brand: {
            select: {
              id: true,

              companyName:
                true,

              companyType:
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
            },
          },

          images: {
            orderBy: {
              imageOrder:
                "asc",
            },

            select: {
              id: true,

              imagePath:
                true,

              imageOrder:
                true,
            },
          },

          campaignQuestions: {
            orderBy: {
              questionOrder:
                "asc",
            },

            select: {
              id: true,

              questionId:
                true,

              questionText:
                true,

              questionType:
                true,

              source:
                true,

              isRequired:
                true,

              questionOrder:
                true,

              question: {
                select: {
                  id: true,

                  options: {
                    orderBy: {
                      optionOrder:
                        "asc",
                    },

                    select: {
                      id: true,

                      optionText:
                        true,

                      optionOrder:
                        true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              testerApplications:
                true,

              testerCampaigns:
                true,
            },
          },
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,

          message:
            currentUser.role ===
            "BRAND"
              ? "Campaign not found or you do not have permission to view it."
              : "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign details fetched successfully.",

        data: {
          ...campaign,

          earningAmount:
            Number(
              campaign.earningAmount
            ),

          applicationCount:
            campaign._count
              .testerApplications,

          enrolledCount:
            campaign._count
              .testerCampaigns,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/campaigns/[id] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch campaign details.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PATCH CAMPAIGN
//
// ADMIN ONLY
//
// Allows Admin to update:
//
//   earningAmount
//   totalSlots
//   productLink
//
// Only LIVE campaigns can be changed.
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
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
            "Access denied. Only Admin can edit campaign earning, slots and Product Link.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      id,
    } =
      await context.params;

    const campaignId =
      Number(id);

    if (
      !Number.isInteger(
        campaignId
      ) ||
      campaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid campaign ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const earningAmount =
      Number(
        body.earningAmount
      );

    const totalSlots =
      Number(
        body.totalSlots
      );

    const productLink =
      typeof body.productLink ===
      "string"
        ? body.productLink.trim()
        : "";

    if (
      !Number.isFinite(
        earningAmount
      ) ||
      earningAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Earning amount must be greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        totalSlots
      ) ||
      totalSlots <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Total slots must be a whole number greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (!productLink) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product Link is required.",
        },
        {
          status: 400,
        }
      );
    }

    try {
      const url =
        new URL(
          productLink
        );

      if (
        url.protocol !==
          "http:" &&
        url.protocol !==
          "https:"
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Product Link must start with http:// or https://.",
          },
          {
            status: 400,
          }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "Please enter a valid Product Link.",
        },
        {
          status: 400,
        }
      );
    }

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id:
            campaignId,
        },

        select: {
          id: true,

          campaignCode:
            true,

          productName:
            true,

          productLink:
            true,

          status:
            true,

          earningAmount:
            true,

          totalSlots:
            true,

          filledSlots:
            true,

          availableSlots:
            true,
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    // if (
    //   campaign.status !==
    //   "LIVE"
    // ) {
    //   return NextResponse.json(
    //     {
    //       success: false,

    //       message:
    //         "Only LIVE campaigns can be edited from the Live Campaign management screen.",
    //     },
    //     {
    //       status: 400,
    //     }
    //   );
    // }
    const editableStatuses = [
      "SUBMITTED",
      "LIVE",
    ];

    if (
      !editableStatuses.includes(
        campaign.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Only SUBMITTED or LIVE campaigns can be edited by Admin.",
        },
        {
          status: 400,
        }
      );
    }
    if (
      totalSlots <
      campaign.filledSlots
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Total slots cannot be less than ${campaign.filledSlots} because ${campaign.filledSlots} slots are already filled.`,
        },
        {
          status: 400,
        }
      );
    }

    const availableSlots =
      totalSlots -
      campaign.filledSlots;

    const updatedCampaign =
      await prisma.campaign.update({
        where: {
          id:
            campaignId,
        },

        data: {
          earningAmount,

          totalSlots,

          availableSlots,

          productLink,
        },

        select: {
          id: true,

          campaignCode:
            true,

          productName:
            true,

          productLink:
            true,

          status:
            true,

          earningAmount:
            true,

          currency:
            true,

          totalSlots:
            true,

          filledSlots:
            true,

          availableSlots:
            true,

          updatedAt:
            true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign earning amount, slots and Product Link updated successfully.",

        data: {
          ...updatedCampaign,

          earningAmount:
            Number(
              updatedCampaign.earningAmount
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/campaigns/[id] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update campaign.",
      },
      {
        status: 500,
      }
    );
  }
}