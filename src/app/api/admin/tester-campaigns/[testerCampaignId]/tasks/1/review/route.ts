import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      testerCampaignId: string;
    }>;
  }
) {
  try {
    const { testerCampaignId } = await context.params;

    const parsedTesterCampaignId = Number(testerCampaignId);

    if (
      !Number.isInteger(parsedTesterCampaignId) ||
      parsedTesterCampaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid testerCampaignId.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      adminUserId,
      action,
      rejectionReason,
    } = body;

    const parsedAdminUserId = Number(adminUserId);

    // ------------------------------------------------
    // 1. Validate Admin ID
    // ------------------------------------------------

    if (
      !Number.isInteger(parsedAdminUserId) ||
      parsedAdminUserId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid adminUserId is required.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 2. Validate Action
    // ------------------------------------------------

    const normalizedAction =
      String(action).trim().toUpperCase();

    if (
      normalizedAction !== "APPROVE" &&
      normalizedAction !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    if (
      normalizedAction === "REJECT" &&
      !rejectionReason?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required when rejecting Task 1.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 3. Verify Admin
    // ------------------------------------------------

    const admin = await prisma.user.findUnique({
      where: {
        id: parsedAdminUserId,
      },

      select: {
        id: true,
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin user not found.",
        },
        { status: 404 }
      );
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only Admin can review Task 1.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------
    // 4. Get TesterCampaign + Task 1
    // ------------------------------------------------

    const testerCampaign =
      await prisma.testerCampaign.findUnique({
        where: {
          id: parsedTesterCampaignId,
        },

        select: {
          id: true,
          status: true,
          currentTask: true,

          tasks: {
            where: {
              taskNumber: {
                in: [1, 2],
              },
            },

            select: {
              id: true,
              taskNumber: true,
              status: true,

              submissions: {
                select: {
                  id: true,
                  attemptNumber: true,
                  status: true,
                  submittedAt: true,
                },

                orderBy: {
                  attemptNumber: "desc",
                },
              },
            },

            orderBy: {
              taskNumber: "asc",
            },
          },
        },
      });

    if (!testerCampaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester campaign not found.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // 5. Campaign must be ongoing
    // ------------------------------------------------

    if (testerCampaign.status !== "ONGOING") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tasks can only be reviewed for an ongoing campaign.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 6. Find Task 1
    // ------------------------------------------------

    const task1 = testerCampaign.tasks.find(
      (task) => task.taskNumber === 1
    );

    if (!task1) {
      return NextResponse.json(
        {
          success: false,
          message: "Task 1 not found.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // 7. Task must be SUBMITTED
    // ------------------------------------------------

    if (task1.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 1 must be in SUBMITTED status before review.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 8. Get latest submission
    // ------------------------------------------------

    const latestSubmission =
      task1.submissions.length > 0
        ? task1.submissions[0]
        : null;

    if (!latestSubmission) {
      return NextResponse.json(
        {
          success: false,
          message: "Task 1 submission not found.",
        },
        { status: 404 }
      );
    }

    if (latestSubmission.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Latest Task 1 submission is not awaiting review.",
        },
        { status: 400 }
      );
    }

    // =================================================
    // REJECT TASK 1
    // =================================================

    if (normalizedAction === "REJECT") {
      const now = new Date();

      const result = await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------
          // 1. Reject latest submission
          // ------------------------------------------

          const rejectedSubmission =
            await tx.testerTaskSubmission.update({
              where: {
                id: latestSubmission.id,
              },

              data: {
                status: "REJECTED",

                reviewedBy: parsedAdminUserId,
                reviewedAt: now,

                rejectionReason:
                  rejectionReason.trim(),
              },
            });

          // ------------------------------------------
          // 2. Reject Task 1
          // ------------------------------------------

          const rejectedTask =
            await tx.testerCampaignTask.update({
              where: {
                id: task1.id,
              },

              data: {
                status: "REJECTED",

                reviewedBy: parsedAdminUserId,

                rejectedAt: now,
                approvedAt: null,

                rejectionReason:
                  rejectionReason.trim(),
              },
            });

          return {
            submission: rejectedSubmission,
            task: rejectedTask,
          };
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Task 1 rejected successfully. Tester can resubmit the task.",

          data: {
            testerCampaignId:
              testerCampaign.id,

            taskNumber: 1,

            taskStatus:
              result.task.status,

            submissionId:
              result.submission.id,

            attemptNumber:
              result.submission.attemptNumber,

            submissionStatus:
              result.submission.status,

            rejectionReason:
              result.submission.rejectionReason,
          },
        },
        { status: 200 }
      );
    }

    // =================================================
    // APPROVE TASK 1
    // =================================================

    const task2 = testerCampaign.tasks.find(
      (task) => task.taskNumber === 2
    );

    if (!task2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 record not found. Cannot continue workflow.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        // ------------------------------------------
        // 1. Approve latest Task 1 submission
        // ------------------------------------------

        const approvedSubmission =
          await tx.testerTaskSubmission.update({
            where: {
              id: latestSubmission.id,
            },

            data: {
              status: "APPROVED",

              reviewedBy: parsedAdminUserId,
              reviewedAt: now,

              rejectionReason: null,
            },
          });

        // ------------------------------------------
        // 2. Approve Task 1
        // ------------------------------------------

        const approvedTask1 =
          await tx.testerCampaignTask.update({
            where: {
              id: task1.id,
            },

            data: {
              status: "APPROVED",

              reviewedBy: parsedAdminUserId,

              approvedAt: now,
              rejectedAt: null,

              rejectionReason: null,
            },
          });

        // ------------------------------------------
        // 3. Unlock Task 2
        // ------------------------------------------

        const unlockedTask2 =
          await tx.testerCampaignTask.update({
            where: {
              id: task2.id,
            },

            data: {
              status: "AVAILABLE",
              unlockedAt: now,
            },
          });

        // ------------------------------------------
        // 4. Update current task
        // ------------------------------------------

        const updatedTesterCampaign =
          await tx.testerCampaign.update({
            where: {
              id: testerCampaign.id,
            },

            data: {
              currentTask: 2,
            },
          });

        return {
          approvedSubmission,
          approvedTask1,
          unlockedTask2,
          updatedTesterCampaign,
        };
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Task 1 approved successfully. Task 2 is now available.",

        data: {
          testerCampaignId:
            result.updatedTesterCampaign.id,

          currentTask:
            result.updatedTesterCampaign.currentTask,

          task1: {
            id:
              result.approvedTask1.id,

            status:
              result.approvedTask1.status,

            approvedAt:
              result.approvedTask1.approvedAt,
          },

          task2: {
            id:
              result.unlockedTask2.id,

            status:
              result.unlockedTask2.status,

            unlockedAt:
              result.unlockedTask2.unlockedAt,
          },

          submission: {
            id:
              result.approvedSubmission.id,

            attemptNumber:
              result.approvedSubmission.attemptNumber,

            status:
              result.approvedSubmission.status,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin Task 1 review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while reviewing Task 1.",
      },
      { status: 500 }
    );
  }
}