import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

function isAny(value: string | null | undefined) {
  if (!value) return true;
  return value.trim().toLowerCase() === "any";
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Access denied. Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const campaignId = Number(body.campaignId);
    const testerProfileIds: number[] = Array.isArray(body.testerProfileIds)
      ? Array.from(
          new Set<number>(
            body.testerProfileIds
              .map((v: unknown): number => Number(v))
              .filter((v: number): boolean => Number.isInteger(v) && v > 0)
          )
        )
      : [];

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return NextResponse.json({ success: false, message: "Valid campaignId is required." }, { status: 400 });
    }
    if (testerProfileIds.length === 0) {
      return NextResponse.json({ success: false, message: "Select at least one tester." }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        status: true,
        productName: true,
        targetState: true,
        targetCity: true,
        targetGender: true,
        brand: { select: { categoryId: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
    }
    if (campaign.status !== "LIVE") {
      return NextResponse.json({ success: false, message: "Only LIVE campaigns can send invitations." }, { status: 400 });
    }
    if (!campaign.brand.categoryId) {
      return NextResponse.json({ success: false, message: "Brand category is not configured." }, { status: 400 });
    }

    const testers = await prisma.testerProfile.findMany({
      where: {
        id: { in: testerProfileIds },
        deletedAt: null,
        approvalStatus: "APPROVED",
        user: { status: "ACTIVE" },
        interests: { some: { interestId: campaign.brand.categoryId } },
      },
      select: {
        id: true,
        fullName: true,
        gender: true,
        state: true,
        city: true,
        user: {
          select: {
            mobile: true,
          },
        },
        campaignApplications: {
          where: { campaignId },
          select: { id: true },
          take: 1,
        },
      },
    });

    const eligibleIds = testers
      .filter((tester) => {
        if (tester.campaignApplications.length > 0) return false;
        if (campaign.targetGender !== "ANY" && tester.gender !== campaign.targetGender) return false;
        if (!isAny(campaign.targetState) && tester.state !== campaign.targetState) return false;
        if (!isAny(campaign.targetCity) && tester.city !== campaign.targetCity) return false;
        return true;
      })
      .map((tester) => tester.id);

    let sent = 0;
    let skipped = 0;

    const invitedTesterIds: number[] = [];

    await prisma.$transaction(async (tx) => {
      for (const testerProfileId of eligibleIds) {
        const existing = await tx.campaignInvitation.findUnique({
          where: { campaignId_testerProfileId: { campaignId, testerProfileId } },
        });

        if (existing?.status === "SENT") {
          skipped += 1;
          continue;
        }

        if (existing) {
          await tx.campaignInvitation.update({
            where: { id: existing.id },
            data: {
              status: "SENT",
              invitedBy: currentUser.userId,
              invitedAt: new Date(),
              readAt: null,
              cancelledAt: null,
            },
          });
        } else {
          await tx.campaignInvitation.create({
            data: {
              campaignId,
              testerProfileId,
              invitedBy: currentUser.userId,
              status: "SENT",
            },
          });
        }

        sent += 1;
        invitedTesterIds.push(testerProfileId);
      }
    });

    // ============================================================
    // WHATSAPP NOTIFICATION
    //
    // Send only after the invitation transaction succeeds.
    // WhatsApp failure must not undo the saved invitation.
    //
    // WHATSAPP_TEMPLATE_CALL_TO_PARTICIPATE=call_to_participate
    // {{1}} = Tester full name
    // {{2}} = Campaign / product name
    // ============================================================

    let whatsappSent = 0;
    let whatsappFailed = 0;
    const whatsappErrors: string[] = [];

    const templateName =
      process.env.WHATSAPP_TEMPLATE_CALL_TO_PARTICIPATE || "call_to_participate";

    if (invitedTesterIds.length > 0) {
      const invitedTesters =
        testers.filter((tester) =>
          invitedTesterIds.includes(tester.id)
        );

      for (const tester of invitedTesters) {
        const mobile =
          tester.user?.mobile?.trim();

        if (!templateName) {
          whatsappFailed += 1;

          whatsappErrors.push(
            `Tester ${tester.id}: WHATSAPP_TEMPLATE_CALL_TO_PARTICIPATE is not configured.`
          );

          continue;
        }

        if (!mobile) {
          whatsappFailed += 1;

          whatsappErrors.push(
            `Tester ${tester.id}: mobile number is not available.`
          );

          continue;
        }

        try {
          await sendWhatsAppTemplate({
            to: mobile,

            templateName,

            parameters: [
              tester.fullName,
              campaign.productName,
            ],

            languageCode:
              process.env.WHATSAPP_TESTER_STATUS_LANGUAGE ||
              "en",

            callbackData:
              `campaign-invitation-${campaignId}-${tester.id}`,
          });

          whatsappSent += 1;
        } catch (whatsappError) {
          whatsappFailed += 1;

          const message =
            whatsappError instanceof Error
              ? whatsappError.message
              : "Unable to send WhatsApp notification.";

          whatsappErrors.push(
            `Tester ${tester.id}: ${message}`
          );

          console.error(
            "CAMPAIGN INVITATION WHATSAPP ERROR:",
            {
              testerProfileId: tester.id,
              campaignId,
              error: whatsappError,
            }
          );
        }
      }
    }

    skipped += testerProfileIds.length - eligibleIds.length;

    return NextResponse.json(
      {
        success: true,

        message:
          `${sent} invitation(s) saved successfully.`,

        data: {
          sent,
          skipped,
          whatsappSent,
          whatsappFailed,
          whatsappErrors,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("SEND INVITATIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to send invitations." },
      { status: 500 }
    );
  }
}
