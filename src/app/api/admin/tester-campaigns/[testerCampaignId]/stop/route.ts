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

// PATCH /api/admin/tester-campaigns/[testerCampaignId]/stop
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { testerCampaignId } =
      await context.params;

    const id =
      Number(testerCampaignId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tester campaign ID.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Stop reason is required.",
        },
        { status: 400 }
      );
    }

    if (reason.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Stop reason cannot exceed 2000 characters.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.testerCampaign.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          campaignId: true,
          testerProfile: {
            select: {
              fullName: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester campaign not found.",
        },
        { status: 404 }
      );
    }

    if (existing.status !== "ONGOING") {
      return NextResponse.json(
        {
          success: false,
          message:
            existing.status === "ADMIN_STOPPED"
              ? "This tester has already been stopped from the campaign."
              : "Only an ongoing tester campaign can be stopped.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const currentTesterCampaign =
            await tx.testerCampaign.findUnique({
              where: { id },
              select: {
                id: true,
                status: true,
                campaignId: true,
              },
            });

          if (!currentTesterCampaign) {
            throw new Error(
              "Tester campaign not found."
            );
          }

          if (
            currentTesterCampaign.status !==
            "ONGOING"
          ) {
            throw new Error(
              "Tester campaign is no longer ongoing."
            );
          }

          const campaign =
            await tx.campaign.findUnique({
              where: {
                id: currentTesterCampaign.campaignId,
              },
              select: {
                id: true,
                totalSlots: true,
                filledSlots: true,
                availableSlots: true,
              },
            });

          if (!campaign) {
            throw new Error(
              "Campaign not found."
            );
          }

          const stopped =
            await tx.testerCampaign.update({
              where: { id },
              data: {
                status: "ADMIN_STOPPED",
                stoppedAt: now,
                stoppedBy: currentUser.userId,
                stoppedReason: reason,
              },
              select: {
                id: true,
                status: true,
                stoppedAt: true,
                stoppedReason: true,
              },
            });

          // Release the slot consumed when this tester was enrolled.
          const currentAvailable =
            campaign.availableSlots ??
            Math.max(
              0,
              campaign.totalSlots -
                campaign.filledSlots
            );

          await tx.campaign.update({
            where: {
              id: campaign.id,
            },
            data: {
              filledSlots: Math.max(
                0,
                campaign.filledSlots - 1
              ),
              availableSlots: Math.min(
                campaign.totalSlots,
                currentAvailable + 1
              ),
            },
          });

          return stopped;
        }
      );

    return NextResponse.json({
      success: true,
      message:
        `${existing.testerProfile.fullName} has been stopped from this campaign.`,
      data: result,
    });
  } catch (error) {
    console.error(
      "STOP TESTER CAMPAIGN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to stop tester from campaign.",
      },
      { status: 500 }
    );
  }
}
