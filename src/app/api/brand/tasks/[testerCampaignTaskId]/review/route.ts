import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import {
  getCurrentUser,
} from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    testerCampaignTaskId: string;
  }>;
};

// ============================================================
// PATCH
// /api/brand/tasks/[testerCampaignTaskId]/review
//
// BRAND ONLY
//
// Brand can APPROVE Task 3 only.
// Existing Admin task review API remains unchanged.
// ============================================================

export async function PATCH(
  request: NextRequest,
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
    // 2. TASK ID
    // ========================================================

    const {
      testerCampaignTaskId,
    } =
      await context.params;

    const taskId =
      Number(
        testerCampaignTaskId
      );

    if (
      !Number.isInteger(
        taskId
      ) ||
      taskId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid tester campaign task ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. REQUEST BODY
    // ========================================================

    const body =
      await request.json();

    const action =
      String(
        body.action ??
          ""
      )
        .trim()
        .toUpperCase();

    // Brand is only allowed to approve Task 3.
    if (
      action !==
      "APPROVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand can only approve Task 3.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. BRAND PROFILE
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
    // 5. LOAD TASK
    //
    // IMPORTANT:
    // Ensure:
    // - Task belongs to a campaign owned by this Brand
    // - Task is Task 3
    // - Task is SUBMITTED
    // ========================================================

    const task =
      await prisma.testerCampaignTask.findFirst({
        where: {
          id:
            taskId,

          taskNumber:
            3,

          testerCampaign: {
            campaign: {
              brandId:
                brandProfile.id,
            },
          },
        },

        select: {
          id: true,

          taskNumber:
            true,

          status:
            true,

          testerCampaignId:
            true,

          testerCampaign: {
            select: {
              id: true,

              status:
                true,

              currentTask:
                true,

              campaign: {
                select: {
                  id: true,

                  status:
                    true,

                  task4Required:
                    true,

                  brandId:
                    true,
                },
              },

              tasks: {
                where: {
                  taskNumber:
                    4,
                },

                select: {
                  id: true,

                  status:
                    true,
                },

                take:
                  1,
              },
            },
          },

          submissions: {
            where: {
              status:
                "SUBMITTED",
            },

            orderBy: {
              attemptNumber:
                "desc",
            },

            take:
              1,

            select: {
              id: true,

              status:
                true,

              attemptNumber:
                true,

              task3ReviewDetail: {
                select: {
                  id:
                    true,
                },
              },
            },
          },
        },
      });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 not found or does not belong to this Brand.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 6. VALIDATE TASK
    // ========================================================

    if (
      task.taskNumber !==
      3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand can only approve Task 3.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      task.status !==
      "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 must be submitted before approval.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task.testerCampaign
        .status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester campaign is no longer ongoing.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task.testerCampaign
        .currentTask !==
      3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is not the tester's current task.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task.testerCampaign
        .campaign.status !==
      "LIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand can approve Task 3 only for a LIVE campaign.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // 7. LATEST SUBMISSION
    // ========================================================

    const submission =
      task.submissions[0] ??
      null;

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Submitted Task 3 attempt not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !submission
        .task3ReviewDetail
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 review details are missing.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 8. APPROVE TASK 3
    // ========================================================

    const now =
      new Date();

    const hasTask4 =
      task.testerCampaign
        .campaign
        .task4Required;

    const task4 =
      task.testerCampaign
        .tasks[0] ??
      null;

    await prisma.$transaction(
      async (
        tx
      ) => {
        // ====================================================
        // A. APPROVE SUBMISSION
        // ====================================================

        await tx.testerTaskSubmission.update({
          where: {
            id:
              submission.id,
          },

          data: {
            status:
              "APPROVED",

            reviewedBy:
              currentUser.userId,

            reviewedAt:
              now,

            rejectionReason:
              null,
          },
        });

        // ====================================================
        // B. APPROVE TASK 3
        // ====================================================

        await tx.testerCampaignTask.update({
          where: {
            id:
              task.id,
          },

          data: {
            status:
              "APPROVED",

            approvedAt:
              now,

            rejectedAt:
              null,

            reviewedBy:
              currentUser.userId,

            rejectionReason:
              null,
          },
        });

        // ====================================================
        // C. IF TASK 4 IS REQUIRED
        //
        // Unlock Task 4
        // ====================================================

        if (
          hasTask4
        ) {
          if (!task4) {
            throw new Error(
              "Task 4 record is missing."
            );
          }

          if (
            task4.status !==
            "LOCKED"
          ) {
            throw new Error(
              "Task 4 is not in LOCKED state."
            );
          }

          await tx.testerCampaignTask.update({
            where: {
              id:
                task4.id,
            },

            data: {
              status:
                "AVAILABLE",

              unlockedAt:
                now,
            },
          });

          await tx.testerCampaign.update({
            where: {
              id:
                task.testerCampaignId,
            },

            data: {
              currentTask:
                4,
            },
          });

          return;
        }

        // ====================================================
        // D. IF TASK 4 IS NOT REQUIRED
        //
        // Task 3 is final task.
        // Complete tester campaign.
        // ====================================================

        await tx.testerCampaign.update({
          where: {
            id:
              task.testerCampaignId,
          },

          data: {
            status:
              "COMPLETED",

            currentTask:
              3,

            completedAt:
              now,
          },
        });
      }
    );

    // ========================================================
    // 9. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          hasTask4
            ? "Task 3 approved successfully. Task 4 is now available to the tester."
            : "Task 3 approved successfully. Tester campaign has been completed.",

        data: {
          testerCampaignTaskId:
            task.id,

          testerCampaignId:
            task.testerCampaignId,

          taskNumber:
            3,

          status:
            "APPROVED",

          nextTask:
            hasTask4
              ? 4
              : null,

          campaignCompleted:
            !hasTask4,

          reviewedBy:
            currentUser.userId,

          reviewedAt:
            now.toISOString(),
        },
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "BRAND TASK 3 REVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to approve Task 3.",
      },
      {
        status: 500,
      }
    );
  }
}