import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import {
  getCurrentUser,
} from "@/lib/current-user";

import {
  sendWhatsAppTemplate,
} from "@/lib/whatsapp";

type RouteContext = {
  params: Promise<{
    testerCampaignId: string;
  }>;
};

// ============================================================
// POST
// /api/admin/tester-campaigns/[testerCampaignId]/reminder
// ============================================================

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
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

    const {
      testerCampaignId,
    } =
      await context.params;

    const id =
      Number(
        testerCampaignId
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid tester campaign ID.",
        },
        {
          status: 400,
        }
      );
    }

    const testerCampaign =
      await prisma.testerCampaign.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          currentTask: true,

          testerProfile: {
            select: {
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
              campaignCode: true,
              productName: true,

              brand: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
      });

    if (!testerCampaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reminder can only be sent for an ongoing tester campaign.",
        },
        {
          status: 409,
        }
      );
    }

    const mobile =
      testerCampaign
        .testerProfile
        .user
        .mobile;

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester does not have a mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    // Expected template body example:
    //
    // Hello {{1}},
    // this is a reminder for campaign {{2}}.
    // Please complete Task {{3}}.
    //
    // .env:
    // WHATSAPP_TEMPLATE_CAMPAIGN_REMINDER=campaign_reminder

    const templateName =
      process.env
        .WHATSAPP_TEMPLATE_CAMPAIGN_REMINDER ||
      "campaign_reminder";

    await sendWhatsAppTemplate({
      to:
        mobile,

      templateName,

      parameters: [
        testerCampaign
          .testerProfile
          .fullName,

        testerCampaign
          .campaign
          .productName,

        String(
          testerCampaign
            .currentTask
        ),
      ],

      languageCode:
        "en",

      callbackData:
        `campaign-reminder-${testerCampaign.id}`,
    });

    return NextResponse.json(
      {
        success: true,

        message:
          `WhatsApp reminder sent to ${testerCampaign.testerProfile.fullName}.`,

        data: {
          testerCampaignId:
            testerCampaign.id,

          currentTask:
            testerCampaign.currentTask,

          campaignCode:
            testerCampaign
              .campaign
              .campaignCode,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "SEND CAMPAIGN REMINDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to send WhatsApp reminder.",
      },
      {
        status: 500,
      }
    );
  }
}
