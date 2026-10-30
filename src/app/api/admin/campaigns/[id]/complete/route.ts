import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

import {
  sendCampaignCompletedEmail,
} from "@/lib/mailer";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ============================================================
// PATCH
// /api/admin/campaigns/[id]/complete
//
// ADMIN ONLY
//
// This is deliberately a NEW endpoint so existing campaign
// status/detail APIs do not need to be modified.
// ============================================================

export async function PATCH(
  _request: Request,
  context: RouteContext
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
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Admin only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. CAMPAIGN ID
    // ========================================================

    const {
      id,
    } =
      await context.params;

    const campaignId =
      Number(id);

    if (
      !Number.isInteger(
        campaignId
      ) ||
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
    // 3. LOAD CAMPAIGN + BRAND EMAIL
    // ========================================================

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id:
            campaignId,
        },

        select: {
          id: true,

          campaignCode:
            true,

          productName:
            true,

          status:
            true,

          brand: {
            select: {
              id: true,

              companyName:
                true,

              user: {
                select: {
                  email:
                    true,
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

    if (
      campaign.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign is already completed.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      campaign.status !==
      "LIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only a LIVE campaign can be marked as complete.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // 4. SAFETY CHECK
    //
    // Do not close a campaign while any tester is still working.
    // ========================================================

    const ongoingTesterCount =
      await prisma.testerCampaign.count({
        where: {
          campaignId:
            campaign.id,

          status:
            "ONGOING",
        },
      });

    if (
      ongoingTesterCount >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `This campaign still has ${ongoingTesterCount} ongoing tester ` +
            `${ongoingTesterCount === 1 ? "activity" : "activities"}. ` +
            "Complete or stop those tester campaigns first.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // 5. MARK CAMPAIGN COMPLETE
    // ========================================================

    const updatedCampaign =
      await prisma.campaign.update({
        where: {
          id:
            campaign.id,
        },

        data: {
          status:
            "COMPLETED",
        },

        select: {
          id: true,
          status: true,
          campaignCode: true,
          productName: true,
        },
      });

    // ========================================================
    // 6. EMAIL BRAND
    //
    // Campaign completion is the business operation.
    // Email failure must NOT roll the campaign back to LIVE.
    // ========================================================

    let emailSent =
      false;

    let emailError:
      string | null =
      null;

    const brandEmail =
      campaign
        .brand
        .user
        .email;

    if (
      brandEmail?.trim()
    ) {
      try {
        await sendCampaignCompletedEmail({
          to:
            brandEmail,

          companyName:
            campaign
              .brand
              .companyName,

          campaignCode:
            campaign
              .campaignCode,

          productName:
            campaign
              .productName,
        });

        emailSent =
          true;
      } catch (error) {
        console.error(
          "CAMPAIGN COMPLETION EMAIL ERROR:",
          error
        );

        emailError =
          error instanceof Error
            ? error.message
            : "Unable to send campaign completion email.";
      }
    } else {
      emailError =
        "Brand email address is not available.";
    }

    // ========================================================
    // 7. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Campaign marked as complete successfully.",

        emailSent,

        emailError,

        data: {
          id:
            updatedCampaign.id,

          campaignCode:
            updatedCampaign
              .campaignCode,

          productName:
            updatedCampaign
              .productName,

          status:
            updatedCampaign
              .status,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MARK CAMPAIGN COMPLETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to mark campaign as complete.",
      },
      {
        status: 500,
      }
    );
  }
}
