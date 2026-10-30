/* 
This route handles fetching all Task 3 approvals for a brand. It checks the current user's role, 
retrieves the brand profile, and fetches all submitted Task 3 tasks along with their associated tester 
and campaign details. The response includes the total number of pending approvals and the detailed 
list of approvals.
*/
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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
      currentUser.role !== "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only brands can access this page.",
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
          companyName: true,
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

    const tasks =
      await prisma.testerCampaignTask.findMany({
        where: {
          taskNumber: 3,

          status:
            "SUBMITTED",

          testerCampaign: {
            campaign: {
              brandId:
                brandProfile.id,
            },
          },
        },

        select: {
          id: true,
          taskNumber: true,
          status: true,
          submittedAt: true,

          testerCampaign: {
            select: {
              id: true,

              testerProfile: {
                select: {
                  id: true,
                  fullName: true,
                  profileImage: true,
                },
              },

              campaign: {
                select: {
                  id: true,
                  productName: true,
                  productImage: true,
                  task4Required: true,
                },
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

            take: 1,

            select: {
              id: true,
              attemptNumber: true,
              submittedAt: true,

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
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          submittedAt:
            "asc",
        },
      });

    const approvals =
      tasks
        .map((task) => {
          const submission =
            task.submissions[0];

          if (
            !submission ||
            !submission.task3ReviewDetail
          ) {
            return null;
          }

          return {
            testerCampaignTaskId:
              task.id,

            testerCampaignId:
              task.testerCampaign.id,

            taskNumber: 3,

            taskTitle:
              "Write Review & Rating",

            submittedAt:
              submission.submittedAt,

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

              task4Required:
                task.testerCampaign
                  .campaign
                  .task4Required,
            },

            submission: {
              id:
                submission.id,

              attemptNumber:
                submission.attemptNumber,

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


                      },
                    })
                  ),
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

    return NextResponse.json(
      {
        success: true,

        message:
          "Brand Task 3 approvals fetched successfully.",

        data: {
          totalPending:
            approvals.length,

          approvals,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Brand Task 3 approvals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching Task 3 approvals.",
      },
      { status: 500 }
    );
  }
}