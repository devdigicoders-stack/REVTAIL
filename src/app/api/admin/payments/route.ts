import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const VALID_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAID",
] as const;

type PaymentStatus =
  (typeof VALID_STATUSES)[number];

export async function GET(
  request: NextRequest
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
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. QUERY PARAMETERS
    // ============================================================

    const { searchParams } =
      new URL(request.url);

    const requestedPage =
      Number(
        searchParams.get("page") ||
          "1"
      );

    const requestedLimit =
      Number(
        searchParams.get("limit") ||
          "10"
      );

    const page =
      Number.isInteger(
        requestedPage
      ) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(
        requestedLimit
      ) &&
      requestedLimit > 0 &&
      requestedLimit <= 100
        ? requestedLimit
        : 10;

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const statusParam =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const exportAll =
      searchParams.get("export") ===
      "1";

    // ============================================================
    // 3. STATUS VALIDATION
    // ============================================================

    let status:
      | PaymentStatus
      | undefined;

    if (statusParam) {
      if (
        !VALID_STATUSES.includes(
          statusParam as PaymentStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment status.",
          },
          {
            status: 400,
          }
        );
      }

      status =
        statusParam as PaymentStatus;
    }

    // ============================================================
    // 4. WHERE
    // ============================================================

    const where: any = {};

    if (status) {
      where.status =
        status;
    }

    if (search) {
      where.OR = [
        // Tester name
        {
          testerProfile: {
            is: {
              fullName: {
                contains:
                  search,
              },
            },
          },
        },

        // Product / campaign
        {
          testerCampaign: {
            is: {
              campaign: {
                is: {
                  productName: {
                    contains:
                      search,
                  },
                },
              },
            },
          },
        },

        // Brand
        {
          testerCampaign: {
            is: {
              campaign: {
                is: {
                  brand: {
                    is: {
                      companyName: {
                        contains:
                          search,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // Transaction reference
        {
          transactionReference: {
            contains:
              search,
          },
        },

        // Admin note
        {
          adminNote: {
            contains:
              search,
          },
        },
      ];
    }

    // ============================================================
    // 5. SELECT
    // ============================================================

    const paymentSelect = {
      id: true,

      amount: true,

      preferredPaymentMethod:
        true,

      status: true,

      requestedAt: true,

      reviewedAt: true,

      approvedAt: true,

      rejectionReason: true,

      paidAt: true,

      paidAmount: true,

      paidMethod: true,

      transactionReference:
        true,

      adminNote: true,

      testerProfile: {
        select: {
          id: true,

          fullName: true,

          bankDetails: {
            select: {
              accountHolderName:
                true,

              bankName: true,

              accountNumberLast4:
                true,

              ifscCode: true,

              upiId: true,

              isActive: true,

              isVerified: true,
            },
          },
        },
      },

      testerCampaign: {
        select: {
          id: true,

          earningAmount: true,

          completedAt: true,

          campaign: {
            select: {
              id: true,

              productName: true,

              productImage: true,

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
    } as const;

    // ============================================================
    // 6. QUERY
    // ============================================================

    const [
      requests,
      filteredTotal,
      total,
      pending,
      approved,
      paid,
      rejected,
    ] =
      await Promise.all([
        prisma.paymentRequest.findMany({
          where,

          select:
            paymentSelect,

          ...(exportAll
            ? {}
            : {
                skip:
                  (page - 1) *
                  limit,

                take:
                  limit,
              }),

          orderBy: {
            requestedAt:
              "desc",
          },
        }),

        prisma.paymentRequest.count({
          where,
        }),

        prisma.paymentRequest.count(),

        prisma.paymentRequest.count({
          where: {
            status:
              "PENDING",
          },
        }),

        prisma.paymentRequest.count({
          where: {
            status:
              "APPROVED",
          },
        }),

        prisma.paymentRequest.count({
          where: {
            status:
              "PAID",
          },
        }),

        prisma.paymentRequest.count({
          where: {
            status:
              "REJECTED",
          },
        }),
      ]);

    // ============================================================
    // 7. FORMAT
    // ============================================================

    const formatted =
      requests.map(
        (request) => ({
          id:
            request.id,

          amount:
            request.amount,

          preferredPaymentMethod:
            request.preferredPaymentMethod,

          status:
            request.status,

          requestedAt:
            request.requestedAt,

          reviewedAt:
            request.reviewedAt,

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

          adminNote:
            request.adminNote,

          tester: {
            id:
              request.testerProfile.id,

            fullName:
              request.testerProfile
                .fullName,

            bankDetails:
              request.testerProfile
                .bankDetails,
          },

          campaign: {
            testerCampaignId:
              request.testerCampaign.id,

            productName:
              request.testerCampaign
                .campaign
                .productName,

            productImage:
              request.testerCampaign
                .campaign
                .productImage,

            brandName:
              request.testerCampaign
                .campaign
                .brand
                ?.companyName ??
              null,

            completedAt:
              request.testerCampaign
                .completedAt,
          },

          reviewer:
            request.reviewer
              ? {
                  id:
                    request.reviewer.id,

                  name:
                    request.reviewer
                      .adminProfile
                      ?.fullName ??
                    "Admin",

                  role:
                    request.reviewer.role,
                }
              : null,

          payer:
            request.payer
              ? {
                  id:
                    request.payer.id,

                  name:
                    request.payer
                      .adminProfile
                      ?.fullName ??
                    "Admin",

                  role:
                    request.payer.role,
                }
              : null,
        })
      );

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filteredTotal /
            limit
        )
      );

    // ============================================================
    // 8. RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      data: {
        total,
        pending,
        approved,
        paid,
        rejected,

        requests:
          formatted,

        pagination: {
          page,

          limit,

          total:
            filteredTotal,

          totalPages,

          hasNextPage:
            page <
            totalPages,

          hasPreviousPage:
            page > 1,
        },
      },
    });
  } catch (error) {
    console.error(
      "Admin payments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load payment requests.",
      },
      {
        status: 500,
      }
    );
  }
}