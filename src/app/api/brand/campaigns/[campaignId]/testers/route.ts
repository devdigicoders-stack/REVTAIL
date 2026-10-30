import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{ campaignId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
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

    const { campaignId } = await context.params;
    const parsedCampaignId = Number(campaignId);

    if (!Number.isInteger(parsedCampaignId) || parsedCampaignId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid campaign ID." },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      50,
      Math.max(5, Number(url.searchParams.get("limit") ?? 10) || 10)
    );
    const skip = (page - 1) * limit;

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: currentUser.userId },
      select: { id: true, companyName: true },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { success: false, message: "Brand profile not found." },
        { status: 404 }
      );
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: parsedCampaignId,
        brandId: brandProfile.id,
      },
      select: {
        id: true,
        campaignCode: true,
        productName: true,
        productImage: true,
        status: true,
        task4Required: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign not found or does not belong to this Brand.",
        },
        { status: 404 }
      );
    }

    const total = await prisma.testerCampaign.count({
      where: { campaignId: parsedCampaignId },
    });

    const testerCampaigns = await prisma.testerCampaign.findMany({
      where: { campaignId: parsedCampaignId },
      skip,
      take: limit,
      orderBy: { id: "desc" },
      select: {
        id: true,
        status: true,
        currentTask: true,
        earningAmount: true,
        joinedAt: true,
        startedAt: true,
        completedAt: true,
        testerProfile: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            city: true,
            state: true,
            profileImage: true,
            user: {
              select: {
                email: true,
                mobile: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { taskNumber: "asc" },
          select: {
            id: true,
            taskNumber: true,
            status: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
          },
        },
      },
    });

    const testers = testerCampaigns.map((item) => {
      const approvedTasks = item.tasks.filter(
        (task) => task.status === "APPROVED"
      ).length;
      const submittedTasks = item.tasks.filter(
        (task) => task.status === "SUBMITTED"
      ).length;

      return {
        testerCampaignId: item.id,
        status: item.status,
        currentTask: item.currentTask,
        earningAmount: Number(item.earningAmount),
        joinedAt: item.joinedAt,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        tester: {
          id: item.testerProfile.id,
          fullName: item.testerProfile.fullName,
          gender: item.testerProfile.gender,
          city: item.testerProfile.city,
          state: item.testerProfile.state,
          profileImage: item.testerProfile.profileImage,
          email: item.testerProfile.user.email,
          mobile: item.testerProfile.user.mobile,
        },
        progress: {
          totalTasks: item.tasks.length,
          approvedTasks,
          submittedTasks,
          tasks: item.tasks,
        },
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      message: "Campaign testers fetched successfully.",
      data: {
        campaign: {
          ...campaign,
          totalTesters: total,
        },
        testers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("GET BRAND CAMPAIGN TESTERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch campaign testers.",
      },
      { status: 500 }
    );
  }
}
