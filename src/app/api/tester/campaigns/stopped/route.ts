import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/tester/campaigns/stopped
export async function GET(
  request: NextRequest
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

    if (currentUser.role !== "TESTER") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId: currentUser.userId,
        },
        select: {
          id: true,
        },
      });

    if (!testerProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester profile not found.",
        },
        { status: 404 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      Number(
        searchParams.get("page") ?? "1"
      ) || 1
    );

    const limit = 10;

    const where = {
      testerProfileId: testerProfile.id,
      status: "ADMIN_STOPPED" as const,
    };

    const [total, rows] =
      await Promise.all([
        prisma.testerCampaign.count({ where }),
        prisma.testerCampaign.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            stoppedAt: "desc",
          },
          select: {
            id: true,
            currentTask: true,
            earningAmount: true,
            joinedAt: true,
            stoppedAt: true,
            stoppedReason: true,
            campaign: {
              select: {
                id: true,
                campaignCode: true,
                productName: true,
                productImage: true,
                brand: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    const totalPages = Math.max(
      1,
      Math.ceil(total / limit)
    );

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        testerCampaignId: row.id,
        currentTask: row.currentTask,
        earningAmount: Number(row.earningAmount),
        joinedAt: row.joinedAt,
        stoppedAt: row.stoppedAt,
        stoppedReason: row.stoppedReason,
        campaign: {
          id: row.campaign.id,
          campaignCode: row.campaign.campaignCode,
          productName: row.campaign.productName,
          productImage: row.campaign.productImage,
          brandName: row.campaign.brand.companyName,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET STOPPED CAMPAIGNS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load stopped campaigns.",
      },
      { status: 500 }
    );
  }
}
