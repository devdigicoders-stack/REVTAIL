import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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
            "Forbidden. Only testers can access wallet information.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TESTER
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

          wallet: {
            select: {
              id: true,

              totalEarned:
                true,

              availableBalance:
                true,

              totalPaid:
                true,

              createdAt:
                true,

              updatedAt:
                true,

              transactions: {
                orderBy: {
                  createdAt:
                    "desc",
                },

                take: 100,

                select: {
                  id: true,

                  type: true,

                  amount: true,

                  balanceAfter:
                    true,

                  description:
                    true,

                  createdAt:
                    true,

                  testerCampaign: {
                    select: {
                      id: true,

                      campaign: {
                        select: {
                          productName:
                            true,

                          brand: {
                            select: {
                              companyName:
                                true,
                            },
                          },
                        },
                      },
                    },
                  },

                  paymentRequest: {
                    select: {
                      id: true,

                      status: true,

                      paidMethod:
                        true,

                      transactionReference:
                        true,

                      paidAt:
                        true,
                    },
                  },
                },
              },
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

    // ============================================================
    // 3. PAYMENT REQUEST SUMMARY
    // ============================================================

    const paymentRequests =
      await prisma.paymentRequest.findMany({
        where: {
          testerProfileId:
            testerProfile.id,
        },

        select: {
          id: true,

          amount: true,

          status: true,

          requestedAt:
            true,

          approvedAt:
            true,

          paidAt:
            true,

          paidAmount:
            true,

          preferredPaymentMethod:
            true,

          paidMethod:
            true,

          transactionReference:
            true,

          rejectionReason:
            true,

          testerCampaign: {
            select: {
              id: true,

              campaign: {
                select: {
                  productName:
                    true,

                  brand: {
                    select: {
                      companyName:
                        true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          requestedAt:
            "desc",
        },
      });

    const pendingAmount =
      paymentRequests
        .filter(
          (request) =>
            request.status ===
            "PENDING"
        )
        .reduce(
          (
            total,
            request
          ) =>
            total +
            Number(
              request.amount
            ),
          0
        );

    const approvedAmount =
      paymentRequests
        .filter(
          (request) =>
            request.status ===
            "APPROVED"
        )
        .reduce(
          (
            total,
            request
          ) =>
            total +
            Number(
              request.amount
            ),
          0
        );

    // ============================================================
    // 4. WALLET
    // ============================================================

    const wallet =
      testerProfile.wallet;

    const transactions =
      wallet?.transactions.map(
        (transaction) => ({
          id:
            transaction.id,

          type:
            transaction.type,

          amount:
            transaction.amount,

          balanceAfter:
            transaction.balanceAfter,

          description:
            transaction.description,

          createdAt:
            transaction.createdAt,

          campaign:
            transaction
              .testerCampaign
              ? {
                  testerCampaignId:
                    transaction
                      .testerCampaign.id,

                  productName:
                    transaction
                      .testerCampaign
                      .campaign
                      .productName,

                  brandName:
                    transaction
                      .testerCampaign
                      .campaign
                      .brand
                      ?.companyName ??
                    null,
                }
              : null,

          payment:
            transaction
              .paymentRequest
              ? {
                  id:
                    transaction
                      .paymentRequest
                      .id,

                  status:
                    transaction
                      .paymentRequest
                      .status,

                  paidMethod:
                    transaction
                      .paymentRequest
                      .paidMethod,

                  transactionReference:
                    transaction
                      .paymentRequest
                      .transactionReference,

                  paidAt:
                    transaction
                      .paymentRequest
                      .paidAt,
                }
              : null,
        })
      ) ?? [];

    // ============================================================
    // 5. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Wallet fetched successfully.",

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,
          },

          wallet: {
            exists:
              Boolean(wallet),

            totalEarned:
              wallet?.totalEarned ??
              0,

            availableBalance:
              wallet
                ?.availableBalance ??
              0,

            totalPaid:
              wallet?.totalPaid ??
              0,

            pendingAmount,

            approvedAwaitingPayment:
              approvedAmount,
          },

          transactions,

          paymentRequests:
            paymentRequests.map(
              (request) => ({
                id:
                  request.id,

                amount:
                  request.amount,

                status:
                  request.status,

                requestedAt:
                  request.requestedAt,

                approvedAt:
                  request.approvedAt,

                paidAt:
                  request.paidAt,

                paidAmount:
                  request.paidAmount,

                preferredPaymentMethod:
                  request
                    .preferredPaymentMethod,

                paidMethod:
                  request.paidMethod,

                transactionReference:
                  request
                    .transactionReference,

                rejectionReason:
                  request
                    .rejectionReason,

                campaign: {
                  testerCampaignId:
                    request
                      .testerCampaign.id,

                  productName:
                    request
                      .testerCampaign
                      .campaign
                      .productName,

                  brandName:
                    request
                      .testerCampaign
                      .campaign
                      .brand
                      ?.companyName ??
                    null,
                },
              })
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Tester wallet error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Something went wrong while loading your wallet.",
      },
      {
        status: 500,
      }
    );
  }
}