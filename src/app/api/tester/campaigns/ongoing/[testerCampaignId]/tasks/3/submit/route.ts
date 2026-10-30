import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RawAnswer = {
  questionId?: unknown;
  answer?: unknown;
};

type NormalizedAnswer = {
  questionId: number;
  answerText: string;
};

export async function POST(
  request: NextRequest,
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
            "Forbidden. Only testers can submit Task 3.",
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
    // 3. REQUEST BODY
    // ============================================================

    const body =
      await request.json();

    const reviewText =
      typeof body.reviewText ===
      "string"
        ? body.reviewText.trim()
        : "";

    const rating =
      Number(
        body.rating
      );

    const rawAnswers: RawAnswer[] =
      Array.isArray(
        body.answers
      )
        ? body.answers
        : [];

    // ============================================================
    // 4. REVIEW VALIDATION
    // ============================================================

    if (!reviewText) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Review text is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reviewText.length <
      10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please write a more detailed review.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        rating
      ) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rating must be between 1 and 5.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 5. NORMALIZE ANSWERS
    // ============================================================

    const normalizedAnswers: NormalizedAnswer[] =
      [];

    for (
      const item
      of rawAnswers
    ) {
      const questionId =
        Number(
          item.questionId
        );

      if (
        !Number.isInteger(
          questionId
        ) ||
        questionId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid questionnaire answer.",
          },
          {
            status: 400,
          }
        );
      }

      let answerText =
        "";

      // Normal text/single-choice answer
      if (
        typeof item.answer ===
        "string"
      ) {
        answerText =
          item.answer.trim();
      }

      // Multiple-choice answer
      else if (
        Array.isArray(
          item.answer
        )
      ) {
        const values =
          item.answer
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                "string"
            )
            .map(
              (value) =>
                value.trim()
            )
            .filter(
              Boolean
            );

        /*
         * answerText is String in Prisma,
         * so preserve multiple selections as JSON.
         */
        answerText =
          JSON.stringify(
            values
          );
      }

      normalizedAnswers.push({
        questionId,
        answerText,
      });
    }

    // No duplicate question IDs

    const uniqueIds =
      new Set(
        normalizedAnswers.map(
          (item) =>
            item.questionId
        )
      );

    if (
      uniqueIds.size !==
      normalizedAnswers.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate questionnaire answers are not allowed.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 6. TESTER PROFILE
    // ============================================================

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
          approvalStatus:
            true,
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
    // 7. LOAD CAMPAIGN + TASK 3 + QUESTIONS
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

          campaignId: true,

          status: true,

          currentTask: true,

          campaign: {
            select: {
              id: true,

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
              taskNumber:
                3,
            },

            select: {
              id: true,

              taskNumber:
                true,

              status:
                true,
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
    // 8. CAMPAIGN STATE
    // ============================================================

    if (
      testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign is not ongoing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      testerCampaign.currentTask !==
      3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is not the current task.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      task3.status ===
      "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 is already submitted and waiting for approval.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task3.status ===
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 has already been approved.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task3.status !==
        "AVAILABLE" &&
      task3.status !==
        "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 cannot be submitted at this stage.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 9. QUESTIONNAIRE VALIDATION
    // ============================================================

    const campaignQuestions =
      testerCampaign
        .campaign
        .campaignQuestions;

    const questionMap =
      new Map(
        campaignQuestions.map(
          (question) => [
            question.id,
            question,
          ]
        )
      );

    // ---------------------------------------------
    // Reject questions belonging to another campaign
    // ---------------------------------------------

    for (
      const answer
      of normalizedAnswers
    ) {
      if (
        !questionMap.has(
          answer.questionId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more questionnaire answers are invalid.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ---------------------------------------------
    // Validate required questions
    // ---------------------------------------------

    for (
      const question
      of campaignQuestions
    ) {
      if (
        !question.isRequired
      ) {
        continue;
      }

      const answer =
        normalizedAnswers.find(
          (item) =>
            item.questionId ===
            question.id
        );

      if (
        !answer ||
        !answer.answerText
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              `Please answer: ${question.questionText}`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // ============================================================
    // 10. VALIDATE CHOICE ANSWERS
    // ============================================================

    for (
      const submittedAnswer
      of normalizedAnswers
    ) {
      const question =
        questionMap.get(
          submittedAnswer.questionId
        );

      if (!question) {
        continue;
      }

      const options =
        question.question?.options
          ?.map(
            (option) =>
              option.optionText.trim()
          )
          .filter(
            (option) =>
              option.length > 0
          ) ??
        [];

      // ---------------------------------------------
      // SINGLE CHOICE
      // ---------------------------------------------

      if (
        question.questionType ===
          "SINGLE_CHOICE" &&
        options.length >
          0 &&
        !options.includes(
          submittedAnswer.answerText
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Invalid answer for: ${question.questionText}`,
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------------------------------
      // MULTIPLE CHOICE
      // ---------------------------------------------

      if (
        question.questionType ===
          "MULTIPLE_CHOICE" &&
        submittedAnswer.answerText
      ) {
        try {
          const selected =
            JSON.parse(
              submittedAnswer.answerText
            );

          if (
            !Array.isArray(
              selected
            ) ||
            selected.some(
              (value) =>
                typeof value !==
                  "string" ||
                !options.includes(
                  value
                )
            )
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  `Invalid answer for: ${question.questionText}`,
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
                `Invalid answer for: ${question.questionText}`,
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    // ============================================================
    // 11. CREATE SUBMISSION
    // ============================================================

    const now =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------------
          // ATTEMPT NUMBER
          // ------------------------------------------------------

          const attemptAggregate =
            await tx.testerTaskSubmission.aggregate({
              where: {
                testerCampaignTaskId:
                  task3.id,
              },

              _max: {
                attemptNumber:
                  true,
              },
            });

          const attemptNumber =
            (
              attemptAggregate
                ._max
                .attemptNumber ??
              0
            ) + 1;

          // ------------------------------------------------------
          // SUBMISSION
          // ------------------------------------------------------

          const submission =
            await tx.testerTaskSubmission.create({
              data: {
                testerCampaignTaskId:
                  task3.id,

                attemptNumber,

                status:
                  "SUBMITTED",

                submittedAt:
                  now,
              },
            });

          // ------------------------------------------------------
          // TASK 3 REVIEW DETAIL
          // ------------------------------------------------------

          const task3Review =
            await tx.task3ReviewDetail.create({
              data: {
                taskSubmissionId:
                  submission.id,

                reviewText,

                rating,
              },
            });

          // ------------------------------------------------------
          // QUESTIONNAIRE ANSWERS
          // ------------------------------------------------------

          if (
            normalizedAnswers.length >
            0
          ) {
            await tx.testerQuestionAnswer.createMany({
              data:
                normalizedAnswers.map(
                  (
                    answer
                  ) => ({
                    task3ReviewDetailId:
                      task3Review.id,

                    campaignQuestionId:
                      answer.questionId,

                    answerText:
                      answer.answerText,
                  })
                ),
            });
          }

          // ------------------------------------------------------
          // TASK → SUBMITTED
          // ------------------------------------------------------

          const updatedTask =
            await tx.testerCampaignTask.update({
              where: {
                id:
                  task3.id,
              },

              data: {
                status:
                  "SUBMITTED",

                submittedAt:
                  now,

                rejectedAt:
                  null,

                rejectionReason:
                  null,
              },
            });

          return {
            submission,
            task3Review,
            updatedTask,
          };
        }
      );

    // ============================================================
    // 12. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          result.submission
            .attemptNumber ===
            1
            ? "Task 3 submitted successfully and is waiting for approval."
            : "Task 3 resubmitted successfully and is waiting for approval.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          taskId:
            result.updatedTask.id,

          taskNumber: 3,

          taskStatus:
            result.updatedTask.status,

          submission: {
            id:
              result.submission.id,

            attemptNumber:
              result.submission
                .attemptNumber,

            status:
              result.submission.status,

            submittedAt:
              result.submission
                .submittedAt,
          },

          review: {
            id:
              result.task3Review.id,

            reviewText:
              result.task3Review
                .reviewText,

            rating:
              result.task3Review.rating,

            answersCount:
              normalizedAnswers.length,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Task 3 submission error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A duplicate Task 3 submission was detected. Please try again.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting Task 3.",
      },
      {
        status: 500,
      }
    );
  }
}