import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    testerCampaignId: string;
  }>;
};

// ============================================================
// GET ALL TASK DETAILS FOR ONE TESTER CAMPAIGN
//
// ADMIN ONLY
//
// GET /api/admin/tester-campaigns/15/tasks
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
            "Forbidden. Only Admin can view tester task details.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. TESTER CAMPAIGN ID
    // ========================================================

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
      parsedTesterCampaignId <=
        0
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

    // ========================================================
    // 3. LOAD TESTER CAMPAIGN + ALL TASKS
    // ========================================================

    const testerCampaign =
      await prisma.testerCampaign.findUnique({
        where: {
          id:
            parsedTesterCampaignId,
        },

        select: {
          id: true,

          status: true,

          currentTask: true,

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

          // ==================================================
          // TESTER
          // ==================================================

          testerProfile: {
            select: {
              id: true,

              fullName:
                true,

              profileImage:
                true,

              gender:
                true,

              ageCategory:
                true,

              city:
                true,

              state:
                true,

              user: {
                select: {
                  id: true,

                  email:
                    true,

                  mobile:
                    true,
                },
              },
            },
          },

          // ==================================================
          // CAMPAIGN
          // ==================================================

          campaign: {
            select: {
              id: true,

              campaignCode:
                true,

              productName:
                true,

              productImage:
                true,

              task4Required:
                true,

              earningAmount:
                true,

              status:
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

          // ==================================================
          // ALL TASKS
          // ==================================================

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

              // ==============================================
              // ALL ATTEMPTS / SUBMISSIONS
              // ==============================================

              submissions: {
                orderBy: {
                  attemptNumber:
                    "desc",
                },

                select: {
                  id: true,

                  attemptNumber:
                    true,

                  status:
                    true,

                  submittedAt:
                    true,

                  reviewedAt:
                    true,

                  rejectionReason:
                    true,

                  // ==========================================
                  // TASK 1
                  // ==========================================

                  task1PurchaseDetail: {
                    select: {
                      orderId:
                        true,

                      purchaseAmount:
                        true,

                      proofImage:
                        true,
                    },
                  },

                  // ==========================================
                  // TASK 2
                  // ==========================================

                  task2ReceivedDetail: {
                    select: {
                      proofImage:
                        true,
                    },
                  },

                  // ==========================================
                  // TASK 3
                  // ==========================================

                  task3ReviewDetail: {
                    select: {
                      id: true,

                      reviewText:
                        true,

                      rating:
                        true,

                      answers: {
                        orderBy: {
                          id: "asc",
                        },

                        select: {
                          id: true,

                          answerText:
                            true,

                          campaignQuestion: {
                            select: {
                              id: true,

                              questionText:
                                true,

                              questionType:
                                true,

                              source:
                                true,

                              questionOrder:
                                true,

                              question: {
                                select: {
                                  options: {
                                    orderBy: {
                                      optionOrder:
                                        "asc",
                                    },

                                    select: {
                                      id: true,

                                      optionText:
                                        true,

                                      optionOrder:
                                        true,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },

                  // ==========================================
                  // TASK 4
                  // ==========================================

                  task4PublishDetail: {
                    select: {
                      id: true,

                      publishedUrl:
                        true,

                      proofImage:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (
      !testerCampaign
    ) {
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

    // ========================================================
    // 4. FORMAT TASKS
    // ========================================================

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
            task.submissions.length,

          submissions:
            task.submissions.map(
              (submission) => ({
                id:
                  submission.id,

                attemptNumber:
                  submission.attemptNumber,

                status:
                  submission.status,

                submittedAt:
                  submission.submittedAt,

                reviewedAt:
                  submission.reviewedAt,

                rejectionReason:
                  submission.rejectionReason,

                // ============================================
                // TASK 1
                // ============================================

                task1Purchase:
                  submission
                    .task1PurchaseDetail
                    ? {
                        orderId:
                          submission
                            .task1PurchaseDetail
                            .orderId,

                        purchaseAmount:
                          Number(
                            submission
                              .task1PurchaseDetail
                              .purchaseAmount
                          ),

                        proofImage:
                          submission
                            .task1PurchaseDetail
                            .proofImage,
                      }
                    : null,

                // ============================================
                // TASK 2
                // ============================================

                task2Received:
                  submission
                    .task2ReceivedDetail
                    ? {
                        proofImage:
                          submission
                            .task2ReceivedDetail
                            .proofImage,
                      }
                    : null,

                // ============================================
                // TASK 3
                // ============================================

                task3Review:
                  submission
                    .task3ReviewDetail
                    ? {
                        id:
                          submission
                            .task3ReviewDetail
                            .id,

                        reviewText:
                          submission
                            .task3ReviewDetail
                            .reviewText,

                        rating:
                          submission
                            .task3ReviewDetail
                            .rating,

                        answers:
                          submission
                            .task3ReviewDetail
                            .answers.map(
                              (
                                answer
                              ) => ({
                                id:
                                  answer.id,

                                answerText:
                                  answer.answerText,

                                question: {
                                  id:
                                    answer
                                      .campaignQuestion
                                      .id,

                                  questionText:
                                    answer
                                      .campaignQuestion
                                      .questionText,

                                  questionType:
                                    answer
                                      .campaignQuestion
                                      .questionType,

                                  source:
                                    answer
                                      .campaignQuestion
                                      .source,

                                  questionOrder:
                                    answer
                                      .campaignQuestion
                                      .questionOrder,

                                  options:
                                    answer
                                      .campaignQuestion
                                      .question
                                      ?.options ??
                                    [],
                                },
                              })
                            ),
                      }
                    : null,

                // ============================================
                // TASK 4
                // ============================================

                task4Publish:
                  submission
                    .task4PublishDetail
                    ? {
                        id:
                          submission
                            .task4PublishDetail
                            .id,

                        publishedUrl:
                          submission
                            .task4PublishDetail
                            .publishedUrl,

                        proofImage:
                          submission
                            .task4PublishDetail
                            .proofImage,
                      }
                    : null,
              })
            ),
        })
      );

    // ========================================================
    // 5. PROGRESS
    // ========================================================

    const totalTasks =
      tasks.length;

    const approvedTasks =
      tasks.filter(
        (task) =>
          task.status ===
          "APPROVED"
      ).length;

    const percentage =
      totalTasks > 0
        ? Math.round(
            (approvedTasks /
              totalTasks) *
              100
          )
        : 0;

    // ========================================================
    // 6. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Tester campaign task details fetched successfully.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          tester: {
            id:
              testerCampaign
                .testerProfile.id,

            userId:
              testerCampaign
                .testerProfile
                .user.id,

            fullName:
              testerCampaign
                .testerProfile
                .fullName,

            profileImage:
              testerCampaign
                .testerProfile
                .profileImage,

            gender:
              testerCampaign
                .testerProfile
                .gender,

            ageCategory:
              testerCampaign
                .testerProfile
                .ageCategory,

            city:
              testerCampaign
                .testerProfile
                .city,

            state:
              testerCampaign
                .testerProfile
                .state,

            email:
              testerCampaign
                .testerProfile
                .user.email,

            mobile:
              testerCampaign
                .testerProfile
                .user.mobile,
          },

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

            brandName:
              testerCampaign
                .campaign
                .brand
                .companyName,

            status:
              testerCampaign
                .campaign
                .status,

            task4Required:
              testerCampaign
                .campaign
                .task4Required,
          },

          testerCampaign: {
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
          },

          progress: {
            approvedTasks,

            totalTasks,

            percentage,
          },

          tasks,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN TESTER CAMPAIGN TASK DETAILS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load tester campaign task details.",
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