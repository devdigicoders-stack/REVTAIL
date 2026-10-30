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
          message: "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      currentUser.role !== "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can view Task 4 history.",
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
      Number(testerCampaignId);

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
    // 4. TASK 4 + SUBMISSION HISTORY
    // ============================================================

    const task4 =
      await prisma.testerCampaignTask.findFirst({
        where: {
          taskNumber: 4,

          testerCampaign: {
            id:
              parsedTesterCampaignId,

            testerProfileId:
              testerProfile.id,
          },
        },

        select: {
          id: true,

          status: true,

          approvedAt: true,

          rejectedAt: true,

          rejectionReason: true,

          testerCampaign: {
            select: {
              id: true,

              status: true,

              completedAt: true,

              campaign: {
                select: {
                  id: true,

                  productName: true,

                  productImage: true,

                  task4Required: true,

                  brand: {
                    select: {
                      companyName: true,
                    },
                  },
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
                },
              },

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
      });

    if (!task4) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 not found for this campaign.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 5. FORMAT HISTORY
    // ============================================================

    const history =
      task4.submissions.map(
        (submission) => ({
          submissionId:
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

          publishDetail:
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
      );

    // ============================================================
    // 6. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Task 4 approval history fetched successfully.",

        data: {
          testerCampaignId:
            task4
              .testerCampaign.id,

          campaign: {
            id:
              task4
                .testerCampaign
                .campaign.id,

            productName:
              task4
                .testerCampaign
                .campaign
                .productName,

            productImage:
              task4
                .testerCampaign
                .campaign
                .productImage,

            brandName:
              task4
                .testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,
          },

          task: {
            id:
              task4.id,

            taskNumber: 4,

            status:
              task4.status,

            approvedAt:
              task4.approvedAt,

            rejectedAt:
              task4.rejectedAt,

            rejectionReason:
              task4.rejectionReason,
          },

          testerCampaignStatus:
            task4
              .testerCampaign
              .status,

          completedAt:
            task4
              .testerCampaign
              .completedAt,

          totalAttempts:
            history.length,

          history,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Task 4 history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while loading Task 4 approval history.",
      },
      {
        status: 500,
      }
    );
  }
}

function getReviewerType(
  role: string
) {
  if (
    role === "ADMIN"
  ) {
    return "Admin";
  }

  if (
    role === "BRAND"
  ) {
    return "Brand";
  }

  return role;
}