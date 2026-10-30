import {
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
// /api/admin/approvals/tasks/[testerCampaignTaskId]/finish
//
// BUSINESS RULE:
//
// Admin may finish a tester campaign directly at Task 3.
//
// Result:
// 1. Task 3 submission -> APPROVED
// 2. Task 3 -> APPROVED
// 3. Unused LOCKED Task 4 -> deleted
// 4. TesterCampaign -> COMPLETED
// 5. currentTask remains 3
// 6. completedAt is set
//
// Existing APPROVE / REJECT API is not changed.
// ============================================================

export async function PATCH(
  _request: Request,
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
            "Forbidden. Admin access required.",
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
    // 3. LOAD TASK 3
    // ========================================================

    const task =
      await prisma.testerCampaignTask.findUnique({
        where: {
          id:
            taskId,
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

                take: 1,
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

            select: {
              id: true,

              status:
                true,

              attemptNumber:
                true,

              task3ReviewDetail: {
                select: {
                  id: true,
                },
              },
            },

            take: 1,
          },
        },
      });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 4. VALIDATE TASK
    // ========================================================

    if (
      task.taskNumber !==
      3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Finish is only allowed for Task 3.",
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
            "Task 3 must be submitted before it can be finished.",
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
      !submission.task3ReviewDetail
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
    // 5. TASK 4 SAFETY
    //
    // Finish is allowed only if Task 4 has never started.
    // A LOCKED Task 4 can safely be removed.
    // ========================================================

    const task4 =
      task.testerCampaign
        .tasks[0] ??
      null;

    if (
      task4 &&
      task4.status !==
        "LOCKED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 has already started and cannot be skipped.",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date();

    // ========================================================
    // 6. FINISH IN ONE TRANSACTION
    // ========================================================

    await prisma.$transaction(
      async (tx) => {
        // Approve the submitted Task 3 attempt.
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

        // Approve Task 3 itself.
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

        // Remove unused Task 4 so tester history/progress
        // contains only Tasks 1, 2 and 3.
        if (task4) {
          await tx.testerCampaignTask.delete({
            where: {
              id:
                task4.id,
            },
          });
        }

        // Complete this tester's campaign.
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
    // 7. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Task 3 approved and tester campaign finished successfully. Task 4 was skipped.",

        data: {
          testerCampaignTaskId:
            task.id,

          testerCampaignId:
            task.testerCampaignId,

          completedAt:
            now.toISOString(),

          finalTask:
            3,

          task4Skipped:
            Boolean(task4),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "FINISH TESTER CAMPAIGN AT TASK 3 ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to finish tester campaign.",
      },
      {
        status: 500,
      }
    );
  }
}
