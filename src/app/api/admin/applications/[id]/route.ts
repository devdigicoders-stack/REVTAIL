import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// Send after the database action succeeds so delivery failures cannot
// undo an approval, rejection, campaign enrollment, or slot allocation.
async function notifyTesterOfApplicationDecision(
  action: "APPROVE" | "REJECT",
  mobile: string | null | undefined,
  testerName: string,
  campaignName: string
): Promise<{ whatsappSent: boolean; whatsappError: string | null }> {
  if (!mobile?.trim()) {
    return {
      whatsappSent: false,
      whatsappError: "The tester does not have a registered mobile number.",
    };
  }

  const templateName =
    action === "APPROVE"
      ? process.env.WHATSAPP_TEMPLATE_CAMPAIGN_PARTICIPATION_APPROVED
      : process.env.WHATSAPP_TEMPLATE_PARTICIPATION_REJECTED;

  if (!templateName?.trim()) {
    return {
      whatsappSent: false,
      whatsappError: `WhatsApp template is not configured for ${action.toLowerCase()}.`,
    };
  }

  try {
    await sendWhatsAppTemplate({
      to: mobile,
      templateName: templateName.trim(),
      parameters: [testerName, campaignName],
      languageCode: process.env.WHATSAPP_APPLICATION_LANGUAGE || "en",
    });

    return { whatsappSent: true, whatsappError: null };
  } catch (error) {
    console.error("APPLICATION DECISION WHATSAPP ERROR:", error);
    return {
      whatsappSent: false,
      whatsappError:
        error instanceof Error ? error.message : "WhatsApp delivery failed.",
    };
  }
}


// ============================================================
// GET /api/admin/applications/[id]
// ============================================================

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const applicationId =
      Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID.",
        },
        { status: 400 }
      );
    }

    const application =
      await prisma.campaignApplication.findUnique({
        where: {
          id: applicationId,
        },

        select: {
          id: true,
          status: true,
          appliedAt: true,
          reviewedAt: true,
          reviewedBy: true,
          rejectionReason: true,

          testerProfileId: true,
          campaignId: true,

          testerProfile: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              gender: true,

              // Nullable in your actual schema
              ageCategory: true,

              pinCode: true,
              city: true,
              state: true,

              profileImage: true,
              instagramId: true,

              approvalStatus: true,

              user: {
                select: {
                  email: true,
                  mobile: true,
                  status: true,
                },
              },

              interests: {
                select: {
                  interest: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },

          campaign: {
            select: {
              id: true,
              campaignCode: true,

              productName: true,
              productImage: true,
              productDescription: true,
              productLink: true,

              earningAmount: true,
              currency: true,

              totalSlots: true,
              filledSlots: true,
              availableSlots: true,

              targetGender: true,
              targetState: true,
              targetCity: true,

              startDate: true,
              endDate: true,

              task4Required: true,

              status: true,

              brand: {
                select: {
                  id: true,
                  companyName: true,
                  companyType: true,

                  categoryId: true,

                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },

              images: {
                select: {
                  id: true,
                  imagePath: true,
                  imageOrder: true,
                },

                orderBy: {
                  imageOrder: "asc",
                },
              },
            },
          },
        },
      });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(
      "GET ADMIN APPLICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch application.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/admin/applications/[id]
// ============================================================

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // 2. APPLICATION ID
    // ========================================================

    const { id } = await params;

    const applicationId =
      Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid application ID.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 3. ACTION
    // ========================================================

    const body =
      await request.json();

    const action =
      String(
        body.action ?? ""
      )
        .trim()
        .toUpperCase();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      !reason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 4. LOAD ONLY SAFE REQUIRED FIELDS
    //
    // DO NOT include the whole Campaign record here.
    // This avoids unnecessary DateTime serialization.
    // ========================================================

    const existingApplication =
      await prisma.campaignApplication.findUnique({
        where: {
          id: applicationId,
        },

        select: {
          id: true,
          status: true,

          testerProfileId: true,
          campaignId: true,

          testerProfile: {
            select: {
              id: true,
              approvalStatus: true,
              fullName: true,
              user: {
                select: {
                  mobile: true,
                },
              },
            },
          },

          campaign: {
            select: {
              id: true,
              status: true,
              productName: true,

              earningAmount: true,

              totalSlots: true,
              filledSlots: true,
              availableSlots: true,

              task4Required: true,
            },
          },

          testerCampaign: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // 5. ALREADY PROCESSED
    // ========================================================

    if (
      existingApplication.status !== "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This application has already been reviewed.",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // 6. TESTER MUST STILL BE APPROVED
    // ========================================================

    if (
      existingApplication.testerProfile
        .approvalStatus !== "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester account is not approved.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 7. REJECT
    // ========================================================

    if (action === "REJECT") {
      const now =
        new Date();

      await prisma.campaignApplication.update({
        where: {
          id: applicationId,
        },

        data: {
          status: "REJECTED",

          reviewedAt: now,

          reviewedBy:
            currentUser.userId,

          rejectionReason:
            reason,
        },

        // IMPORTANT:
        // Return only fields we need.
        select: {
          id: true,
          status: true,
          reviewedBy: true,
          rejectionReason: true,
        },
      });

      const whatsapp = await notifyTesterOfApplicationDecision(
        "REJECT",
        existingApplication.testerProfile.user.mobile,
        existingApplication.testerProfile.fullName,
        existingApplication.campaign.productName
      );

      return NextResponse.json({
        success: true,

        message:
          "Tester application rejected successfully.",

        ...whatsapp,

        data: {
          applicationId,
          status: "REJECTED",
        },
      });
    }

    // ========================================================
    // 8. APPROVE
    // ========================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ==================================================
          // Re-read application safely inside transaction
          // ==================================================

          const application =
            await tx.campaignApplication.findUnique({
              where: {
                id: applicationId,
              },

              select: {
                id: true,
                status: true,

                testerProfileId: true,
                campaignId: true,

                testerCampaign: {
                  select: {
                    id: true,
                  },
                },

                campaign: {
                  select: {
                    id: true,
                    status: true,

                    earningAmount: true,

                    totalSlots: true,
                    filledSlots: true,
                    availableSlots: true,

                    task4Required: true,
                  },
                },
              },
            });

          if (!application) {
            throw new Error(
              "Application not found."
            );
          }

          if (
            application.status !==
            "PENDING"
          ) {
            throw new Error(
              "Application has already been reviewed."
            );
          }

          // ==================================================
          // Campaign must still be LIVE
          // ==================================================

          if (
            application.campaign.status !==
            "LIVE"
          ) {
            throw new Error(
              "Campaign is no longer LIVE."
            );
          }

          // ==================================================
          // Prevent duplicate enrollment
          // ==================================================

          if (
            application.testerCampaign
          ) {
            throw new Error(
              "Tester is already enrolled in this campaign."
            );
          }

          const existingTesterCampaign =
            await tx.testerCampaign.findUnique({
              where: {
                testerProfileId_campaignId: {
                  testerProfileId:
                    application.testerProfileId,

                  campaignId:
                    application.campaignId,
                },
              },

              select: {
                id: true,
              },
            });

          if (
            existingTesterCampaign
          ) {
            throw new Error(
              "Tester is already enrolled in this campaign."
            );
          }

          // ==================================================
          // AVAILABLE SLOT CALCULATION
          // ==================================================

          const availableSlots =
            application.campaign.availableSlots ??
            (
              application.campaign.totalSlots -
              application.campaign.filledSlots
            );

          if (
            availableSlots <= 0
          ) {
            throw new Error(
              "No campaign slots are available."
            );
          }

          // ==================================================
          // SINGLE VALID TIMESTAMP
          // ==================================================

          const now =
            new Date();

          // Defensive check
          if (
            Number.isNaN(
              now.getTime()
            )
          ) {
            throw new Error(
              "Unable to generate valid approval timestamp."
            );
          }

          // ==================================================
          // 1. APPROVE APPLICATION
          // ==================================================

          await tx.campaignApplication.update({
            where: {
              id:
                application.id,
            },

            data: {
              status:
                "APPROVED",

              reviewedAt:
                now,

              reviewedBy:
                currentUser.userId,

              rejectionReason:
                null,
            },

            select: {
              id: true,
            },
          });

          // ==================================================
          // 2. CREATE TESTER CAMPAIGN
          //
          // Schema:
          // joinedAt defaults automatically,
          // therefore we DO NOT need to explicitly set it.
          // ==================================================

          const testerCampaign =
            await tx.testerCampaign.create({
              data: {
                testerProfileId:
                  application.testerProfileId,

                campaignId:
                  application.campaignId,

                applicationId:
                  application.id,

                status:
                  "ONGOING",

                currentTask:
                  1,

                earningAmount:
                  application.campaign
                    .earningAmount,

                startedAt:
                  now,
              },

              select: {
                id: true,

                testerProfileId:
                  true,

                campaignId:
                  true,

                applicationId:
                  true,

                status: true,

                currentTask:
                  true,

                earningAmount:
                  true,
              },
            });

          // ==================================================
          // 3. CREATE TASKS
          //
          // Task 1 = AVAILABLE
          // Others = LOCKED
          // ==================================================

          const taskNumbers =
            application.campaign.task4Required
              ? [1, 2, 3, 4]
              : [1, 2, 3];

          await tx.testerCampaignTask.createMany({
            data:
              taskNumbers.map(
                (taskNumber) => ({
                  testerCampaignId:
                    testerCampaign.id,

                  taskNumber,

                  status:
                    taskNumber === 1
                      ? "AVAILABLE"
                      : "LOCKED",

                  unlockedAt:
                    taskNumber === 1
                      ? now
                      : null,
                })
              ),
          });

          // ==================================================
          // 4. CONSUME ONE SLOT
          //
          // Slot decreases ONLY after approval.
          // ==================================================

          await tx.campaign.update({
            where: {
              id:
                application.campaignId,
            },

            data: {
              filledSlots: {
                increment: 1,
              },

              availableSlots:
                availableSlots - 1,
            },

            // IMPORTANT:
            // Do NOT return full Campaign with all DateTime fields.
            select: {
              id: true,
              filledSlots: true,
              availableSlots: true,
            },
          });

          return {
            applicationId:
              application.id,

            testerCampaignId:
              testerCampaign.id,

            campaignId:
              application.campaignId,

            status:
              "APPROVED" as const,
          };
        }
      );

    // ========================================================
    // 9. SAFE RESPONSE
    //
    // No Date object is returned here.
    // ========================================================

    const whatsapp = await notifyTesterOfApplicationDecision(
      "APPROVE",
      existingApplication.testerProfile.user.mobile,
      existingApplication.testerProfile.fullName,
      existingApplication.campaign.productName
    );

    return NextResponse.json({
      success: true,

      message:
        "Tester application approved successfully. The tester is now enrolled and Task 1 is available.",

      ...whatsapp,

      data: result,
    });
  } catch (error) {
    console.error(
      "UPDATE APPLICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update application.",
      },
      { status: 500 }
    );
  }
}