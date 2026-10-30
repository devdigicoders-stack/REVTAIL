import {
  NextResponse,
} from "next/server";

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
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
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

    const {
      testerCampaignId,
    } = await context.params;

    const id =
      Number(
        testerCampaignId
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
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

    const task =
      await prisma.testerCampaignTask.findFirst({
        where: {
          taskNumber: 3,

          testerCampaign: {
            id,

            testerProfileId:
              testerProfile.id,
          },
        },

        select: {
          id: true,

          status: true,

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

              task3ReviewDetail: {
                select: {
                  reviewText: true,
                  rating: true,
                },
              },
            },
          },
        },
      });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 3 not found.",
        },
        {
          status: 404,
        }
      );
    }

    const history =
      task.submissions.map(
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
                    submission.reviewer.id,

                  role:
                    submission.reviewer.role,

                  reviewerType:
                    submission.reviewer.role ===
                    "ADMIN"
                      ? "Admin"
                      : submission.reviewer.role ===
                          "BRAND"
                        ? "Brand"
                        : submission.reviewer.role,
                }
              : null,

          review:
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
                }
              : null,
        })
      );

    return NextResponse.json(
      {
        success: true,

        data: {
          taskId:
            task.id,

          taskStatus:
            task.status,

          history,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Task 3 history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load Task 3 history.",
      },
      {
        status: 500,
      }
    );
  }
}