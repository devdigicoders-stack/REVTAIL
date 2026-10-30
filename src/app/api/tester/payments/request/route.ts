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

type RequestBody = {
  testerCampaignId?: unknown;

  preferredPaymentMethod?: unknown;
};

export async function POST(
  request: NextRequest
) {
  try {
    // ============================================================
    // 1. AUTHENTICATED TESTER
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
            "Forbidden. Only testers can request campaign payments.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. REQUEST BODY
    // ============================================================

    const body =
      (await request.json()) as
        RequestBody;

    const testerCampaignId =
      Number(
        body.testerCampaignId
      );

    const preferredPaymentMethod =
      typeof body.preferredPaymentMethod ===
      "string"
        ? body.preferredPaymentMethod
            .trim()
            .toUpperCase()
        : "";

    // ============================================================
    // 3. VALIDATE CAMPAIGN ID
    // ============================================================

    if (
      !Number.isInteger(
        testerCampaignId
      ) ||
      testerCampaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid testerCampaignId.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 4. VALIDATE PAYMENT METHOD
    // ============================================================

    if (
      preferredPaymentMethod !==
        "UPI" &&
      preferredPaymentMethod !==
        "BANK_TRANSFER"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Preferred payment method must be UPI or BANK_TRANSFER.",
        },
        {
          status: 400,
        }
      );
    }

    const paymentMethod =
      preferredPaymentMethod as
        ManualPaymentMethod;

    // ============================================================
    // 5. TESTER PROFILE
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

          approvalStatus: true,

          bankDetails: {
            select: {
              id: true,

              accountHolderName: true,

              bankName: true,

              accountNumber: true,

              accountNumberLast4:
                true,

              ifscCode: true,

              upiId: true,

              isVerified: true,

              isActive: true,
            },
          },
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
            "Your tester profile must be approved before requesting payment.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 6. BANK DETAILS
    // ============================================================

    const bankDetails =
      testerProfile.bankDetails;

    if (
      !bankDetails ||
      !bankDetails.isActive
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Please add active payment details before requesting payment.",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------------------
    // UPI
    // ------------------------------------------------------------

    if (
      paymentMethod ===
        "UPI" &&
      !bankDetails.upiId
        ?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "UPI ID is not available in your payment details.",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------------------
    // BANK TRANSFER
    // ------------------------------------------------------------

    if (
      paymentMethod ===
      "BANK_TRANSFER"
    ) {
      if (
        !bankDetails
          .accountHolderName
          ?.trim() ||
        !bankDetails
          .bankName
          ?.trim() ||
        !bankDetails
          .accountNumber
          ?.trim() ||
        !bankDetails
          .ifscCode
          ?.trim()
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Complete bank account details are required for bank transfer.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ============================================================
    // 7. COMPLETED TESTER CAMPAIGN
    // ============================================================

    const testerCampaign =
      await prisma.testerCampaign.findFirst({
        where: {
          id:
            testerCampaignId,

          testerProfileId:
            testerProfile.id,
        },

        select: {
          id: true,

          status: true,

          earningAmount: true,

          completedAt: true,

          campaign: {
            select: {
              id: true,

              productName: true,

              brand: {
                select: {
                  companyName: true,
                },
              },
            },
          },

          paymentRequest: {
            select: {
              id: true,

              status: true,

              amount: true,

              preferredPaymentMethod:
                true,

              requestedAt: true,

              rejectionReason:
                true,
            },
          },
        },
      });

    if (!testerCampaign) {
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

    // ============================================================
    // 8. MUST BE COMPLETED
    // ============================================================

    if (
      testerCampaign.status !==
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Payment can only be requested after the campaign is completed.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !testerCampaign.completedAt
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Campaign completion information is missing.",
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 9. VALID EARNING
    // ============================================================

    const earningAmount =
      new Prisma.Decimal(
        testerCampaign.earningAmount
      );

    if (
      earningAmount.lessThanOrEqualTo(
        0
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This campaign does not have a payable earning amount.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 10. EXISTING PAYMENT REQUEST
    // ============================================================

    const existingRequest =
      testerCampaign.paymentRequest;

    /*
     * REJECTED request:
     * allow Tester to submit the SAME request again.
     *
     * We don't create a second row because testerCampaignId
     * is unique.
     */

    if (
      existingRequest &&
      existingRequest.status !==
        "REJECTED"
    ) {
      let message =
        "A payment request already exists for this campaign.";

      if (
        existingRequest.status ===
        "PENDING"
      ) {
        message =
          "Your payment request is already waiting for Admin review.";
      }

      if (
        existingRequest.status ===
        "APPROVED"
      ) {
        message =
          "Your payment request has already been approved and is awaiting manual payment.";
      }

      if (
        existingRequest.status ===
        "PAID"
      ) {
        message =
          "Payment for this campaign has already been marked as paid.";
      }

      return NextResponse.json(
        {
          success: false,

          message,

          data: {
            paymentRequestId:
              existingRequest.id,

            status:
              existingRequest.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 11. DATABASE TRANSACTION
    // ============================================================

    const now =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ======================================================
          // A. GET OR CREATE WALLET
          // ======================================================

          let wallet =
            await tx.testerWallet.findUnique({
              where: {
                testerProfileId:
                  testerProfile.id,
              },
            });

          if (!wallet) {
            wallet =
              await tx.testerWallet.create({
                data: {
                  testerProfileId:
                    testerProfile.id,

                  totalEarned:
                    new Prisma.Decimal(
                      0
                    ),

                  availableBalance:
                    new Prisma.Decimal(
                      0
                    ),

                  totalPaid:
                    new Prisma.Decimal(
                      0
                    ),
                },
              });
          }

          // ======================================================
          // B. HAS THIS CAMPAIGN ALREADY BEEN CREDITED?
          // ======================================================

          const existingEarningTransaction =
            await tx.walletTransaction.findFirst({
              where: {
                walletId:
                  wallet.id,

                testerCampaignId:
                  testerCampaign.id,

                type:
                  "CAMPAIGN_EARNING",
              },

              select: {
                id: true,
              },
            });

          // ======================================================
          // C. CREDIT COMPLETED CAMPAIGN TO WALLET
          // ======================================================

          if (
            !existingEarningTransaction
          ) {
            const updatedWallet =
              await tx.testerWallet.update({
                where: {
                  id:
                    wallet.id,
                },

                data: {
                  totalEarned: {
                    increment:
                      earningAmount,
                  },

                  availableBalance: {
                    increment:
                      earningAmount,
                  },
                },
              });

            await tx.walletTransaction.create({
              data: {
                walletId:
                  wallet.id,

                testerCampaignId:
                  testerCampaign.id,

                type:
                  "CAMPAIGN_EARNING",

                amount:
                  earningAmount,

                balanceAfter:
                  updatedWallet.availableBalance,

                description:
                  `Campaign earning credited for ${testerCampaign.campaign.productName}.`,
              },
            });

            wallet =
              updatedWallet;
          }

          // ======================================================
          // D. CREATE OR RESUBMIT PAYMENT REQUEST
          // ======================================================

          let paymentRequest;

          if (
            existingRequest?.status ===
            "REJECTED"
          ) {
            paymentRequest =
              await tx.paymentRequest.update({
                where: {
                  id:
                    existingRequest.id,
                },

                data: {
                  amount:
                    earningAmount,

                  preferredPaymentMethod:
                    paymentMethod,

                  status:
                    "PENDING",

                  requestedAt:
                    now,

                  reviewedAt:
                    null,

                  reviewedBy:
                    null,

                  rejectionReason:
                    null,

                  approvedAt:
                    null,

                  paidAt:
                    null,

                  paidBy:
                    null,

                  paidAmount:
                    null,

                  paidMethod:
                    null,

                  transactionReference:
                    null,

                  adminNote:
                    null,
                },
              });
          } else {
            paymentRequest =
              await tx.paymentRequest.create({
                data: {
                  testerProfileId:
                    testerProfile.id,

                  testerCampaignId:
                    testerCampaign.id,

                  amount:
                    earningAmount,

                  preferredPaymentMethod:
                    paymentMethod,

                  status:
                    "PENDING",

                  requestedAt:
                    now,
                },
              });
          }

          // ======================================================
          // E. REFRESH WALLET
          // ======================================================

          const finalWallet =
            await tx.testerWallet.findUniqueOrThrow({
              where: {
                id:
                  wallet.id,
              },
            });

          return {
            paymentRequest,
            wallet:
              finalWallet,
          };
        }
      );

    // ============================================================
    // WHATSAPP: PAYMENT REQUEST RECEIVED
    // Send only after the payment request is committed.
    // A WhatsApp failure must not undo the successful request.
    // ============================================================

    let whatsappSent = false;
    let whatsappError: string | null = null;

    const testerMobile =
      testerProfile.user?.mobile?.trim();

    if (!testerMobile) {
      whatsappError =
        "Tester mobile number is not available.";
    } else {
      try {
        const amountText =
          `₹${Number(result.paymentRequest.amount).toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`;

        await sendWhatsAppTemplate({
          to: testerMobile,

          templateName:
            process.env
              .WHATSAPP_TEMPLATE_WITHDRAWAL_REQUEST_RECEIVED ||
            "withdrawal_request_received",

          parameters: [
            testerProfile.fullName,
            amountText,
          ],

          languageCode: "en",

          callbackData:
            `tester-payment-request-${result.paymentRequest.id}`,
        });

        whatsappSent = true;
      } catch (whatsappSendError) {
        console.error(
          "PAYMENT REQUEST WHATSAPP ERROR:",
          whatsappSendError
        );

        whatsappError =
          whatsappSendError instanceof Error
            ? whatsappSendError.message
            : "Unable to send WhatsApp notification.";
      }
    }

    // ============================================================
    // 12. SAFE PAYMENT DESTINATION RESPONSE
    // ============================================================

    const destination =
      paymentMethod ===
      "UPI"
        ? {
            method:
              "UPI",

            upiId:
              bankDetails.upiId,
          }
        : {
            method:
              "BANK_TRANSFER",

            accountHolderName:
              bankDetails.accountHolderName,

            bankName:
              bankDetails.bankName,

            accountNumberLast4:
              bankDetails.accountNumberLast4 ??
              getLast4(
                bankDetails.accountNumber
              ),

            ifscCode:
              bankDetails.ifscCode,
          };

    // ============================================================
    // 13. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          existingRequest?.status ===
          "REJECTED"
            ? "Payment request resubmitted successfully."
            : "Payment request submitted successfully.",

        whatsappSent,
        whatsappError,

        data: {
          paymentRequest: {
            id:
              result.paymentRequest.id,

            testerCampaignId:
              result.paymentRequest
                .testerCampaignId,

            amount:
              result.paymentRequest
                .amount,

            status:
              result.paymentRequest
                .status,

            preferredPaymentMethod:
              result.paymentRequest
                .preferredPaymentMethod,

            requestedAt:
              result.paymentRequest
                .requestedAt,
          },

          campaign: {
            id:
              testerCampaign
                .campaign.id,

            productName:
              testerCampaign
                .campaign
                .productName,

            brandName:
              testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,

            completedAt:
              testerCampaign
                .completedAt,
          },

          paymentDestination:
            destination,

          wallet: {
            totalEarned:
              result.wallet
                .totalEarned,

            availableBalance:
              result.wallet
                .availableBalance,

            totalPaid:
              result.wallet
                .totalPaid,
          },
        },
      },
      {
        status:
          existingRequest?.status ===
          "REJECTED"
            ? 200
            : 201,
      }
    );
  } catch (error) {
    console.error(
      "Tester payment request error:",
      error
    );

    // ============================================================
    // UNIQUE CONFLICT
    // ============================================================

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
            "A payment request or wallet transaction already exists. Please refresh and try again.",
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
          "Something went wrong while submitting the payment request.",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// MASK ACCOUNT
// ============================================================

function getLast4(
  accountNumber: string
) {
  if (!accountNumber) {
    return null;
  }

  return accountNumber
    .replace(/\s+/g, "")
    .slice(-4);
}