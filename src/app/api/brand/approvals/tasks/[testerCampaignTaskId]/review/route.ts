import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      testerCampaignTaskId: string;
    }>;
  }
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
        { status: 401 }
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
            "Forbidden. Only brands can review Task 3 here.",
        },
        { status: 403 }
      );
    }

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
        { status: 404 }
      );
    }

    const {
      testerCampaignTaskId,
    } = await context.params;

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
            "Invalid testerCampaignTaskId.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const action =
      typeof body.action ===
      "string"
        ? body.action
            .trim()
            .toUpperCase()
        : "";

    const rejectionReason =
      typeof body.rejectionReason ===
      "string"
        ? body.rejectionReason.trim()
        : "";

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      !rejectionReason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        { status: 400 }
      );
    }

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
          status: true,
          testerCampaignId: true,

          testerCampaign: {
            select: {
              id: true,
              status: true,
              currentTask: true,

              campaign: {
                select: {
                  task4Required:
                    true,
                },
              },

              tasks: {
                select: {
                  id: true,
                  taskNumber: true,
                  status: true,
                },
              },
            },
          },

          submissions: {
            where: {
              status:
                "SUBMITTED",
            },

            select: {
              id: true,
              attemptNumber: true,
            },

            orderBy: {
              attemptNumber:
                "desc",
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
            "Task 3 not found or does not belong to your brand.",
        },
        { status: 404 }
      );
    }

    if (
      task.testerCampaign.status !==
        "ONGOING" ||
      task.testerCampaign.currentTask !==
        3 ||
      task.status !==
        "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is no longer awaiting review.",
        },
        { status: 409 }
      );
    }

    const submission =
      task.submissions[0];

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 submission not found.",
        },
        { status: 404 }
      );
    }

    const now =
      new Date();

    // ============================================================
    // REJECT
    // ============================================================

    if (
      action === "REJECT"
    ) {
      await prisma.$transaction(
        async (tx) => {
          await tx.testerTaskSubmission.update({
            where: {
              id:
                submission.id,
            },

            data: {
              status:
                "REJECTED",

              reviewedBy:
                currentUser.userId,

              reviewedAt:
                now,

              rejectionReason,
            },
          });

          await tx.testerCampaignTask.update({
            where: {
              id:
                task.id,
            },

            data: {
              status:
                "REJECTED",

              reviewedBy:
                currentUser.userId,

              rejectedAt:
                now,

              approvedAt:
                null,

              rejectionReason,
            },
          });
        }
      );

      return NextResponse.json(
        {
          success: true,

          message:
            "Task 3 rejected successfully. Tester can resubmit.",

          data: {
            testerCampaignId:
              task.testerCampaignId,

            currentTask: 3,

            taskStatus:
              "REJECTED",
          },
        },
        { status: 200 }
      );
    }

    // ============================================================
    // APPROVE WITH TASK 4
    // ============================================================

    if (
      task.testerCampaign
        .campaign
        .task4Required
    ) {
      const task4 =
        task.testerCampaign
          .tasks.find(
            (item) =>
              item.taskNumber ===
              4
          );

      if (
        !task4 ||
        task4.status !==
          "LOCKED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Task 4 is not available for unlocking.",
          },
          { status: 409 }
        );
      }

      await prisma.$transaction(
        async (tx) => {
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

          await tx.testerCampaignTask.update({
            where: {
              id:
                task.id,
            },

            data: {
              status:
                "APPROVED",

              reviewedBy:
                currentUser.userId,

              approvedAt:
                now,

              rejectedAt:
                null,

              rejectionReason:
                null,
            },
          });

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
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Task 3 approved successfully. Task 4 is now available.",

          data: {
            testerCampaignId:
              task.testerCampaignId,

            currentTask: 4,

            taskStatus:
              "APPROVED",
          },
        },
        { status: 200 }
      );
    }

    // ============================================================
    // APPROVE WITHOUT TASK 4 -> COMPLETE
    // ============================================================

    await prisma.$transaction(
      async (tx) => {
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

        await tx.testerCampaignTask.update({
          where: {
            id:
              task.id,
          },

          data: {
            status:
              "APPROVED",

            reviewedBy:
              currentUser.userId,

            approvedAt:
              now,

            rejectedAt:
              null,

            rejectionReason:
              null,
          },
        });

        await tx.testerCampaign.update({
          where: {
            id:
              task.testerCampaignId,
          },

          data: {
            status:
              "COMPLETED",

            completedAt:
              now,
          },
        });
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Task 3 approved successfully. Campaign completed.",

        data: {
          testerCampaignId:
            task.testerCampaignId,

          campaignStatus:
            "COMPLETED",

          taskStatus:
            "APPROVED",

          completedAt:
            now,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Brand Task 3 review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while reviewing Task 3.",
      },
      { status: 500 }
    );
  }
}