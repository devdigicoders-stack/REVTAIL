//what is the purpose of this file?
//The purpose of this file is to provide an API endpoint for the admin to 
// review campaign applications submitted by testers. 
// It allows the admin to approve or reject applications,
// ensuring that only valid and eligible applications are processed. 
// The endpoint is protected and requires the user to be authenticated as an admin. 
// It also includes validation checks for the application ID, admin user ID, 
// and action type (approve or reject), as well as handling for various 
// scenarios such as campaign availability and existing tester campaigns.
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      applicationId: string;
    }>;
  }
) {
  try {
    const { applicationId } = await context.params;
    
    const parsedApplicationId = Number(applicationId);

    if (
      !Number.isInteger(parsedApplicationId) ||
      parsedApplicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid applicationId.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      adminUserId,
      action,
      rejectionReason,
    } = body;

    const parsedAdminUserId = Number(adminUserId);

    if (
      !Number.isInteger(parsedAdminUserId) ||
      parsedAdminUserId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid adminUserId is required.",
        },
        { status: 400 }
      );
    }

    const normalizedAction = String(action).toUpperCase();

    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Verify Admin
    // -----------------------------------------

    const admin = await prisma.user.findUnique({
      where: {
        id: parsedAdminUserId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only Admin can review campaign applications.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // Get Application
    // -----------------------------------------

    const application =
      await prisma.campaignApplication.findUnique({
        where: {
          id: parsedApplicationId,
        },

        include: {
          campaign: true,
          testerProfile: true,
          testerCampaign: true,
        },
      });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign application not found.",
        },
        { status: 404 }
      );
    }

    // Application should only be reviewed once
    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `Application is already ${application.status}.`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // REJECT
    // -----------------------------------------

    if (normalizedAction === "REJECT") {
      if (!rejectionReason?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Rejection reason is required.",
          },
          { status: 400 }
        );
      }

      const rejectedApplication =
        await prisma.campaignApplication.update({
          where: {
            id: parsedApplicationId,
          },

          data: {
            status: "REJECTED",
            reviewedBy: parsedAdminUserId,
            reviewedAt: new Date(),
            rejectionReason: rejectionReason.trim(),
          },
        });

      return NextResponse.json(
        {
          success: true,
          message: "Campaign application rejected successfully.",
          data: rejectedApplication,
        },
        { status: 200 }
      );
    }

    // -----------------------------------------
    // APPROVE checks
    // -----------------------------------------

    const campaign = application.campaign;

    if (campaign.status !== "LIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign is no longer live.",
        },
        { status: 400 }
      );
    }
    const availableSlots = campaign.availableSlots ?? 0;
    if (availableSlots <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No campaign slots are available.",
        },
        { status: 400 }
      );
    }

    if (application.testerCampaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "TesterCampaign already exists for this application.",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // APPROVE transaction
    // -----------------------------------------

  const result = await prisma.$transaction(async (tx) => {
  // -----------------------------------
  // 1. Approve Application
  // -----------------------------------

  const approvedApplication =
    await tx.campaignApplication.update({
      where: {
        id: parsedApplicationId,
      },

      data: {
        status: "APPROVED",
        reviewedBy: parsedAdminUserId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

  // -----------------------------------
  // 2. Create TesterCampaign
  // -----------------------------------

  const testerCampaign =
    await tx.testerCampaign.create({
      data: {
        testerProfileId: application.testerProfileId,
        campaignId: application.campaignId,
        applicationId: application.id,

        status: "ONGOING",
        currentTask: 1,

        earningAmount: campaign.earningAmount,

        joinedAt: new Date(),
        startedAt: new Date(),
      },
    });

  // -----------------------------------
  // 3. Prepare Tasks
  // -----------------------------------

  const taskData = [
    {
      testerCampaignId: testerCampaign.id,
      taskNumber: 1,
      status: "AVAILABLE" as const,
      unlockedAt: new Date(),
    },

    {
      testerCampaignId: testerCampaign.id,
      taskNumber: 2,
      status: "LOCKED" as const,
    },

    {
      testerCampaignId: testerCampaign.id,
      taskNumber: 3,
      status: "LOCKED" as const,
    },
  ];

  // -----------------------------------
  // 4. Add Task 4 only if required
  // -----------------------------------

  if (campaign.task4Required) {
    taskData.push({
      testerCampaignId: testerCampaign.id,
      taskNumber: 4,
      status: "LOCKED" as const,
    });
  }

  // -----------------------------------
  // 5. Create Tasks
  // -----------------------------------

  await tx.testerCampaignTask.createMany({
    data: taskData,
  });

  // -----------------------------------
  // 6. Consume Campaign Slot
  // -----------------------------------

  const updatedCampaign = await tx.campaign.update({
    where: {
      id: campaign.id,
    },

    data: {
      filledSlots: {
        increment: 1,
      },

      availableSlots: {
        decrement: 1,
      },
    },

    select: {
      id: true,
      totalSlots: true,
      filledSlots: true,
      availableSlots: true,
    },
  });

  return {
    approvedApplication,
    testerCampaign,
    updatedCampaign,
  };
});

    return NextResponse.json(
      {
        success: true,
        message:
          "Application approved and tester enrolled in campaign successfully.",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin campaign application review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while reviewing the application.",
      },
      { status: 500 }
    );
  }
}