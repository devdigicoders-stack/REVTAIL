import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ============================================================
// GET TESTERS FOR CAMPAIGN
//
// ADMIN ONLY
//
// GET /api/campaigns/12/testers
// ============================================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

    // ========================================================
    // 2. CAMPAIGN ID
    // ========================================================

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

    // ========================================================
    // 3. LOAD CAMPAIGN + TESTER APPLICATIONS
    // ========================================================

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

          productImage:
            true,

          status:
            true,

          totalSlots:
            true,

          filledSlots:
            true,

          availableSlots:
            true,

          brand: {
            select: {
              id: true,

              companyName:
                true,
            },
          },

          testerApplications: {
            orderBy: {
              appliedAt:
                "desc",
            },

            select: {
              id: true,

              status:
                true,

              appliedAt:
                true,

              reviewedAt:
                true,

              rejectionReason:
                true,

              testerProfile: {
                select: {
                  id: true,

                  fullName:
                    true,

                  gender:
                    true,

                  ageCategory:
                    true,

                  pinCode:
                    true,

                  city:
                    true,

                  state:
                    true,

                  profileImage:
                    true,

                  approvalStatus:
                    true,

                  user: {
                    select: {
                      id: true,

                      email:
                        true,

                      mobile:
                        true,

                      status:
                        true,
                    },
                  },
                },
              },

              testerCampaign: {
                select: {
                  id: true,

                  status:
                    true,

                  currentTask:
                    true,

                  joinedAt:
                    true,

                  startedAt:
                    true,

                  completedAt:
                    true,

                  cancelledAt:
                    true,

                  cancellationReason:
                    true,

                  earningAmount:
                    true,
                },
              },
            },
          },
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

    // ========================================================
    // 4. FORMAT
    // ========================================================

    const testers =
      campaign.testerApplications.map(
        (application) => ({
          applicationId:
            application.id,

          applicationStatus:
            application.status,

          appliedAt:
            application.appliedAt,

          reviewedAt:
            application.reviewedAt,

          rejectionReason:
            application.rejectionReason,

          tester: {
            id:
              application
                .testerProfile.id,

            userId:
              application
                .testerProfile
                .user.id,

            fullName:
              application
                .testerProfile
                .fullName,

            gender:
              application
                .testerProfile
                .gender,

            ageCategory:
              application
                .testerProfile
                .ageCategory,

            pinCode:
              application
                .testerProfile
                .pinCode,

            city:
              application
                .testerProfile
                .city,

            state:
              application
                .testerProfile
                .state,

            profileImage:
              application
                .testerProfile
                .profileImage,

            approvalStatus:
              application
                .testerProfile
                .approvalStatus,

            email:
              application
                .testerProfile
                .user.email,

            mobile:
              application
                .testerProfile
                .user.mobile,

            userStatus:
              application
                .testerProfile
                .user.status,
          },

          testerCampaign:
            application
              .testerCampaign
              ? {
                  id:
                    application
                      .testerCampaign
                      .id,

                  status:
                    application
                      .testerCampaign
                      .status,

                  currentTask:
                    application
                      .testerCampaign
                      .currentTask,

                  earningAmount:
                    Number(
                      application
                        .testerCampaign
                        .earningAmount
                    ),

                  joinedAt:
                    application
                      .testerCampaign
                      .joinedAt,

                  startedAt:
                    application
                      .testerCampaign
                      .startedAt,

                  completedAt:
                    application
                      .testerCampaign
                      .completedAt,

                  cancelledAt:
                    application
                      .testerCampaign
                      .cancelledAt,

                  cancellationReason:
                    application
                      .testerCampaign
                      .cancellationReason,
                }
              : null,
        })
      );

    // ========================================================
    // 5. SUMMARY
    // ========================================================

    const summary = {
      totalApplications:
        testers.length,

      pending:
        testers.filter(
          (item) =>
            item.applicationStatus ===
            "PENDING"
        ).length,

      approved:
        testers.filter(
          (item) =>
            item.applicationStatus ===
            "APPROVED"
        ).length,

      rejected:
        testers.filter(
          (item) =>
            item.applicationStatus ===
            "REJECTED"
        ).length,

      enrolled:
        testers.filter(
          (item) =>
            item.testerCampaign !==
            null
        ).length,
    };

    // ========================================================
    // 6. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          campaign: {
            id:
              campaign.id,

            campaignCode:
              campaign.campaignCode,

            productName:
              campaign.productName,

            productImage:
              campaign.productImage,

            status:
              campaign.status,

            totalSlots:
              campaign.totalSlots,

            filledSlots:
              campaign.filledSlots,

            availableSlots:
              campaign.availableSlots,

            brandName:
              campaign.brand
                .companyName,
          },

          summary,

          testers,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET CAMPAIGN TESTERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load campaign testers.",
      },
      {
        status: 500,
      }
    );
  }
}