import { NextResponse } from "next/server";

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
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access Task 3 questionnaire.",
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
    } = await context.params;

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

    if (
      testerProfile.approvalStatus !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your tester profile is not approved.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 4. LOAD OWN TESTER CAMPAIGN
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

          campaign: {
            select: {
              id: true,

              productName: true,

              productImage: true,

              brand: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
campaignQuestions: {
  orderBy: {
    questionOrder: "asc",
  },

  select: {
    id: true,
    questionId: true,
    questionText: true,
    questionType: true,
    source: true,
    isRequired: true,
    questionOrder: true,

    question: {
      select: {
        options: {
          orderBy: {
            optionOrder: "asc",
          },

          select: {
            id: true,
            optionText: true,
            optionOrder: true,
          },
        },
      },
    },
  },
},
               },
          },

          tasks: {
            where: {
              taskNumber: 3,
            },

            select: {
              id: true,
              taskNumber: true,
              status: true,

              unlockedAt: true,
              submittedAt: true,
              approvedAt: true,
              rejectedAt: true,

              rejectionReason: true,
            },

            take: 1,
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
    // 5. CAMPAIGN MUST BE ACTIVE FOR TASK WORKFLOW
    // ============================================================

    if (
      testerCampaign.status !==
        "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This campaign is no longer ongoing.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 6. TASK 3
    // ============================================================

    const task3 =
      testerCampaign.tasks[0] ??
      null;

    if (!task3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 record not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 7. TASK 3 ACCESS
    // ============================================================

    /*
     * Allow questionnaire access when Task 3 is:
     *
     * AVAILABLE  -> first submission
     * REJECTED   -> resubmission
     * SUBMITTED  -> can still display read-only context if needed
     * APPROVED   -> can still display completed context if needed
     *
     * LOCKED should not be accessible.
     */

    if (
      task3.status ===
      "LOCKED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is locked. Complete the previous task first.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 8. CURRENT TASK CHECK
    // ============================================================

    /*
     * For AVAILABLE / REJECTED Task 3,
     * currentTask should be 3.
     */

    if (
      (
        task3.status ===
          "AVAILABLE" ||
        task3.status ===
          "REJECTED"
      ) &&
      testerCampaign.currentTask !==
        3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is not the current campaign task.",
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 9. FORMAT QUESTIONS
    // ============================================================

    const questions =
      testerCampaign.campaign
        .campaignQuestions.map(
          (question) => ({
            id:
              question.id,

            questionText:
              question.questionText,

            questionType:
              question.questionType,

            options:
              normalizeOptions(
                question.question?.options
              ),

            isRequired:
              question.isRequired,

            sortOrder:
              question.questionOrder,
          })
        );

    // ============================================================
    // 10. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Task 3 questionnaire fetched successfully.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          campaign: {
            id:
              testerCampaign.campaign.id,

            productName:
              testerCampaign
                .campaign
                .productName,

            productImage:
              testerCampaign
                .campaign
                .productImage,

            brandName:
              testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,
          },

          task: {
            id:
              task3.id,

            taskNumber:
              task3.taskNumber,

            status:
              task3.status,

            unlockedAt:
              task3.unlockedAt,

            submittedAt:
              task3.submittedAt,

            approvedAt:
              task3.approvedAt,

            rejectedAt:
              task3.rejectedAt,

            rejectionReason:
              task3.rejectionReason,

            canSubmit:
              testerCampaign.status ===
                "ONGOING" &&
              testerCampaign.currentTask ===
                3 &&
              (
                task3.status ===
                  "AVAILABLE" ||
                task3.status ===
                  "REJECTED"
              ),
          },

          totalQuestions:
            questions.length,

          questions,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get Task 3 questionnaire error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while loading Task 3 questionnaire.",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// NORMALIZE JSON OPTIONS
// ============================================================

function normalizeOptions(
  value: unknown
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const options =
    value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        if (
          item &&
          typeof item ===
            "object" &&
          "optionText" in item
        ) {
          const optionText =
            (
              item as {
                optionText?: unknown;
              }
            ).optionText;

          return typeof optionText ===
            "string"
            ? optionText
            : null;
        }

        return null;
      })
      .filter(
        (
          item
        ): item is string =>
          typeof item ===
            "string" &&
          item.trim().length >
            0
      );

  return options.length >
    0
    ? options
    : null;
}
