import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{ testerCampaignId: string; taskNumber: string }>;
};

// Read-only: never changes submissions, statuses, or campaign progress.
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    if (currentUser.role !== "TESTER") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    const params = await context.params;
    const testerCampaignId = Number(params.testerCampaignId);
    const taskNumber = Number(params.taskNumber);
    if (
      !Number.isSafeInteger(testerCampaignId) ||
      testerCampaignId <= 0 ||
      ![1, 2, 3, 4].includes(taskNumber)
    ) {
      return NextResponse.json({ success: false, message: "Invalid campaign or task." }, { status: 400 });
    }

    // Ownership check is enforced in the database query, not in the browser.
    const task = await prisma.testerCampaignTask.findFirst({
      where: {
        testerCampaignId,
        taskNumber,
        testerCampaign: { testerProfile: { userId: currentUser.userId } },
      },
      select: {
        id: true,
        taskNumber: true,
        status: true,
        testerCampaign: {
          select: {
            id: true,
            campaign: {
              select: {
                productName: true,
                brand: { select: { companyName: true } },
              },
            },
          },
        },
        submissions: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
            task1PurchaseDetail: {
              select: { orderId: true, purchaseAmount: true, proofImage: true },
            },
            task2ReceivedDetail: {
              select: { proofImage: true },
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
              select: { publishedUrl: true, proofImage: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found." }, { status: 404 });
    }

    // Only submitted or approved tasks can use this view. A rejected task
    // continues to use the existing task form for resubmission.
    if (task.status !== "APPROVED" && task.status !== "SUBMITTED") {
      return NextResponse.json(
        { success: false, message: "Submission details are available for submitted or completed tasks only." },
        { status: 409 }
      );
    }

    const submission = task.submissions[0];
    if (!submission) {
      return NextResponse.json({ success: false, message: "No task submission found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        testerCampaignId,
        taskNumber: task.taskNumber,
        taskStatus: task.status,
        campaign: {
          productName: task.testerCampaign.campaign.productName,
          brandName: task.testerCampaign.campaign.brand?.companyName ?? null,
        },
        submission: {
          id: submission.id,
          attemptNumber: submission.attemptNumber,
          status: submission.status,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
          rejectionReason: submission.rejectionReason,
          task1Purchase: submission.task1PurchaseDetail
            ? {
                orderId: submission.task1PurchaseDetail.orderId,
                purchaseAmount: Number(submission.task1PurchaseDetail.purchaseAmount),
                proofImage: submission.task1PurchaseDetail.proofImage,
              }
            : null,
          task2Received: submission.task2ReceivedDetail
            ? { proofImage: submission.task2ReceivedDetail.proofImage }
            : null,
          task3Review: submission.task3ReviewDetail
            ? {
                reviewText: submission.task3ReviewDetail.reviewText,
                rating: submission.task3ReviewDetail.rating,
                answers: submission.task3ReviewDetail.answers
                  .map((answer) => ({
                    id: answer.id,
                    answerText: answer.answerText,
                    question: {
                      id: answer.campaignQuestion.id,
                      text: answer.campaignQuestion.questionText,
                      type: answer.campaignQuestion.questionType,
                      order: answer.campaignQuestion.questionOrder,
                    },
                  }))
                  .sort((a, b) => a.question.order - b.question.order),
              }
            : null,
          task4Publish: submission.task4PublishDetail
            ? {
                publishedUrl: submission.task4PublishDetail.publishedUrl,
                proofImage: submission.task4PublishDetail.proofImage,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Tester task submission details error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load task submission details." },
      { status: 500 }
    );
  }
}
