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
          message: "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (currentUser.role !== "TESTER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access payment eligibility.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TESTER PROFILE + PAYMENT DETAILS
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

          approvalStatus: true,

          bankDetails: {
            select: {
              id: true,

              accountHolderName:
                true,

              bankName:
                true,

              accountNumber:
                true,

              accountNumberLast4:
                true,

              ifscCode:
                true,

              upiId:
                true,

              isActive:
                true,

              isVerified:
                true,
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
            "Tester profile must be approved before requesting payment.",
        },
        {
          status: 403,
        }
      );
    }

    const bankDetails =
      testerProfile.bankDetails;

    // ============================================================
    // 3. AVAILABLE PAYMENT METHODS
    // ============================================================

    const upiAvailable =
      Boolean(
        bankDetails?.isActive &&
          bankDetails.upiId?.trim()
      );

    const bankTransferAvailable =
      Boolean(
        bankDetails?.isActive &&
          bankDetails.accountHolderName?.trim() &&
          bankDetails.bankName?.trim() &&
          bankDetails.accountNumber?.trim() &&
          bankDetails.ifscCode?.trim()
      );

    // ============================================================
    // 4. COMPLETED CAMPAIGNS
    // ============================================================

    const campaigns =
      await prisma.testerCampaign.findMany({
        where: {
          testerProfileId:
            testerProfile.id,

          status:
            "COMPLETED",
        },

        select: {
          id: true,

          earningAmount:
            true,

          joinedAt:
            true,

          completedAt:
            true,

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
                  companyName:
                    true,
                },
              },
            },
          },

          paymentRequest: {
            select: {
              id: true,

              amount:
                true,

              status:
                true,

              preferredPaymentMethod:
                true,

              requestedAt:
                true,

              approvedAt:
                true,

              rejectionReason:
                true,

              paidAt:
                true,

              paidAmount:
                true,

              paidMethod:
                true,

              transactionReference:
                true,
            },
          },
        },

        orderBy: {
          completedAt:
            "desc",
        },
      });

    // ============================================================
    // 5. FORMAT ELIGIBILITY
    // ============================================================

    const formattedCampaigns =
      campaigns.map(
        (testerCampaign) => {
          const request =
            testerCampaign.paymentRequest;

          let eligible =
            false;

          let eligibilityReason =
            "";

          if (!request) {
            eligible =
              upiAvailable ||
              bankTransferAvailable;

            eligibilityReason =
              eligible
                ? "Payment can be requested."
                : "Add valid UPI or bank details before requesting payment.";
          } else {
            switch (
              request.status
            ) {
              case "REJECTED":
                eligible =
                  upiAvailable ||
                  bankTransferAvailable;

                eligibilityReason =
                  eligible
                    ? "Previous request was rejected. You may submit the payment request again."
                    : "Previous request was rejected. Update your payout details before requesting again.";

                break;

              case "PENDING":
                eligibilityReason =
                  "Payment request is waiting for Admin review.";
                break;

              case "APPROVED":
                eligibilityReason =
                  "Payment request is approved and waiting for manual payment.";
                break;

              case "PAID":
                eligibilityReason =
                  "Payment has already been marked as paid.";
                break;

              default:
                eligibilityReason =
                  "Payment request is not currently available.";
            }
          }

          return {
            testerCampaignId:
              testerCampaign.id,

            earningAmount:
              testerCampaign.earningAmount,

            completedAt:
              testerCampaign.completedAt,

            campaign: {
              id:
                testerCampaign
                  .campaign.id,

              productName:
                testerCampaign
                  .campaign
                  .productName,

              productImage:
                testerCampaign
                  .campaign
                  .productImage,

              brandName:
                testerCampaign
                  .campaign
                  .brand
                  ?.companyName ??
                null,

              task4Required:
                testerCampaign
                  .campaign
                  .task4Required,
            },

            eligibility: {
              eligible,

              reason:
                eligibilityReason,
            },

            paymentRequest:
              request
                ? {
                    id:
                      request.id,

                    status:
                      request.status,

                    amount:
                      request.amount,

                    preferredPaymentMethod:
                      request.preferredPaymentMethod,

                    requestedAt:
                      request.requestedAt,

                    approvedAt:
                      request.approvedAt,

                    rejectionReason:
                      request.rejectionReason,

                    paidAt:
                      request.paidAt,

                    paidAmount:
                      request.paidAmount,

                    paidMethod:
                      request.paidMethod,

                    transactionReference:
                      request.transactionReference,
                  }
                : null,
          };
        }
      );

    // ============================================================
    // 6. COUNTS
    // ============================================================

    const eligibleCount =
      formattedCampaigns.filter(
        (item) =>
          item.eligibility
            .eligible
      ).length;

    const pendingCount =
      formattedCampaigns.filter(
        (item) =>
          item.paymentRequest
            ?.status ===
          "PENDING"
      ).length;

    const approvedCount =
      formattedCampaigns.filter(
        (item) =>
          item.paymentRequest
            ?.status ===
          "APPROVED"
      ).length;

    const paidCount =
      formattedCampaigns.filter(
        (item) =>
          item.paymentRequest
            ?.status ===
          "PAID"
      ).length;

    // ============================================================
    // 7. SAFE PAYMENT DETAILS
    // ============================================================

    const paymentProfile = {
      hasActivePaymentDetails:
        Boolean(
          bankDetails?.isActive
        ),

      upiAvailable,

      bankTransferAvailable,

      upiId:
        upiAvailable
          ? bankDetails?.upiId
          : null,

      bankAccount:
        bankTransferAvailable
          ? {
              accountHolderName:
                bankDetails
                  ?.accountHolderName,

              bankName:
                bankDetails
                  ?.bankName,

              accountNumberLast4:
                bankDetails
                  ?.accountNumberLast4 ??
                getLast4(
                  bankDetails
                    ?.accountNumber ??
                    ""
                ),

              ifscCode:
                bankDetails
                  ?.ifscCode,

              isVerified:
                Boolean(
                  bankDetails
                    ?.isVerified
                ),
            }
          : null,
    };

    // ============================================================
    // 8. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment eligibility fetched successfully.",

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,
          },

          paymentProfile,

          summary: {
            completedCampaigns:
              formattedCampaigns.length,

            eligible:
              eligibleCount,

            pending:
              pendingCount,

            approved:
              approvedCount,

            paid:
              paidCount,
          },

          campaigns:
            formattedCampaigns,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Tester payment eligibility error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while checking payment eligibility.",
      },
      {
        status: 500,
      }
    );
  }
}

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