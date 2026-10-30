import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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
          message: "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only admins can access task approvals.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. LOAD SUBMITTED TASKS 1 - 4
    // ============================================================

    const tasks =
      await prisma.testerCampaignTask.findMany({
        where: {
          taskNumber: {
            in: [1, 2, 3, 4],
          },

          status: "SUBMITTED",
        },

        select: {
          id: true,

          taskNumber: true,

          status: true,

          submittedAt: true,

          testerCampaign: {
            select: {
              id: true,

              status: true,

              currentTask: true,

              testerProfile: {
                select: {
                  id: true,

                  fullName: true,

                  profileImage: true,

                  user: {
                    select: {
                      id: true,

                      email: true,

                      mobile: true,
                    },
                  },
                },
              },

              campaign: {
                select: {
                  id: true,

                  productName: true,

                  productImage: true,

                  earningAmount: true,

                  task4Required: true,

                  brand: {
                    select: {
                      id: true,

                      companyName: true,
                    },
                  },
                },
              },
            },
          },

          submissions: {
            where: {
              status: "SUBMITTED",
            },

            orderBy: {
              attemptNumber: "desc",
            },

            take: 1,

            select: {
              id: true,

              attemptNumber: true,

              status: true,

              submittedAt: true,

              // ==================================================
              // TASK 1
              // ==================================================

              task1PurchaseDetail: {
                select: {
                  orderId: true,

                  purchaseAmount: true,

                  proofImage: true,
                },
              },

              // ==================================================
              // TASK 2
              // ==================================================

              task2ReceivedDetail: {
                select: {
                  proofImage: true,
                },
              },

              // ==================================================
              // TASK 3
              // ==================================================

              task3ReviewDetail: {
                select: {
                  id: true,

                  reviewText: true,

                  rating: true,

                  answers: {
                    select: {
                      id: true,

                      answerText: true,

                      campaignQuestion: {
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
                },
              },

              // ==================================================
              // TASK 4
              // ==================================================

              task4PublishDetail: {
                select: {
                  id: true,

                  publishedUrl: true,

                  proofImage: true,
                },
              },
            },
          },
        },

        orderBy: {
          submittedAt: "asc",
        },
      });

    // ============================================================
    // 3. FORMAT RESPONSE
    // ============================================================

    const approvals =
      tasks
        .map((task) => {
          const submission =
            task.submissions[0] ?? null;

          if (!submission) {
            return null;
          }

          return {
            testerCampaignTaskId:
              task.id,

            testerCampaignId:
              task.testerCampaign.id,

            taskNumber:
              task.taskNumber,

            taskTitle:
              getTaskTitle(
                task.taskNumber
              ),

            taskStatus:
              task.status,

            submittedAt:
              task.submittedAt,

            tester: {
              id:
                task.testerCampaign
                  .testerProfile.id,

              fullName:
                task.testerCampaign
                  .testerProfile
                  .fullName,

              profileImage:
                task.testerCampaign
                  .testerProfile
                  .profileImage,

              email:
                task.testerCampaign
                  .testerProfile
                  .user.email,

              mobile:
                task.testerCampaign
                  .testerProfile
                  .user.mobile,
            },

            campaign: {
              id:
                task.testerCampaign
                  .campaign.id,

              productName:
                task.testerCampaign
                  .campaign
                  .productName,

              productImage:
                task.testerCampaign
                  .campaign
                  .productImage,

              earningAmount:
                task.testerCampaign
                  .campaign
                  .earningAmount,

              task4Required:
                task.testerCampaign
                  .campaign
                  .task4Required,

              brandName:
                task.testerCampaign
                  .campaign
                  .brand
                  ?.companyName ??
                null,
            },

            submission: {
              id:
                submission.id,

              attemptNumber:
                submission.attemptNumber,

              status:
                submission.status,

              submittedAt:
                submission.submittedAt,

              // ==================================================
              // TASK 1
              // ==================================================

              task1Purchase:
                submission.task1PurchaseDetail
                  ? {
                      orderId:
                        submission
                          .task1PurchaseDetail
                          .orderId,

                      purchaseAmount:
                        submission
                          .task1PurchaseDetail
                          .purchaseAmount,

                      proofImage:
                        submission
                          .task1PurchaseDetail
                          .proofImage,
                    }
                  : null,

              // ==================================================
              // TASK 2
              // ==================================================

              task2Received:
                submission.task2ReceivedDetail
                  ? {
                      proofImage:
                        submission
                          .task2ReceivedDetail
                          .proofImage,
                    }
                  : null,

              // ==================================================
              // TASK 3
              // ==================================================

              task3Review:
                submission.task3ReviewDetail
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
                            (answer) => ({
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

                                options:
                                  answer
                                    .campaignQuestion
                                    .question
                                    ?.options ??
                                  [],

                                sortOrder:
                                  answer
                                    .campaignQuestion
                                    .questionOrder,
                              },
                            })
                          ),
                    }
                  : null,

              // ==================================================
              // TASK 4
              // ==================================================

              task4Publish:
                submission.task4PublishDetail
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
            },
          };
        })
        .filter(
          (
            item
          ): item is NonNullable<
            typeof item
          > => item !== null
        );

    // ============================================================
    // 4. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Pending task approvals fetched successfully.",

        data: {
          totalPending:
            approvals.length,

          approvals,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Admin approvals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while fetching task approvals.",
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
      return "Publish Review";

    default:
      return `Task ${taskNumber}`;
  }
}