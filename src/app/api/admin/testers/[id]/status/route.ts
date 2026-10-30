import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// ============================================================
// Here [id] is the TesterProfile ID, not User ID.
// PATCH /api/admin/testers/[id]/status
//
// {
//    action: "APPROVE"
// }
//
// OR
//
// {
//    action: "REJECT",
//    reason: "..."
// }
// ============================================================

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
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
          message:
            "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. TESTER PROFILE ID
    // ========================================================

    const { id } =
      await params;

    const testerProfileId =
      Number(id);

    if (
      !Number.isInteger(
        testerProfileId
      ) ||
      testerProfileId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Tester ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. REQUEST
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
      typeof body.reason ===
      "string"
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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. FIND TESTER
    // ========================================================

    const tester =
      await prisma.testerProfile.findUnique({
        where: {
          id: testerProfileId,
        },

        select: {
          id: true,

          userId: true,

          fullName: true,

          approvalStatus: true,

          deletedAt: true,

          user: {
            select: {
              id: true,

              role: true,

              status: true,

              mobile: true,
            },
          },
        },
      });

    if (!tester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (tester.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester account has been deleted.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      tester.user.role !==
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected account is not a Tester account.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. APPROVE
    // ========================================================

    if (
      action === "APPROVE"
    ) {
      if (
        tester.approvalStatus ===
        "APPROVED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tester is already approved.",
          },
          {
            status: 409,
          }
        );
      }

      const now =
        new Date();

      await prisma.$transaction(
        async (tx) => {
          // ----------------------------------------------
          // Tester profile
          // ----------------------------------------------

          await tx.testerProfile.update({
            where: {
              id:
                testerProfileId,
            },

            data: {
              approvalStatus:
                "APPROVED",

              approvedAt:
                now,

              rejectionReason:
                null,
            },

            select: {
              id: true,
            },
          });

          // ----------------------------------------------
          // User login/account status
          // ----------------------------------------------

          await tx.user.update({
            where: {
              id:
                tester.userId,
            },

            data: {
              status:
                "ACTIVE",
            },

            select: {
              id: true,
            },
          });
        }
      );

      // ========================================================
      // SEND APPROVAL WHATSAPP
      // ========================================================

      let whatsappSent =
        false;

      let whatsappError:
        | string
        | null =
        null;

      if (
        tester.user.mobile?.trim()
      ) {
        try {
          await sendWhatsAppTemplate({
            to:
              tester.user.mobile,

            templateName:
              process.env
                .WHATSAPP_TEMPLATE_TESTER_SIGNUP ||
              "welcome_message_for_new_user",

            parameters: [
              tester.fullName,
            ],

            languageCode:
              process.env
                .WHATSAPP_TESTER_STATUS_LANGUAGE ||
              "en",

            callbackData:
              `tester-profile-approved-${testerProfileId}`,
          });

          whatsappSent =
            true;
        } catch (
          whatsappSendError
        ) {
          console.error(
            "TESTER APPROVAL WHATSAPP ERROR:",
            whatsappSendError
          );

          whatsappError =
            whatsappSendError instanceof
            Error
              ? whatsappSendError.message
              : "Unable to send approval WhatsApp message.";
        }
      } else {
        whatsappError =
          "Tester mobile number is not available.";
      }

      return NextResponse.json({
        success: true,

        message:
          `${tester.fullName} has been approved successfully.`,

        whatsappSent,
        whatsappError,

        data: {
          testerProfileId,

          userId:
            tester.userId,

          approvalStatus:
            "APPROVED",

          userStatus:
            "ACTIVE",
        },
      });
    }

    // ========================================================
    // 6. REJECT
    // ========================================================

    if (
      action === "REJECT"
    ) {
      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.testerProfile.update({
              where: {
                id:
                  testerProfileId,
              },

              data: {
                approvalStatus:
                  "REJECTED",

                approvedAt:
                  null,

                rejectionReason:
                  reason,
              },

              select: {
                id: true,
              },
            });

            await tx.user.update({
              where: {
                id:
                  tester.userId,
              },

              data: {
                status:
                  "REJECTED",
              },

              select: {
                id: true,
              },
            });

            return {
              testerProfileId,

              userId:
                tester.userId,
            };
          }
        );

      // ========================================================
      // SEND REJECTION WHATSAPP
      // ========================================================

      let whatsappSent =
        false;

      let whatsappError:
        | string
        | null =
        null;

      if (
        tester.user.mobile?.trim()
      ) {
        try {
          await sendWhatsAppTemplate({
            to:
              tester.user.mobile,

            templateName:
              process.env
                .WHATSAPP_TEMPLATE_TESTER_REJECTED ||
              "tester_profile_rejected",

            parameters: [
              tester.fullName,
              reason,
            ],

            languageCode:
              process.env
                .WHATSAPP_TESTER_STATUS_LANGUAGE ||
              "en",

            callbackData:
              `tester-profile-rejected-${testerProfileId}`,
          });

          whatsappSent =
            true;
        } catch (
          whatsappSendError
        ) {
          console.error(
            "TESTER REJECTION WHATSAPP ERROR:",
            whatsappSendError
          );

          whatsappError =
            whatsappSendError instanceof
            Error
              ? whatsappSendError.message
              : "Unable to send rejection WhatsApp message.";
        }
      } else {
        whatsappError =
          "Tester mobile number is not available.";
      }

      return NextResponse.json({
        success: true,

        message:
          "Tester registration rejected.",

        whatsappSent,
        whatsappError,

        data: {
          ...result,

          approvalStatus:
            "REJECTED",

          userStatus:
            "REJECTED",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process Tester.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE TESTER STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update Tester.",
      },
      {
        status: 500,
      }
    );
  }
}