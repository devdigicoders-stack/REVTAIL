import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      testerCampaignId: string;
    }>;
  }
) {
  try {
    // ============================================================
    // 1. AUTHENTICATED USER
    // ============================================================

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
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access task progress.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TESTER CAMPAIGN ID
    // ============================================================

    const {
      testerCampaignId,
    } =
      await context.params;

    const parsedTesterCampaignId =
      Number(
        testerCampaignId
      );

    if (
      !Number.isInteger(
        parsedTesterCampaignId
      ) ||
      parsedTesterCampaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid testerCampaignId.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. TESTER PROFILE
    // ============================================================

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
          approvalStatus: true,
        },
      });

    if (!testerProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 4. FETCH OWN TESTER CAMPAIGN
    // ============================================================

    const testerCampaign =
      await prisma.testerCampaign.findFirst({
        where: {
          id:
            parsedTesterCampaignId,

          testerProfileId:
            testerProfile.id,
        },

        select: {
          id: true,

          status: true,

          currentTask: true,

          earningAmount: true,

          joinedAt: true,
          startedAt: true,

          completedAt: true,

          cancelledAt: true,
          cancellationReason: true,

          campaign: {
            select: {
              id: true,

              productName: true,
              productImage: true,
              productDescription: true,
              productLink: true,

              task4Required: true,

              brand: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },

          tasks: {
            select: {
              id: true,

              taskNumber: true,

              status: true,

              unlockedAt: true,

              submittedAt: true,

              approvedAt: true,

              rejectedAt: true,

              rejectionReason: true,

              submissions: {
                select: {
                  id: true,

                  attemptNumber: true,

                  status: true,

                  submittedAt: true,

                  reviewedAt: true,

                  rejectionReason: true,
                },

                orderBy: {
                  attemptNumber:
                    "desc",
                },

                take: 1,
              },

              _count: {
                select: {
                  submissions: true,
                },
              },
            },

            orderBy: {
              taskNumber:
                "asc",
            },
          },
        },
      });

    if (!testerCampaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 5. FORMAT TASKS
    // ============================================================

    const tasks =
      testerCampaign.tasks.map(
        (task) => {
          const latestSubmission =
            task.submissions[0] ??
            null;

          const isCurrent =
            testerCampaign.currentTask ===
            task.taskNumber;

          const canSubmit =
            testerCampaign.status ===
              "ONGOING" &&
            isCurrent &&
            (
              task.status ===
                "AVAILABLE" ||
              task.status ===
                "REJECTED"
            );

          return {
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

            latestSubmission:
              latestSubmission
                ? {
                    id:
                      latestSubmission.id,

                    attemptNumber:
                      latestSubmission.attemptNumber,

                    status:
                      latestSubmission.status,

                    submittedAt:
                      latestSubmission.submittedAt,

                    reviewedAt:
                      latestSubmission.reviewedAt,

                    rejectionReason:
                      latestSubmission.rejectionReason,
                  }
                : null,

            isCurrent,

            canSubmit,

            waitingForApproval:
              task.status ===
              "SUBMITTED",

            isCompleted:
              task.status ===
              "APPROVED",
          };
        }
      );

    // ============================================================
    // 6. CURRENT TASK
    // ============================================================

    const currentTask =
      tasks.find(
        (task) =>
          task.taskNumber ===
          testerCampaign.currentTask
      ) ?? null;

    // ============================================================
    // 7. PROGRESS
    // ============================================================

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
            (
              approvedTasks /
              totalTasks
            ) *
              100
          )
        : 0;

    // ============================================================
    // 8. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign task progress fetched successfully.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          campaign: {
            id:
              testerCampaign
                .campaign.id,

            productName:
              testerCampaign
                .campaign
                .productName,

            productImage:
              testerCampaign
                .campaign
                .productImage,

            productDescription:
              testerCampaign
                .campaign
                .productDescription,

            productLink:
              testerCampaign
                .campaign
                .productLink,

            brandName:
              testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,

            task4Required:
              testerCampaign
                .campaign
                .task4Required,
          },

          campaignStatus:
            testerCampaign.status,

          currentTaskNumber:
            testerCampaign.currentTask,

          currentTask,

          progress: {
            approvedTasks,
            totalTasks,
            percentage,
          },

          earningAmount:
            testerCampaign
              .earningAmount,

          joinedAt:
            testerCampaign
              .joinedAt,

          startedAt:
            testerCampaign
              .startedAt,

          completedAt:
            testerCampaign
              .completedAt,

          cancelledAt:
            testerCampaign
              .cancelledAt,

          cancellationReason:
            testerCampaign
              .cancellationReason,

          tasks,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get tester task progress error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching task progress.",
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
  switch (taskNumber) {
    case 1:
      return "Buy Product";

    case 2:
      return "Product Received";

    case 3:
      return "Write Review & Rating";

    case 4:
      return "Copy/Paste Review";

    default:
      return `Task ${taskNumber}`;
  }
}