import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      paymentRequestId: string;
    }>;
  }
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
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only Admin can view payment details.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. PAYMENT REQUEST ID
    // ============================================================

    const {
      paymentRequestId,
    } =
      await context.params;

    const parsedId =
      Number(
        paymentRequestId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment request ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. LOAD PAYMENT REQUEST
    // ============================================================

    const paymentRequest =
      await prisma.paymentRequest.findUnique({
        where: {
          id: parsedId,
        },

        select: {
          id: true,

          amount: true,

          preferredPaymentMethod:
            true,

          status: true,

          requestedAt: true,

          reviewedAt: true,

          approvedAt: true,

          rejectionReason:
            true,

          paidAt: true,

          paidAmount: true,

          paidMethod: true,

          transactionReference:
            true,

          adminNote: true,

          createdAt: true,

          updatedAt: true,

          // ======================================================
          // TESTER
          // ======================================================

          testerProfile: {
            select: {
              id: true,

              fullName: true,

              user: {
                select: {
                  email: true,

                  mobile: true,
                },
              },

              bankDetails: {
                select: {
                  accountHolderName:
                    true,

                  bankName: true,

                  accountNumber: true,

                  accountNumberLast4:
                    true,

                  ifscCode: true,

                  upiId: true,

                  isActive: true,

                  isVerified:
                    true,
                },
              },

              wallet: {
                select: {
                  id: true,

                  totalEarned:
                    true,

                  availableBalance:
                    true,

                  totalPaid: true,
                },
              },
            },
          },

          // ======================================================
          // CAMPAIGN
          // ======================================================

          testerCampaign: {
            select: {
              id: true,

              status: true,

              earningAmount:
                true,

              completedAt: true,

              campaign: {
                select: {
                  id: true,

                  productName:
                    true,

                  productImage:
                    true,

                  task4Required:
                    true,

                  brand: {
                    select: {
                      id: true,

                      companyName:
                        true,
                    },
                  },
                },
              },
            },
          },

          // ======================================================
          // REVIEWED BY
          //
          // User has no name field.
          // Admin name comes from adminProfile.fullName.
          // ======================================================

          reviewer: {
            select: {
              id: true,

              role: true,

              adminProfile: {
                select: {
                  fullName:
                    true,
                },
              },
            },
          },

          // ======================================================
          // PAID BY
          // ======================================================

          payer: {
            select: {
              id: true,

              role: true,

              adminProfile: {
                select: {
                  fullName:
                    true,
                },
              },
            },
          },

          // ======================================================
          // WALLET TRANSACTIONS
          // ======================================================

          walletTransactions: {
            orderBy: {
              createdAt:
                "asc",
            },

            select: {
              id: true,

              type: true,

              amount: true,

              balanceAfter:
                true,

              description:
                true,

              createdAt: true,
            },
          },
        },
      });

    // ============================================================
    // 4. NOT FOUND
    // ============================================================

    if (!paymentRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment request not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 5. ADMIN NAMES
    // ============================================================

    const reviewerName =
      paymentRequest
        .reviewer
        ?.adminProfile
        ?.fullName ??
      "Admin";

    const payerName =
      paymentRequest
        .payer
        ?.adminProfile
        ?.fullName ??
      "Admin";

    // ============================================================
    // 6. PAYMENT TIMELINE
    // ============================================================

    const timeline: Array<{
      type: string;

      title: string;

      description:
        string;

      date: Date;

      actor:
        | string
        | null;
    }> = [
      {
        type:
          "REQUESTED",

        title:
          "Payment Requested",

        description:
          `Tester requested payment of ₹${Number(
            paymentRequest.amount
          ).toLocaleString(
            "en-IN"
          )}.`,

        date:
          paymentRequest.requestedAt,

        actor:
          paymentRequest
            .testerProfile
            .fullName,
      },
    ];

    // ============================================================
    // REJECTED
    // ============================================================

    if (
      paymentRequest.status ===
        "REJECTED" &&
      paymentRequest.reviewedAt
    ) {
      timeline.push({
        type:
          "REJECTED",

        title:
          "Payment Request Rejected",

        description:
          paymentRequest
            .rejectionReason ||
          "Payment request was rejected by Admin.",

        date:
          paymentRequest
            .reviewedAt,

        actor:
          reviewerName,
      });
    }

    // ============================================================
    // APPROVED
    // ============================================================

    if (
      paymentRequest.approvedAt
    ) {
      timeline.push({
        type:
          "APPROVED",

        title:
          "Payment Request Approved",

        description:
          "Admin approved the payment request.",

        date:
          paymentRequest
            .approvedAt,

        actor:
          reviewerName,
      });
    }

    // ============================================================
    // PAID
    // ============================================================

    if (
      paymentRequest.paidAt
    ) {
      timeline.push({
        type:
          "PAID",

        title:
          "Payment Marked Paid",

        description:
          `Payment recorded using ${formatPaymentMethod(
            paymentRequest.paidMethod
          )}${
            paymentRequest
              .transactionReference
              ? `. Reference: ${paymentRequest.transactionReference}`
              : ""
          }.`,

        date:
          paymentRequest
            .paidAt,

        actor:
          payerName,
      });
    }

    // ============================================================
    // SORT TIMELINE
    // ============================================================

    timeline.sort(
      (
        first,
        second
      ) =>
        first.date.getTime() -
        second.date.getTime()
    );

    // ============================================================
    // 7. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment details fetched successfully.",

        data: {
          // ======================================================
          // PAYMENT
          // ======================================================

          paymentRequest: {
            id:
              paymentRequest.id,

            amount:
              paymentRequest.amount,

            preferredPaymentMethod:
              paymentRequest
                .preferredPaymentMethod,

            status:
              paymentRequest.status,

            requestedAt:
              paymentRequest
                .requestedAt,

            reviewedAt:
              paymentRequest
                .reviewedAt,

            approvedAt:
              paymentRequest
                .approvedAt,

            rejectionReason:
              paymentRequest
                .rejectionReason,

            paidAt:
              paymentRequest
                .paidAt,

            paidAmount:
              paymentRequest
                .paidAmount,

            paidMethod:
              paymentRequest
                .paidMethod,

            transactionReference:
              paymentRequest
                .transactionReference,

            adminNote:
              paymentRequest
                .adminNote,

            createdAt:
              paymentRequest
                .createdAt,

            updatedAt:
              paymentRequest
                .updatedAt,
          },

          // ======================================================
          // TESTER
          // ======================================================

          tester: {
            id:
              paymentRequest
                .testerProfile
                .id,

            fullName:
              paymentRequest
                .testerProfile
                .fullName,

            email:
              paymentRequest
                .testerProfile
                .user
                .email,

            mobile:
              paymentRequest
                .testerProfile
                .user
                .mobile,

            bankDetails:
              paymentRequest
                .testerProfile
                .bankDetails,

            wallet:
              paymentRequest
                .testerProfile
                .wallet,
          },

          // ======================================================
          // CAMPAIGN
          // ======================================================

          campaign: {
            testerCampaignId:
              paymentRequest
                .testerCampaign
                .id,

            testerCampaignStatus:
              paymentRequest
                .testerCampaign
                .status,

            earningAmount:
              paymentRequest
                .testerCampaign
                .earningAmount,

            completedAt:
              paymentRequest
                .testerCampaign
                .completedAt,

            id:
              paymentRequest
                .testerCampaign
                .campaign
                .id,

            productName:
              paymentRequest
                .testerCampaign
                .campaign
                .productName,

            productImage:
              paymentRequest
                .testerCampaign
                .campaign
                .productImage,

            task4Required:
              paymentRequest
                .testerCampaign
                .campaign
                .task4Required,

            brandName:
              paymentRequest
                .testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,
          },

          // ======================================================
          // REVIEWER
          // ======================================================

          reviewer:
            paymentRequest
              .reviewer
              ? {
                  id:
                    paymentRequest
                      .reviewer
                      .id,

                  name:
                    reviewerName,

                  role:
                    paymentRequest
                      .reviewer
                      .role,
                }
              : null,

          // ======================================================
          // PAYER
          // ======================================================

          payer:
            paymentRequest
              .payer
              ? {
                  id:
                    paymentRequest
                      .payer
                      .id,

                  name:
                    payerName,

                  role:
                    paymentRequest
                      .payer
                      .role,
                }
              : null,

          // ======================================================
          // HISTORY
          // ======================================================

          timeline,

          walletTransactions:
            paymentRequest
              .walletTransactions,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN PAYMENT DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load payment details.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PAYMENT METHOD
// ============================================================

function formatPaymentMethod(
  method:
    | string
    | null
) {
  if (!method) {
    return "manual payment";
  }

  return method ===
    "BANK_TRANSFER"
    ? "Bank Transfer"
    : "UPI";
}