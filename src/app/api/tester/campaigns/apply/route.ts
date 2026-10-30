import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

import {
  Prisma,
} from "@prisma/client";

// import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest
) {
  try {
    // ============================================================
    // 1. AUTHENTICATION
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
            "Only testers can apply for campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. BODY
    // ============================================================

    const body =
      await request.json();

    const campaignId =
      Number(
        body.campaignId
      );

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
            "Valid campaignId is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. TESTER PROFILE
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

          user: {
            select: {
              mobile: true,
            },
          },

          approvalStatus:
            true,

          gender:
            true,

          city:
            true,

          state:
            true,
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
    // 4. CAMPAIGN
    // ============================================================

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id:
            campaignId,
        },

        select: {
          id: true,

          productName: true,

          status: true,

          startDate: true,
          endDate: true,

          availableSlots: true,

          targetState: true,
          targetCity: true,
          targetGender: true,
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

    const now =
      new Date();

    if (
      campaign.status !==
        "LIVE" ||
      (campaign.startDate !== null &&
        campaign.startDate > now) ||
      (campaign.endDate !== null &&
        campaign.endDate < now)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This campaign is not currently available.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      (campaign.availableSlots ?? 0) <=
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No campaign slots are available.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 5. ELIGIBILITY
    // ============================================================

    const targetState =
      campaign.targetState
        ?.trim()
        .toLowerCase();

    const targetCity =
      campaign.targetCity
        ?.trim()
        .toLowerCase();

    const targetGender =
      campaign.targetGender
        ?.trim()
        .toUpperCase();

    const testerState =
      testerProfile.state
        ?.trim()
        .toLowerCase();

    const testerCity =
      testerProfile.city
        ?.trim()
        .toLowerCase();

    const testerGender =
      String(
        testerProfile.gender
      ).toUpperCase();

    const stateMatches =
      targetState === "any" ||
      targetState ===
        testerState;

    const cityMatches =
      targetCity === "any" ||
      targetCity ===
        testerCity;

    const genderMatches =
      targetGender === "ANY" ||
      targetGender ===
        testerGender;

    if (
      !stateMatches ||
      !cityMatches ||
      !genderMatches
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not eligible for this campaign.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 6. EXISTING APPLICATION
    // ============================================================

    const existingApplication =
      await prisma.campaignApplication.findUnique({
        where: {
          testerProfileId_campaignId: {
            testerProfileId:
              testerProfile.id,

            campaignId,
          },
        },
      });

    if (
      existingApplication
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You have already applied for this campaign.",

          data: {
            applicationId:
              existingApplication.id,

            status:
              existingApplication.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 7. CREATE APPLICATION
    // ============================================================

    const application =
      await prisma.campaignApplication.create({
        data: {
          testerProfileId:
            testerProfile.id,

          campaignId,

          status:
            "PENDING",
        },
      });

    // ============================================================
    // 8. WHATSAPP NOTIFICATION — TEMPORARILY DISABLED
    // ============================================================
    // Keep the original notification logic below for later re-enabling.
    // No WhatsApp message is sent when a tester applies for a campaign.
    const whatsappSent = false;
    const whatsappError: string | null = null;

    /*
    // ============================================================
    // 8. WHATSAPP NOTIFICATION (AFTER SUCCESSFUL APPLICATION)
    // ============================================================
    // A messaging failure must never undo an application.
    // Only newly created applications reach this point, so
    // duplicate applications never trigger another message.

    let whatsappSent = false;
    let whatsappError: string | null = null;

    const templateName =
      process.env.WHATSAPP_TEMPLATE_CALL_TO_PARTICIPATE?.trim();

    const testerMobile =
      testerProfile.user?.mobile?.trim();

    if (!templateName) {
      whatsappError =
        "WHATSAPP_TEMPLATE_CALL_TO_PARTICIPATE is not configured.";
    } else if (!testerMobile) {
      whatsappError =
        "Tester mobile number is not available.";
    } else {
      try {
        await sendWhatsAppTemplate({
          to: testerMobile,
          templateName,
          parameters: [
            testerProfile.fullName,
            campaign.productName,
          ],
          languageCode:
            process.env.WHATSAPP_TESTER_STATUS_LANGUAGE ||
            "en",
          callbackData:
            `tester-campaign-application-${application.id}`,
        });

        whatsappSent = true;
      } catch (notificationError) {
        whatsappError =
          notificationError instanceof Error
            ? notificationError.message
            : "Unable to send WhatsApp notification.";

        console.error(
          "Campaign application WhatsApp error:",
          notificationError
        );
      }
    }

    if (whatsappError) {
      console.warn(
        "Campaign application saved; WhatsApp not sent:",
        whatsappError
      );
    }

    */

    return NextResponse.json(
      {
        success: true,

        whatsappSent,
        whatsappError,

        message:
          "Campaign application submitted successfully.",

        data: {
          applicationId:
            application.id,

          campaignId:
            application.campaignId,

          status:
            application.status,

          appliedAt:
            application.appliedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Campaign apply error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have already applied for this campaign.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while applying for the campaign.",
      },
      {
        status: 500,
      }
    );
  }
}