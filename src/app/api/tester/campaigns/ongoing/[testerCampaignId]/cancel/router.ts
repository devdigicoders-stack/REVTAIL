import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      testerCampaignId: string;
    }>;
  }
) {
  try {
    // ============================================================
    // 1. AUTHENTICATED USER
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
      currentUser.role !== "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can cancel campaigns.",
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
    // 3. BODY
    // ============================================================

    const body =
      await request.json();

    const cancellationReason =
      typeof body.cancellationReason ===
      "string"
        ? body.cancellationReason.trim()
        : "";

    // ============================================================
    // 4. TESTER PROFILE
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

    // ============================================================
    // 5. GET OWN TESTER CAMPAIGN
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
              filledSlots: true,
              availableSlots: true,
            },
          },

          tasks: {
            where: {
              taskNumber: 1,
            },

            select: {
              id: true,
              taskNumber: true,
              status: true,
              submittedAt: true,
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
    // 6. MUST BE ONGOING
    // ============================================================

    if (
      testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only ongoing campaigns can be cancelled.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 7. MUST STILL BE TASK 1
    // ============================================================

    if (
      testerCampaign.currentTask !==
      1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign cannot be cancelled after Task 1.",
        },
        {
          status: 400,
        }
      );
    }

    const task1 =
      testerCampaign.tasks[0] ??
      null;

    if (!task1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 1 record not found.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 8. CANNOT CANCEL AFTER TASK 1 SUBMISSION
    // ============================================================

    if (
      task1.submittedAt ||
      task1.status === "SUBMITTED" ||
      task1.status === "APPROVED" ||
      task1.status === "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign cannot be cancelled after Task 1 has been submitted.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      task1.status !==
      "AVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign cannot be cancelled at this stage.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date();

    // ============================================================
    // 9. TRANSACTION
    // ============================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ---------------------------------------------
          // Cancel enrollment
          // ---------------------------------------------

          const cancelledCampaign =
            await tx.testerCampaign.update({
              where: {
                id:
                  testerCampaign.id,
              },

              data: {
                status:
                  "CANCELLED",

                cancelledAt:
                  now,

                cancellationReason:
                  cancellationReason ||
                  null,
              },

              select: {
                id: true,
                campaignId: true,
                status: true,
                cancelledAt: true,
                cancellationReason: true,
              },
            });

          // ---------------------------------------------
          // Restore campaign slot
          // ---------------------------------------------

          const updatedCampaign =
            await tx.campaign.update({
              where: {
                id:
                  testerCampaign.campaignId,
              },

              data: {
                filledSlots: {
                  decrement: 1,
                },

                availableSlots: {
                  increment: 1,
                },
              },

              select: {
                id: true,
                filledSlots: true,
                availableSlots: true,
              },
            });

          return {
            cancelledCampaign,
            updatedCampaign,
          };
        }
      );

    // ============================================================
    // 10. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign cancelled successfully.",

        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Tester campaign cancellation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while cancelling the campaign.",
      },
      {
        status: 500,
      }
    );
  }
}