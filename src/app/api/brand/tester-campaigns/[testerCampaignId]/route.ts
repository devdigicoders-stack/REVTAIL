import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{ testerCampaignId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "BRAND") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Brand access required." },
        { status: 403 }
      );
    }

    const { testerCampaignId } = await context.params;
    const parsedId = Number(testerCampaignId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid tester campaign ID." },
        { status: 400 }
      );
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { success: false, message: "Brand profile not found." },
        { status: 404 }
      );
    }

    const testerCampaign = await prisma.testerCampaign.findFirst({
      where: {
        id: parsedId,
        campaign: {
          brandId: brandProfile.id,
        },
      },
      select: {
        id: true,
        status: true,
        currentTask: true,
        earningAmount: true,
        joinedAt: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        cancellationReason: true,
        testerProfile: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            ageCategory: true,
            city: true,
            state: true,
            pinCode: true,
            profileImage: true,
            instagramId: true,
            user: {
              select: {
                email: true,
                mobile: true,
              },
            },
          },
        },
        campaign: {
          select: {
            id: true,
            campaignCode: true,
            productName: true,
            productImage: true,
            task4Required: true,
            status: true,
          },
        },
        tasks: {
          orderBy: { taskNumber: "asc" },
          select: {
            id: true,
            taskNumber: true,
            status: true,
            unlockedAt: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            submissions: {
              orderBy: { attemptNumber: "desc" },
              take: 1,
              select: {
                id: true,
                attemptNumber: true,
                status: true,
                submittedAt: true,
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
                    id: true,
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
            "Tester campaign not found or does not belong to this Brand.",
        },
        { status: 404 }
      );
    }

    const tasks = testerCampaign.tasks.map((task) => {
      const submission = task.submissions[0] ?? null;

      return {
        id: task.id,
        taskNumber: task.taskNumber,
        status: task.status,
        unlockedAt: task.unlockedAt,
        submittedAt: task.submittedAt,
        approvedAt: task.approvedAt,
        rejectedAt: task.rejectedAt,
        rejectionReason: task.rejectionReason,
        latestSubmission: submission
          ? {
              id: submission.id,
              attemptNumber: submission.attemptNumber,
              status: submission.status,
              submittedAt: submission.submittedAt,
              task1Purchase: submission.task1PurchaseDetail
                ? {
                    orderId: submission.task1PurchaseDetail.orderId,
                    purchaseAmount: Number(
                      submission.task1PurchaseDetail.purchaseAmount
                    ),
                    proofImage: submission.task1PurchaseDetail.proofImage,
                  }
                : null,
              task2Received: submission.task2ReceivedDetail
                ? {
                    proofImage: submission.task2ReceivedDetail.proofImage,
                  }
                : null,
              task3Review: submission.task3ReviewDetail
                ? {
                    id: submission.task3ReviewDetail.id,
                    reviewText: submission.task3ReviewDetail.reviewText,
                    rating: submission.task3ReviewDetail.rating,
                    answers: submission.task3ReviewDetail.answers.map(
                      (answer) => ({
                        id: answer.id,
                        answerText: answer.answerText,
                        question: {
                          id: answer.campaignQuestion.id,
                          text: answer.campaignQuestion.questionText,
                          type: answer.campaignQuestion.questionType,
                          order: answer.campaignQuestion.questionOrder,
                        },
                      })
                    ),
                  }
                : null,
              task4Publish: submission.task4PublishDetail
                ? {
                    id: submission.task4PublishDetail.id,
                    publishedUrl: submission.task4PublishDetail.publishedUrl,
                    proofImage: submission.task4PublishDetail.proofImage,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Tester campaign progress fetched successfully.",
      data: {
        testerCampaign: {
          id: testerCampaign.id,
          status: testerCampaign.status,
          currentTask: testerCampaign.currentTask,
          earningAmount: Number(testerCampaign.earningAmount),
          joinedAt: testerCampaign.joinedAt,
          startedAt: testerCampaign.startedAt,
          completedAt: testerCampaign.completedAt,
          cancelledAt: testerCampaign.cancelledAt,
          cancellationReason: testerCampaign.cancellationReason,
        },
        campaign: testerCampaign.campaign,
        tester: {
          id: testerCampaign.testerProfile.id,
          fullName: testerCampaign.testerProfile.fullName,
          gender: testerCampaign.testerProfile.gender,
          ageCategory: testerCampaign.testerProfile.ageCategory,
          city: testerCampaign.testerProfile.city,
          state: testerCampaign.testerProfile.state,
          pinCode: testerCampaign.testerProfile.pinCode,
          profileImage: testerCampaign.testerProfile.profileImage,
          instagramId: testerCampaign.testerProfile.instagramId,
          email: testerCampaign.testerProfile.user.email,
          mobile: testerCampaign.testerProfile.user.mobile,
        },
        tasks,
      },
    });
  } catch (error) {
    console.error("GET BRAND TESTER CAMPAIGN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch tester campaign progress.",
      },
      { status: 500 }
    );
  }
}
