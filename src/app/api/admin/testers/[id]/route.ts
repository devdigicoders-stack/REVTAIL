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
// GET TESTER PROFILE + CAMPAIGNS + TASK PROGRESS
//
// ADMIN ONLY
//
// GET /api/admin/testers/7
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
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Admin only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. TESTER PROFILE ID
    // ========================================================

    const {
      id,
    } =
      await context.params;

    const testerProfileId =
      Number(id);

    if (
      !Number.isInteger(
        testerProfileId
      ) ||
      testerProfileId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid tester ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. LOAD TESTER
    // ========================================================

    const tester =
      await prisma.testerProfile.findUnique({
        where: {
          id:
            testerProfileId,
        },

        select: {
          id: true,

          userId:
            true,

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

          instagramId:
            true,

          approvalStatus:
            true,

          approvedAt:
            true,

          rejectionReason:
            true,

          createdAt:
            true,

          updatedAt:
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

              emailVerifiedAt:
                true,

              mobileVerifiedAt:
                true,

              lastLoginAt:
                true,

              createdAt:
                true,
            },
          },

          // ==================================================
          // TESTER INTERESTS
          // ==================================================

          interests: {
            orderBy: {
              interest: {
                name:
                  "asc",
              },
            },

            select: {
              interest: {
                select: {
                  id:
                    true,

                  name:
                    true,
                },
              },
            },
          },

          // ==================================================
          // CAMPAIGNS JOINED BY TESTER
          // ==================================================

          testerCampaigns: {
            orderBy: {
              joinedAt:
                "desc",
            },

            select: {
              id: true,

              status:
                true,

              currentTask:
                true,

              earningAmount:
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

              campaign: {
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

                  task4Required:
                    true,

                  brand: {
                    select: {
                      id: true,

                      companyName:
                        true,
                    },
                  },
                },
              },

              // ==============================================
              // TASK STATUS SUMMARY
              // ==============================================

              tasks: {
                orderBy: {
                  taskNumber:
                    "asc",
                },

                select: {
                  id: true,

                  taskNumber:
                    true,

                  status:
                    true,

                  unlockedAt:
                    true,

                  submittedAt:
                    true,

                  approvedAt:
                    true,

                  rejectedAt:
                    true,

                  rejectionReason:
                    true,

                  _count: {
                    select: {
                      submissions:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    // ========================================================
    // 4. NOT FOUND
    // ========================================================

    if (!tester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 5. FORMAT CAMPAIGNS
    // ========================================================

    const campaigns =
      tester.testerCampaigns.map(
        (
          testerCampaign
        ) => {
          const tasks =
            testerCampaign.tasks.map(
              (task) => ({
                id:
                  task.id,

                taskNumber:
                  task.taskNumber,

                title:
                  getTaskTitle(
                    task.taskNumber
                  ),

                status:
                  task.status,

                unlockedAt:
                  task.unlockedAt,

                submittedAt:
                  task.submittedAt,

                approvedAt:
                  task.approvedAt,

                rejectedAt:
                  task.rejectedAt,

                rejectionReason:
                  task.rejectionReason,

                totalAttempts:
                  task._count
                    .submissions,
              })
            );

          const approvedTasks =
            tasks.filter(
              (task) =>
                task.status ===
                "APPROVED"
            ).length;

          const totalTasks =
            tasks.length;

          const percentage =
            totalTasks > 0
              ? Math.round(
                  (approvedTasks /
                    totalTasks) *
                    100
                )
              : 0;

          return {
            testerCampaignId:
              testerCampaign.id,

            status:
              testerCampaign.status,

            currentTask:
              testerCampaign.currentTask,

            earningAmount:
              Number(
                testerCampaign.earningAmount
              ),

            joinedAt:
              testerCampaign.joinedAt,

            startedAt:
              testerCampaign.startedAt,

            completedAt:
              testerCampaign.completedAt,

            cancelledAt:
              testerCampaign.cancelledAt,

            cancellationReason:
              testerCampaign.cancellationReason,

            campaign: {
              id:
                testerCampaign
                  .campaign.id,

              campaignCode:
                testerCampaign
                  .campaign
                  .campaignCode,

              productName:
                testerCampaign
                  .campaign
                  .productName,

              productImage:
                testerCampaign
                  .campaign
                  .productImage,

              status:
                testerCampaign
                  .campaign
                  .status,

              task4Required:
                testerCampaign
                  .campaign
                  .task4Required,

              brandName:
                testerCampaign
                  .campaign
                  .brand
                  .companyName,
            },

            progress: {
              approvedTasks,

              totalTasks,

              percentage,
            },

            tasks,
          };
        }
      );

    // ========================================================
    // 6. SUMMARY
    // ========================================================

    const summary = {
      totalCampaigns:
        campaigns.length,

      ongoingCampaigns:
        campaigns.filter(
          (item) =>
            item.status ===
            "ONGOING"
        ).length,

      completedCampaigns:
        campaigns.filter(
          (item) =>
            item.status ===
            "COMPLETED"
        ).length,

      cancelledCampaigns:
        campaigns.filter(
          (item) =>
            item.status ===
            "CANCELLED"
        ).length,
    };

    // ========================================================
    // 7. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          tester: {
            id:
              tester.id,

            userId:
              tester.userId,

            fullName:
              tester.fullName,

            gender:
              tester.gender,

            ageCategory:
              tester.ageCategory,

            pinCode:
              tester.pinCode,

            city:
              tester.city,

            state:
              tester.state,

            profileImage:
              tester.profileImage,

            instagramId:
              tester.instagramId,

            interests:
              tester.interests.map(
                (
                  item
                ) => ({
                  id:
                    item.interest.id,

                  name:
                    item.interest.name,
                })
              ),

            approvalStatus:
              tester.approvalStatus,

            approvedAt:
              tester.approvedAt,

            rejectionReason:
              tester.rejectionReason,

            createdAt:
              tester.createdAt,

            updatedAt:
              tester.updatedAt,

            email:
              tester.user.email,

            mobile:
              tester.user.mobile,

            userStatus:
              tester.user.status,

            emailVerifiedAt:
              tester.user
                .emailVerifiedAt,

            mobileVerifiedAt:
              tester.user
                .mobileVerifiedAt,

            lastLoginAt:
              tester.user.lastLoginAt,
          },

          summary,

          campaigns,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ADMIN TESTER DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load tester details.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// TASK TITLE
// ============================================================

function getTaskTitle(
  taskNumber: number
) {
  switch (
    taskNumber
  ) {
    case 1:
      return "Buy Product";

    case 2:
      return "Product Received";

    case 3:
      return "Write Review & Rating";

    case 4:
      return "Publish Review";

    default:
      return `Task ${taskNumber}`;
  }
}