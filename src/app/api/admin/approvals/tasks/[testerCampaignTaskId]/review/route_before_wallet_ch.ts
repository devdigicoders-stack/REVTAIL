import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
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
    // ============================================================
    // 1. AUTH
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
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only admins can review tasks.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TASK ID
    // ============================================================

    const {
      testerCampaignTaskId,
    } = await context.params;

    const parsedTaskId =
      Number(
        testerCampaignTaskId
      );

    if (
      !Number.isInteger(
        parsedTaskId
      ) ||
      parsedTaskId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid testerCampaignTaskId.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. BODY
    // ============================================================

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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 4. LOAD TASK
    // ============================================================

    const task =
      await prisma.testerCampaignTask.findUnique({
        where: {
          id:
            parsedTaskId,
        },

        select: {
          id: true,

          taskNumber: true,

          status: true,

          testerCampaignId: true,

          testerCampaign: {
            select: {
              id: true,

              status: true,

              currentTask: true,

              testerProfile: {
                select: {
                  fullName: true,

                  user: {
                    select: {
                      mobile: true,
                    },
                  },
                },
              },

              campaign: {
                select: {
                  id: true,

                  productName: true,

                  task4Required: true,
                },
              },

              tasks: {
                select: {
                  id: true,

                  taskNumber: true,

                  status: true,
                },

                orderBy: {
                  taskNumber:
                    "asc",
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

              status: true,
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
            "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 5. SUPPORT TASK 1 - TASK 4
    // ============================================================

    if (
      ![1, 2, 3, 4].includes(
        task.taskNumber
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This task is not supported.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      task.testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign is no longer ongoing.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task.testerCampaign.currentTask !==
      task.taskNumber
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Task ${task.taskNumber} is not the current campaign task.`,
        },
        {
          status: 409,
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
            `Task ${task.taskNumber} is not awaiting review.`,
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 6. CURRENT SUBMISSION
    // ============================================================

    const submission =
      task.submissions[0];

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Submitted attempt not found.",
        },
        {
          status: 404,
        }
      );
    }

    const now =
      new Date();

    // ============================================================
    // 7. REJECT ANY TASK 1 - 4
    // ============================================================

    if (
      action === "REJECT"
    ) {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const rejectedSubmission =
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

            const rejectedTask =
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

            return {
              rejectedSubmission,
              rejectedTask,
            };
          }
        );

      const whatsappResult =
        await sendTaskStatusWhatsApp({
          mobile:
            task.testerCampaign
              .testerProfile
              .user
              .mobile,

          fullName:
            task.testerCampaign
              .testerProfile
              .fullName,

          productName:
            task.testerCampaign
              .campaign
              .productName,

          type:
            "REJECTED",

          taskNumber:
            task.taskNumber,

          rejectionReason,
        });

      return NextResponse.json(
        {
          success: true,

          message:
            `Task ${task.taskNumber} rejected successfully. Tester can resubmit.`,

          whatsappSent:
            whatsappResult.sent,

          whatsappError:
            whatsappResult.error,

          data: {
            testerCampaignId:
              task.testerCampaignId,

            currentTask:
              task.testerCampaign
                .currentTask,

            task: {
              id:
                result.rejectedTask.id,

              taskNumber:
                task.taskNumber,

              status:
                result.rejectedTask
                  .status,

              rejectionReason:
                result.rejectedTask
                  .rejectionReason,
            },
          },
        },
        {
          status: 200,
        }
      );
    }

    // ============================================================
    // 8. TASK 4 APPROVAL
    // FINAL TASK -> COMPLETE CAMPAIGN
    // ============================================================

    if (
      task.taskNumber === 4
    ) {
      if (
        !task.testerCampaign
          .campaign
          .task4Required
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Task 4 is not required for this campaign.",
          },
          {
            status: 400,
          }
        );
      }

      const result =
        await prisma.$transaction(
          async (tx) => {
            // ---------------------------------------------
            // Approve submission
            // ---------------------------------------------

            const approvedSubmission =
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

            // ---------------------------------------------
            // Approve Task 4
            // ---------------------------------------------

            const approvedTask =
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

            // ---------------------------------------------
            // Complete tester campaign
            // ---------------------------------------------

            const completedCampaign =
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

            return {
              approvedSubmission,
              approvedTask,
              completedCampaign,
            };
          }
        );

      const whatsappResult =
        await sendTaskStatusWhatsApp({
          mobile:
            task.testerCampaign
              .testerProfile
              .user
              .mobile,

          fullName:
            task.testerCampaign
              .testerProfile
              .fullName,

          productName:
            task.testerCampaign
              .campaign
              .productName,

          type:
            "COMPLETED",

          taskNumber:
            4,
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Task 4 approved successfully. Campaign completed.",

          whatsappSent:
            whatsappResult.sent,

          whatsappError:
            whatsappResult.error,

          data: {
            testerCampaignId:
              result.completedCampaign
                .id,

            campaignStatus:
              result.completedCampaign
                .status,

            completedAt:
              result.completedCampaign
                .completedAt,

            approvedTask: {
              id:
                result.approvedTask.id,

              taskNumber: 4,

              status:
                result.approvedTask
                  .status,

              approvedAt:
                result.approvedTask
                  .approvedAt,
            },

            submission: {
              id:
                result.approvedSubmission
                  .id,

              status:
                result.approvedSubmission
                  .status,

              attemptNumber:
                result.approvedSubmission
                  .attemptNumber,
            },
          },
        },
        {
          status: 200,
        }
      );
    }

    // ============================================================
    // 9. TASK 3 APPROVAL
    // ============================================================

    if (
      task.taskNumber === 3
    ) {
      const task4Required =
        task.testerCampaign
          .campaign
          .task4Required;

      // ----------------------------------------------------------
      // TASK 4 REQUIRED
      // ----------------------------------------------------------

      if (task4Required) {
        const task4 =
          task.testerCampaign
            .tasks.find(
              (item) =>
                item.taskNumber ===
                4
            );

        if (!task4) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Task 4 record not found.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          task4.status !==
          "LOCKED"
        ) {
          return NextResponse.json(
            {
              success: false,

              message:
                "Task 4 is not locked.",
            },
            {
              status: 409,
            }
          );
        }

        const result =
          await prisma.$transaction(
            async (tx) => {
              const approvedSubmission =
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

              const approvedTask =
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

              const unlockedTask4 =
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

              const testerCampaign =
                await tx.testerCampaign.update({
                  where: {
                    id:
                      task.testerCampaignId,
                  },

                  data: {
                    currentTask: 4,
                  },
                });

              return {
                approvedSubmission,
                approvedTask,
                unlockedTask4,
                testerCampaign,
              };
            }
          );

        const whatsappResult =
          await sendTaskStatusWhatsApp({
            mobile:
              task.testerCampaign
                .testerProfile
                .user
                .mobile,

            fullName:
              task.testerCampaign
                .testerProfile
                .fullName,

            productName:
              task.testerCampaign
                .campaign
                .productName,

            type:
              "APPROVED",

            taskNumber:
              3,

            nextStep:
              "Task 4 is now available.",
          });

        return NextResponse.json(
          {
            success: true,

            message:
              "Task 3 approved successfully. Task 4 is now available.",

            whatsappSent:
              whatsappResult.sent,

            whatsappError:
              whatsappResult.error,

            data: {
              testerCampaignId:
                result.testerCampaign.id,

              currentTask: 4,

              approvedTask: {
                id:
                  result.approvedTask.id,

                taskNumber: 3,

                status:
                  result.approvedTask
                    .status,
              },

              unlockedTask: {
                id:
                  result.unlockedTask4.id,

                taskNumber: 4,

                status:
                  result.unlockedTask4
                    .status,
              },
            },
          },
          {
            status: 200,
          }
        );
      }

      // ----------------------------------------------------------
      // NO TASK 4 -> COMPLETE CAMPAIGN
      // ----------------------------------------------------------

      const result =
        await prisma.$transaction(
          async (tx) => {
            const approvedSubmission =
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

            const approvedTask =
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

            const completedCampaign =
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

            return {
              approvedSubmission,
              approvedTask,
              completedCampaign,
            };
          }
        );

      const whatsappResult =
        await sendTaskStatusWhatsApp({
          mobile:
            task.testerCampaign
              .testerProfile
              .user
              .mobile,

          fullName:
            task.testerCampaign
              .testerProfile
              .fullName,

          productName:
            task.testerCampaign
              .campaign
              .productName,

          type:
            "COMPLETED",

          taskNumber:
            3,
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Task 3 approved successfully. Campaign completed.",

          whatsappSent:
            whatsappResult.sent,

          whatsappError:
            whatsappResult.error,

          data: {
            testerCampaignId:
              result.completedCampaign.id,

            campaignStatus:
              result.completedCampaign
                .status,

            completedAt:
              result.completedCampaign
                .completedAt,
          },
        },
        {
          status: 200,
        }
      );
    }

    // ============================================================
    // 10. TASK 1 / TASK 2
    // APPROVE -> UNLOCK NEXT TASK
    // ============================================================

    const nextTaskNumber =
      task.taskNumber + 1;

    const nextTask =
      task.testerCampaign
        .tasks.find(
          (item) =>
            item.taskNumber ===
            nextTaskNumber
        );

    if (!nextTask) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Task ${nextTaskNumber} record not found.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      nextTask.status !==
      "LOCKED"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Task ${nextTaskNumber} is not locked.`,
        },
        {
          status: 409,
        }
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const approvedSubmission =
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

          const approvedTask =
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

          const unlockedTask =
            await tx.testerCampaignTask.update({
              where: {
                id:
                  nextTask.id,
              },

              data: {
                status:
                  "AVAILABLE",

                unlockedAt:
                  now,
              },
            });

          const updatedCampaign =
            await tx.testerCampaign.update({
              where: {
                id:
                  task.testerCampaignId,
              },

              data: {
                currentTask:
                  nextTaskNumber,
              },
            });

          return {
            approvedSubmission,
            approvedTask,
            unlockedTask,
            updatedCampaign,
          };
        }
      );

    const whatsappResult =
      await sendTaskStatusWhatsApp({
        mobile:
          task.testerCampaign
            .testerProfile
            .user
            .mobile,

        fullName:
          task.testerCampaign
            .testerProfile
            .fullName,

        productName:
          task.testerCampaign
            .campaign
            .productName,

        type:
          "APPROVED",

        taskNumber:
          task.taskNumber,

        nextStep:
          `Task ${nextTaskNumber} is now available.`,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          `Task ${task.taskNumber} approved successfully. Task ${nextTaskNumber} is now available.`,

        whatsappSent:
          whatsappResult.sent,

        whatsappError:
          whatsappResult.error,

        data: {
          testerCampaignId:
            result.updatedCampaign.id,

          currentTask:
            result.updatedCampaign
              .currentTask,

          approvedTask: {
            id:
              result.approvedTask.id,

            taskNumber:
              task.taskNumber,

            status:
              result.approvedTask
                .status,
          },

          unlockedTask: {
            id:
              result.unlockedTask.id,

            taskNumber:
              nextTaskNumber,

            status:
              result.unlockedTask
                .status,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Admin task review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while reviewing the task.",
      },
      {
        status: 500,
      }
    );
  }
}

type TaskWhatsappType =
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

async function sendTaskStatusWhatsApp({
  mobile,
  fullName,
  productName,
  type,
  taskNumber,
  rejectionReason,
  nextStep,
}: {
  mobile:
    | string
    | null;

  fullName:
    string;

  productName:
    string;

  type:
    TaskWhatsappType;

  taskNumber:
    number;

  rejectionReason?:
    string;

  nextStep?:
    string;
}) {
  if (!mobile?.trim()) {
    return {
      sent: false,
      error:
        "Tester mobile number is not available.",
    };
  }

  try {
    // Each task has its own approved/rejected template.
    // A final-task approval still uses that task's APPROVED template.
    const approvedTemplates: Record<number, string | undefined> = {
      1: process.env.WHATSAPP_TEMPLATE_STEP_1_APPROVED,
      2: process.env.WHATSAPP_TEMPLATE_STEP_2_APPROVED,
      3: process.env.WHATSAPP_TEMPLATE_STEP_3_APPROVED,
      4: process.env.WHATSAPP_TEMPLATE_STEP_4_APPROVED,
    };

    const rejectedTemplates: Record<number, string | undefined> = {
      1: process.env.WHATSAPP_TEMPLATE_STEP_1_REJECTED,
      2: process.env.WHATSAPP_TEMPLATE_STEP_2_REJECTED,
      3: process.env.WHATSAPP_TEMPLATE_STEP_3_REJECTED,
      4: process.env.WHATSAPP_TEMPLATE_STEP_4_REJECTED,
    };

    const isRejected = type === "REJECTED";

    const templateName = isRejected
      ? rejectedTemplates[taskNumber]?.trim()
      : approvedTemplates[taskNumber]?.trim();

    if (!templateName) {
      return {
        sent: false,
        error: `WhatsApp template for Task ${taskNumber} ${isRejected ? "rejection" : "approval"} is not configured.`,
      };
    }

    // All eight task templates have exactly two BODY variables:
    // {{1}} = tester full name, {{2}} = campaign/product name.
    // COMPLETED approvals use the corresponding task approval template.
    const parameters = [
      fullName,
      productName,
    ];

    await sendWhatsAppTemplate({
      to: mobile,
      templateName,
      parameters,
      languageCode:
        taskNumber === 2 && !isRejected
          ? process.env.WHATSAPP_TASK_2_APPROVED_LANGUAGE || "en_GB"
          : process.env.WHATSAPP_TASK_STATUS_LANGUAGE || "en",
      callbackData: `tester-task-${taskNumber}-${isRejected ? "rejected" : type === "COMPLETED" ? "completed" : "approved"}`,
    });

    return {
      sent: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "TASK STATUS WHATSAPP ERROR:",
      error
    );

    return {
      sent: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to send WhatsApp notification.",
    };
  }
}

