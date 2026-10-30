import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

export async function GET() {
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
          message:
            "Unauthorized. Please login.",
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
            "Only testers can access campaign applications.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TESTER PROFILE
    // ============================================================

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

    // ============================================================
    // 3. APPLICATIONS
    // ============================================================

    const applications =
      await prisma.campaignApplication.findMany({
        where: {
          testerProfileId:
            testerProfile.id,
        },

        select: {
          id: true,

          status: true,

          appliedAt: true,

          reviewedAt: true,

          rejectionReason:
            true,

          campaign: {
            select: {
              id: true,

              productName: true,

              productImage: true,

              productDescription:
                true,

              earningAmount:
                true,

              startDate: true,
              endDate: true,

              availableSlots:
                true,

              task4Required:
                true,

              brand: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },

          testerCampaign: {
            select: {
              id: true,
              status: true,
              currentTask: true,
            },
          },
        },

        orderBy: {
          appliedAt:
            "desc",
        },
      });

    // ============================================================
    // 4. FORMAT
    // ============================================================

    const formatted =
      applications.map(
        (application) => ({
          id:
            application.id,

          status:
            application.status,

          appliedAt:
            application.appliedAt,

          reviewedAt:
            application.reviewedAt,

          rejectionReason:
            application.rejectionReason,

          campaign: {
            id:
              application.campaign.id,

            productName:
              application
                .campaign
                .productName,

            productImage:
              application
                .campaign
                .productImage,

            productDescription:
              application
                .campaign
                .productDescription,

            earningAmount:
              application
                .campaign
                .earningAmount,

            startDate:
              application
                .campaign
                .startDate,

            endDate:
              application
                .campaign
                .endDate,

            availableSlots:
              application
                .campaign
                .availableSlots,

            task4Required:
              application
                .campaign
                .task4Required,

            brandName:
              application
                .campaign
                .brand
                ?.companyName ??
              null,
          },

          testerCampaign:
            application
              .testerCampaign
              ? {
                  id:
                    application
                      .testerCampaign
                      .id,

                  status:
                    application
                      .testerCampaign
                      .status,

                  currentTask:
                    application
                      .testerCampaign
                      .currentTask,
                }
              : null,
        })
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign applications fetched successfully.",

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,
          },

          totalApplications:
            formatted.length,

          applications:
            formatted,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get tester applications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching campaign applications.",
      },
      {
        status: 500,
      }
    );
  }
}