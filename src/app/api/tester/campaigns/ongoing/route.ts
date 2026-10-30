import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    // ============================================================
    // 1. GET CURRENT LOGGED-IN USER
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

    // ============================================================
    // 2. TESTER ONLY
    // ============================================================

    if (
      currentUser.role !== "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access ongoing campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 3. GET TESTER PROFILE
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

    if (
      testerProfile.approvalStatus !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your tester profile is not approved yet.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 4. GET ONGOING CAMPAIGNS
    // ============================================================

    const testerCampaigns =
      await prisma.testerCampaign.findMany({
        where: {
          testerProfileId:
            testerProfile.id,

          status:
            "ONGOING",
        },

        select: {
          id: true,

          status: true,
          currentTask: true,

          earningAmount: true,

          joinedAt: true,
          startedAt: true,

          campaign: {
            select: {
              id: true,

              productName: true,
              productImage: true,
              productDescription: true,
              productLink: true,

              startDate: true,
              endDate: true,

              totalSlots: true,
              filledSlots: true,
              availableSlots: true,

              status: true,

              task4Required: true,

              brand: {
                select: {
                  id: true,
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

              unlockedAt: true,
              submittedAt: true,

              approvedAt: true,
              rejectedAt: true,

              rejectionReason: true,
            },

            orderBy: {
              taskNumber:
                "asc",
            },
          },
        },

        orderBy: {
          joinedAt:
            "desc",
        },
      });

    // ============================================================
    // 5. FORMAT
    // ============================================================

    const campaigns =
      testerCampaigns.map(
        (testerCampaign) => {
          const currentTaskData =
            testerCampaign.tasks.find(
              (task) =>
                task.taskNumber ===
                testerCampaign.currentTask
            ) ?? null;

          const task1 =
            testerCampaign.tasks.find(
              (task) =>
                task.taskNumber === 1
            );

          const canCancel =
            testerCampaign.status ===
              "ONGOING" &&
            testerCampaign.currentTask ===
              1 &&
            task1?.status ===
              "AVAILABLE" &&
            !task1.submittedAt;

          return {
            testerCampaignId:
              testerCampaign.id,

            status:
              testerCampaign.status,

            currentTask:
              testerCampaign.currentTask,

            earningAmount:
              testerCampaign.earningAmount,

            joinedAt:
              testerCampaign.joinedAt,

            startedAt:
              testerCampaign.startedAt,

            campaign: {
              id:
                testerCampaign
                  .campaign.id,

              productName:
                testerCampaign
                  .campaign
                  .productName,

              productImage:
                testerCampaign
                  .campaign
                  .productImage,

              productDescription:
                testerCampaign
                  .campaign
                  .productDescription,

              productLink:
                testerCampaign
                  .campaign
                  .productLink,

              brandName:
                testerCampaign
                  .campaign
                  .brand
                  ?.companyName ??
                null,

              startDate:
                testerCampaign
                  .campaign
                  .startDate,

              endDate:
                testerCampaign
                  .campaign
                  .endDate,

              task4Required:
                testerCampaign
                  .campaign
                  .task4Required,

              availableSlots:
                testerCampaign
                  .campaign
                  .availableSlots,
            },

            currentTaskData:
              currentTaskData
                ? {
                    id:
                      currentTaskData.id,

                    taskNumber:
                      currentTaskData.taskNumber,

                    title:
                      getTaskTitle(
                        currentTaskData.taskNumber
                      ),

                    status:
                      currentTaskData.status,

                    unlockedAt:
                      currentTaskData.unlockedAt,

                    submittedAt:
                      currentTaskData.submittedAt,

                    approvedAt:
                      currentTaskData.approvedAt,

                    rejectedAt:
                      currentTaskData.rejectedAt,

                    rejectionReason:
                      currentTaskData.rejectionReason,
                  }
                : null,

            tasks:
              testerCampaign.tasks.map(
                (task) => ({
                  id:
                    task.id,

                  taskNumber:
                    task.taskNumber,

                  title:
                    getTaskTitle(
                      task.taskNumber
                    ),

                  status:
                    task.status,

                  unlockedAt:
                    task.unlockedAt,

                  submittedAt:
                    task.submittedAt,

                  approvedAt:
                    task.approvedAt,

                  rejectedAt:
                    task.rejectedAt,

                  rejectionReason:
                    task.rejectionReason,
                })
              ),

            canCancel,
          };
        }
      );

    // ============================================================
    // 6. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Ongoing campaigns fetched successfully.",

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,
          },

          totalCampaigns:
            campaigns.length,

          campaigns,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get tester ongoing campaigns error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while fetching ongoing campaigns.",
      },
      {
        status: 500,
      }
    );
  }
}


function getTaskTitle(
  taskNumber: number
) {
  switch (taskNumber) {
    case 1:
      return "Buy Product";

    case 2:
      return "Product Received";

    case 3:
      return "Write Review & Rating";

    case 4:
      return "Copy/Paste Review";

    default:
      return `Task ${taskNumber}`;
  }
}