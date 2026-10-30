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
            "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. ID
    // ============================================================

    const {
      testerCampaignId,
    } = await context.params;

    const parsedId =
      Number(
        testerCampaignId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
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

          fullName: true,
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
    // 4. COMPLETED CAMPAIGN
    // ============================================================

    const testerCampaign =
      await prisma.testerCampaign.findFirst({
        where: {
          id:
            parsedId,

          testerProfileId:
            testerProfile.id,

          status:
            "COMPLETED",
        },

        select: {
          id: true,

          status: true,

          currentTask: true,

          earningAmount: true,

          joinedAt: true,

          startedAt: true,

          completedAt: true,

          campaign: {
            select: {
              id: true,

              productName: true,

              productImage: true,

              productDescription: true,

              productLink: true,

              task4Required: true,

              startDate: true,

              endDate: true,

              brand: {
                select: {
                  id: true,

                  companyName: true,
                },
              },
            },
          },

          tasks: {
            orderBy: {
              taskNumber:
                "asc",
            },

            select: {
              id: true,

              taskNumber: true,

              status: true,

              unlockedAt: true,

              submittedAt: true,

              approvedAt: true,

              reviewedBy: true,

              reviewer: {
                select: {
                  id: true,

                  role: true,

                  adminProfile: {
                    select: {
                      fullName: true,
                    },
                  },

                  brandProfile: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },

              submissions: {
                orderBy: {
                  attemptNumber:
                    "desc",
                },

                select: {
                  id: true,

                  attemptNumber: true,

                  status: true,

                  submittedAt: true,

                  reviewedAt: true,

                  rejectionReason: true,

                  reviewer: {
                    select: {
                      id: true,

                      role: true,

                      adminProfile: {
                        select: {
                          fullName: true,
                        },
                      },

                      brandProfile: {
                        select: {
                          companyName: true,
                        },
                      },
                    },
                  },

                  task1PurchaseDetail: {
                    select: {
                      orderId: true,

                      purchaseAmount: true,

                      proofImage: true,
                    },
                  },

                  task2ReceivedDetail: {
                    select: {
                      proofImage: true,
                    },
                  },

                  task3ReviewDetail: {
                    select: {
                      reviewText: true,

                      rating: true,

                      answers: {
                        select: {
                          id: true,

                          answerText: true,

                          campaignQuestion: {
                            select: {
                              id: true,

                              questionText: true,

                              questionType: true,

                              questionOrder: true,
                            },
                          },
                        },
                      },
                    },
                  },

                  task4PublishDetail: {
                    select: {
                      publishedUrl: true,

                      proofImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!testerCampaign) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Completed campaign not found.",
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

          reviewer:
            task.reviewer
              ? {
                  id:
                    task.reviewer.id,

                  name:
                    getReviewerName(
                      task.reviewer
                    ),

                  role:
                    task.reviewer.role,

                  reviewerType:
                    getReviewerType(
                      task.reviewer.role
                    ),
                }
              : null,

          attempts:
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

                reviewer:
                  submission.reviewer
                    ? {
                        id:
                          submission
                            .reviewer.id,

                        name:
                          getReviewerName(
                            submission.reviewer
                          ),

                        role:
                          submission
                            .reviewer.role,

                        reviewerType:
                          getReviewerType(
                            submission
                              .reviewer
                              .role
                          ),
                      }
                    : null,

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

                task2Received:
                  submission.task2ReceivedDetail
                    ? {
                        proofImage:
                          submission
                            .task2ReceivedDetail
                            .proofImage,
                      }
                    : null,

                task3Review:
                  submission.task3ReviewDetail
                    ? {
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

                                  sortOrder:
                                    answer
                                      .campaignQuestion
                                      .questionOrder,
                                },
                              })
                            ),
                      }
                    : null,

                task4Publish:
                  submission.task4PublishDetail
                    ? {
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

    // ============================================================
    // 6. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Completed campaign fetched successfully.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          status:
            testerCampaign.status,

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

            // Per-tester effective Task 4 requirement.
            // If Admin finished this tester at Task 3, the unused
            // Task 4 record is removed, so this becomes false.
            task4Required:
              tasks.some(
                (task) =>
                  task.taskNumber ===
                  4
              ),

            brandName:
              testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,

            startDate:
              testerCampaign
                .campaign
                .startDate,

            endDate:
              testerCampaign
                .campaign
                .endDate,
          },

          progress: {
            approvedTasks:
              tasks.filter(
                (task) =>
                  task.status ===
                  "APPROVED"
              ).length,

            totalTasks:
              tasks.length,

            percentage:
              tasks.length >
              0
                ? Math.round(
                    (
                      tasks.filter(
                        (
                          task
                        ) =>
                          task.status ===
                          "APPROVED"
                      ).length /
                      tasks.length
                    ) *
                      100
                  )
                : 0,
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
      "Completed campaign detail error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while loading completed campaign.",
      },
      {
        status: 500,
      }
    );
  }
}

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

function getReviewerName(
  reviewer: {
    role: string;

    adminProfile:
      | {
          fullName: string;
        }
      | null;

    brandProfile:
      | {
          companyName: string;
        }
      | null;
  }
) {
  if (
    reviewer.role ===
    "ADMIN"
  ) {
    return (
      reviewer.adminProfile
        ?.fullName ??
      "Administrator"
    );
  }

  if (
    reviewer.role ===
    "BRAND"
  ) {
    return (
      reviewer.brandProfile
        ?.companyName ??
      "Brand"
    );
  }

  return "Reviewer";
}

function getReviewerType(
  role: string
) {
  switch (role) {
    case "ADMIN":
      return "Admin";

    case "BRAND":
      return "Brand";

    default:
      return role;
  }
}