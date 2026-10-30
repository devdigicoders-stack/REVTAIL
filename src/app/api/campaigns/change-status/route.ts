import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import {
  sendCampaignStatusEmail,
} from "@/lib/mailer";

// ============================================================
// ALLOWED ADMIN ACTIONS
// ============================================================
//
// The client expresses an ACTION:
// APPROVED = Admin approved the campaign
// REJECTED = Admin rejected the campaign
//
// IMPORTANT BUSINESS RULE:
//
// APPROVED action immediately changes Campaign.status to LIVE.
//
// Therefore:
//
// SUBMITTED -> APPROVED action -> LIVE
// SUBMITTED -> REJECTED action -> REJECTED
//
// ============================================================

const ALLOWED_ACTIONS = [
  "APPROVED",
  "REJECTED",
] as const;

type CampaignAction =
  (typeof ALLOWED_ACTIONS)[number];

// ============================================================
// PATCH /api/campaigns/change-status
// ============================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

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

    // ========================================================
    // 2. ADMIN ONLY
    // ========================================================

    if (
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only Admin can change campaign approval status.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 3. READ BODY
    // ========================================================

    const body =
      await request.json();

    const campaignId =
      Number(body.campaignId);

    const requestedAction =
      String(
        body.status ?? ""
      )
        .trim()
        .toUpperCase();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    // ========================================================
    // 4. VALIDATE CAMPAIGN ID
    // ========================================================

    if (
      !Number.isInteger(campaignId) ||
      campaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid campaign ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. VALIDATE ACTION
    // ========================================================

    if (
      !ALLOWED_ACTIONS.includes(
        requestedAction as CampaignAction
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid action. Allowed values are APPROVED or REJECTED.",
        },
        {
          status: 400,
        }
      );
    }

    const action =
      requestedAction as CampaignAction;

    // ========================================================
    // 6. REJECTION REASON REQUIRED
    // ========================================================

    if (
      action === "REJECTED" &&
      !reason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 7. FIND CAMPAIGN
    // ========================================================

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id: campaignId,
        },

        select: {
          id: true,
          campaignCode: true,
          productName: true,
          status: true,
          submittedAt: true,

          brand: {
            select: {
              id: true,
              companyName: true,

              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 8. ONLY SUBMITTED CAMPAIGNS CAN BE REVIEWED
    // ========================================================
    //
    // This prevents:
    //
    // LIVE -> reject accidentally
    // REJECTED -> approve accidentally
    // COMPLETED -> approve again
    //
    // ========================================================

    if (
      campaign.status !==
      "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Campaign has already been processed. Current status: ${campaign.status}.`,
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // 9. ADMIN APPROVES CAMPAIGN
    // ========================================================
    //
    // IMPORTANT:
    //
    // We intentionally DO NOT save APPROVED.
    //
    // Approval means the campaign immediately becomes LIVE.
    //
    // ========================================================

    if (
      action === "APPROVED"
    ) {
      const now = new Date();

      const updatedCampaign =
        await prisma.campaign.update({
          where: {
            id: campaignId,
          },

          data: {
            // ----------------------------------------------
            // APPROVAL IMMEDIATELY MAKES CAMPAIGN LIVE
            // ----------------------------------------------

            status: "LIVE",

            // Approval audit
            approvedAt: now,

            approvedBy:
              currentUser.userId,

            // Clear any previous rejection data
            rejectedAt: null,
            rejectionReason: null,
          },

          select: {
            id: true,
            campaignCode: true,
            productName: true,

            status: true,

            submittedAt: true,
            approvedAt: true,
            approvedBy: true,

            rejectedAt: true,
            rejectionReason: true,

            startDate: true,
            endDate: true,

            totalSlots: true,
            filledSlots: true,
            availableSlots: true,

            brand: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        });

      let emailSent = false;
      let emailError: string | null = null;

      const brandEmail =
        campaign.brand.user.email;

      if (brandEmail?.trim()) {
        try {
          await sendCampaignStatusEmail({
            to: brandEmail,
            companyName:
              campaign.brand.companyName,
            campaignCode:
              campaign.campaignCode,
            productName:
              campaign.productName,
            status: "LIVE",
            rejectionReason: null,
          });

          emailSent = true;
        } catch (mailError) {
          console.error(
            "CAMPAIGN APPROVAL EMAIL ERROR:",
            mailError
          );

          emailError =
            mailError instanceof Error
              ? mailError.message
              : "Unable to send campaign approval email.";
        }
      } else {
        emailError =
          "Brand email address is not available.";
      }

      return NextResponse.json(
        {
          success: true,

          message:
            "Campaign approved successfully and is now LIVE.",

          emailSent,

          emailError,

          data: updatedCampaign,
        },
        {
          status: 200,
        }
      );
    }

    // ========================================================
    // 10. ADMIN REJECTS CAMPAIGN
    // ========================================================

    if (
      action === "REJECTED"
    ) {
      const now = new Date();

      const updatedCampaign =
        await prisma.campaign.update({
          where: {
            id: campaignId,
          },

          data: {
            status: "REJECTED",

            rejectedAt: now,

            rejectionReason:
              reason,

            // It was not approved
            approvedAt: null,
            approvedBy: null,
          },

          select: {
            id: true,
            campaignCode: true,
            productName: true,

            status: true,

            submittedAt: true,

            approvedAt: true,
            approvedBy: true,

            rejectedAt: true,
            rejectionReason: true,

            brand: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        });

      let emailSent = false;
      let emailError: string | null = null;

      const brandEmail =
        campaign.brand.user.email;

      if (brandEmail?.trim()) {
        try {
          await sendCampaignStatusEmail({
            to: brandEmail,
            companyName:
              campaign.brand.companyName,
            campaignCode:
              campaign.campaignCode,
            productName:
              campaign.productName,
            status: "REJECTED",
            rejectionReason: reason,
          });

          emailSent = true;
        } catch (mailError) {
          console.error(
            "CAMPAIGN REJECTION EMAIL ERROR:",
            mailError
          );

          emailError =
            mailError instanceof Error
              ? mailError.message
              : "Unable to send campaign rejection email.";
        }
      } else {
        emailError =
          "Brand email address is not available.";
      }

      return NextResponse.json(
        {
          success: true,

          message:
            "Campaign rejected successfully.",

          emailSent,

          emailError,

          data: updatedCampaign,
        },
        {
          status: 200,
        }
      );
    }

    // ========================================================
    // SAFETY FALLBACK
    // ========================================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process campaign status.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "CHANGE CAMPAIGN STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while updating campaign status.",
      },
      {
        status: 500,
      }
    );
  }
}