// what is this file for?
// This file is for the admin to mark a payment request as paid.
// The admin can provide the paid amount, paid method, transaction/reference ID, and an optional admin note.
// The system will update the tester's wallet balance and create a wallet transaction record.

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ManualPaymentMethod,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentRequestId: string;
    }>;
  }
) {
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
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 2. ID
    // ============================================================

    const {
      paymentRequestId,
    } = await context.params;

    const parsedId =
      Number(paymentRequestId);

    if (
      !Number.isInteger(parsedId) ||
      parsedId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid paymentRequestId.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 3. BODY
    // ============================================================

    const body =
      await request.json();

    const paidMethodRaw =
      typeof body.paidMethod ===
      "string"
        ? body.paidMethod
            .trim()
            .toUpperCase()
        : "";

    const transactionReference =
      typeof body.transactionReference ===
      "string"
        ? body.transactionReference.trim()
        : "";

    const adminNote =
      typeof body.adminNote ===
      "string"
        ? body.adminNote.trim()
        : "";

    const paidAmount =
      Number(
        body.paidAmount
      );

    if (
      paidMethodRaw !== "UPI" &&
      paidMethodRaw !==
        "BANK_TRANSFER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid method must be UPI or BANK_TRANSFER.",
        },
        { status: 400 }
      );
    }

    if (
      !transactionReference
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Transaction/reference ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(
        paidAmount
      ) ||
      paidAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const paidMethod =
      paidMethodRaw as
        ManualPaymentMethod;

    // ============================================================
    // 4. LOAD REQUEST
    // ============================================================

    const paymentRequest =
      await prisma.paymentRequest.findUnique({
        where: {
          id:
            parsedId,
        },

        select: {
          id: true,

          status: true,

          amount: true,

          testerProfileId:
            true,

          testerCampaignId:
            true,

          testerProfile: {
            select: {
              fullName: true,

              user: {
                select: {
                  mobile: true,
                },
              },

              wallet: {
                select: {
                  id: true,

                  totalEarned:
                    true,

                  availableBalance:
                    true,

                  totalPaid:
                    true,
                },
              },
            },
          },
        },
      });

    if (!paymentRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment request not found.",
        },
        { status: 404 }
      );
    }

    if (
      paymentRequest.status !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only an APPROVED payment request can be marked as paid.",
        },
        { status: 409 }
      );
    }

    const requestAmount =
      new Prisma.Decimal(
        paymentRequest.amount
      );

    const paidDecimal =
      new Prisma.Decimal(
        paidAmount
      );

    if (
      !paidDecimal.equals(
        requestAmount
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount must exactly match the approved payment request amount.",
        },
        { status: 400 }
      );
    }

    const wallet =
      paymentRequest
        .testerProfile
        .wallet;

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester wallet not found.",
        },
        { status: 409 }
      );
    }

    if (
      new Prisma.Decimal(
        wallet.availableBalance
      ).lessThan(
        paidDecimal
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester wallet balance is lower than the payment amount.",
        },
        { status: 409 }
      );
    }

    const now =
      new Date();

    // ============================================================
    // 5. TRANSACTION
    // ============================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------------
          // UPDATE WALLET
          // ------------------------------------------------------

          const updatedWallet =
            await tx.testerWallet.update({
              where: {
                id:
                  wallet.id,
              },

              data: {
                availableBalance: {
                  decrement:
                    paidDecimal,
                },

                totalPaid: {
                  increment:
                    paidDecimal,
                },
              },
            });

          // ------------------------------------------------------
          // PAYMENT REQUEST = PAID
          // ------------------------------------------------------

          const paidRequest =
            await tx.paymentRequest.update({
              where: {
                id:
                  paymentRequest.id,
              },

              data: {
                status:
                  "PAID",

                paidAt:
                  now,

                paidBy:
                  currentUser.userId,

                paidAmount:
                  paidDecimal,

                paidMethod,

                transactionReference,

                adminNote:
                  adminNote ||
                  null,
              },
            });

          // ------------------------------------------------------
          // WALLET TRANSACTION
          // ------------------------------------------------------

          const walletTransaction =
            await tx.walletTransaction.create({
              data: {
                walletId:
                  updatedWallet.id,

                testerCampaignId:
                  paymentRequest
                    .testerCampaignId,

                paymentRequestId:
                  paymentRequest.id,

                type:
                  "PAYMENT_PAID",

                amount:
                  paidDecimal,

                balanceAfter:
                  updatedWallet
                    .availableBalance,

                description:
                  `Manual payment marked paid via ${
                    paidMethod ===
                    "BANK_TRANSFER"
                      ? "Bank Transfer"
                      : "UPI"
                  }. Reference: ${transactionReference}`,
              },
            });

          return {
            updatedWallet,
            paidRequest,
            walletTransaction,
          };
        }
      );

    // ============================================================
    // 6. WHATSAPP NOTIFICATION (AFTER SUCCESSFUL TRANSACTION)
    // ============================================================

    let whatsappSent = false;
    let whatsappError: string | null = null;

    const testerMobile =
      paymentRequest.testerProfile.user.mobile;

    if (!testerMobile?.trim()) {
      whatsappError =
        "Tester mobile number is not available.";
    } else {
      try {
        await sendWhatsAppTemplate({
          to: testerMobile,

          templateName:
            process.env
              .WHATSAPP_TEMPLATE_PAYMENT_SUCCESSFULLY_PROCESSED ||
            "payment_successfully_processed",

          parameters: [
            paymentRequest.testerProfile.fullName,
            `₹${Number(result.paidRequest.paidAmount).toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`,
            result.paidRequest.transactionReference ||
              transactionReference,
          ],

          languageCode: "en",

          callbackData:
            `payment-request-${result.paidRequest.id}-paid`,
        });

        whatsappSent = true;
      } catch (whatsappSendError) {
        console.error(
          "PAYMENT PAID WHATSAPP ERROR:",
          whatsappSendError
        );

        whatsappError =
          whatsappSendError instanceof Error
            ? whatsappSendError.message
            : "Unable to send WhatsApp notification.";
      }
    }

    // ============================================================
    // 7. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment marked as paid successfully.",

        whatsappSent,
        whatsappError,

        data: {
          paymentRequest: {
            id:
              result
                .paidRequest.id,

            status:
              result
                .paidRequest.status,

            paidAt:
              result
                .paidRequest.paidAt,

            paidAmount:
              result
                .paidRequest
                .paidAmount,

            paidMethod:
              result
                .paidRequest
                .paidMethod,

            transactionReference:
              result
                .paidRequest
                .transactionReference,
          },

          wallet: {
            totalEarned:
              result
                .updatedWallet
                .totalEarned,

            availableBalance:
              result
                .updatedWallet
                .availableBalance,

            totalPaid:
              result
                .updatedWallet
                .totalPaid,
          },

          walletTransaction: {
            id:
              result
                .walletTransaction
                .id,

            type:
              result
                .walletTransaction
                .type,

            amount:
              result
                .walletTransaction
                .amount,

            balanceAfter:
              result
                .walletTransaction
                .balanceAfter,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin mark-paid error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment appears to have already been recorded.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while marking the payment as paid.",
      },
      { status: 500 }
    );
  }
}