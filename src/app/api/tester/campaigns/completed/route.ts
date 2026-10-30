import {
  NextResponse,
} from "next/server";

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

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
          fullName: true,
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

    const campaigns =
      await prisma.testerCampaign.findMany({
        where: {
          testerProfileId:
            testerProfile.id,

          status:
            "COMPLETED",
        },

        select: {
          id: true,

          status: true,

          earningAmount: true,

          joinedAt: true,

          completedAt: true,

          campaign: {
            select: {
              id: true,

              productName: true,

              productImage: true,

              productDescription: true,

              task4Required: true,

              brand: {
                select: {
                  companyName: true,
                },
              },
            },
          },

          tasks: {
            select: {
              id: true,
              taskNumber: true,
              status: true,
              approvedAt: true,
            },

            orderBy: {
              taskNumber:
                "asc",
            },
          },
        },

        orderBy: {
          completedAt:
            "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,
          },

          totalCampaigns:
            campaigns.length,

          totalEarnings:
            campaigns.reduce(
              (
                total,
                campaign
              ) =>
                total +
                Number(
                  campaign
                    .earningAmount
                ),
              0
            ),

          campaigns:
            campaigns.map(
              (
                item
              ) => ({
                testerCampaignId:
                  item.id,

                status:
                  item.status,

                earningAmount:
                  item.earningAmount,

                joinedAt:
                  item.joinedAt,

                completedAt:
                  item.completedAt,

                campaign: {
                  id:
                    item.campaign.id,

                  productName:
                    item.campaign
                      .productName,

                  productImage:
                    item.campaign
                      .productImage,

                  productDescription:
                    item.campaign
                      .productDescription,

                  brandName:
                    item.campaign
                      .brand
                      ?.companyName ??
                    null,

                  task4Required:
                    item.campaign
                      .task4Required,
                },

                tasks:
                  item.tasks,
              })
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Completed campaigns error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load completed campaigns.",
      },
      {
        status: 500,
      }
    );
  }
}