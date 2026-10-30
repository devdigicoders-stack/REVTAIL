//this api route is for admin to get all brands with pagination, search and status filter
import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

  function parseOptionalDate(
    value: string | null
  ): Date | null {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  }
  
export async function GET(
  request: NextRequest
) {
  try {
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
          message:
            "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    // ========================================================
    // PAGINATION
    // ========================================================

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

    const skip =
      (page - 1) * limit;

    // ========================================================
    // SEARCH
    // ========================================================

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    // ========================================================
    // STATUS
    // ========================================================

    const statusParam =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const allowedStatuses = [
      "PENDING",
      "ACTIVE",
      "REJECTED",
      "SUSPENDED",
      "INACTIVE",
    ] as const;

    type BrandStatus =
      (typeof allowedStatuses)[number];

    let approvalStatus:
      | BrandStatus
      | undefined;

    if (statusParam) {
      if (
        !allowedStatuses.includes(
          statusParam as BrandStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid Brand status.",
          },
          {
            status: 400,
          }
        );
      }

      approvalStatus =
        statusParam as BrandStatus;
    }

    // ========================================================
    // WHERE
    // ========================================================

    const where = {
      deletedAt: null,

      ...(approvalStatus
        ? {
            approvalStatus,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                companyName: {
                  contains:
                    search,
                },
              },

              {
                companyType: {
                  contains:
                    search,
                },
              },

              {
                category: {
                  contains:
                    search,
                },
              },

              {
                pocFullName: {
                  contains:
                    search,
                },
              },

              {
                pocMobile: {
                  contains:
                    search,
                },
              },

              {
                user: {
                  email: {
                    contains:
                      search,
                  },
                },
              },
            ],
          }
        : {}),
    };

    // ========================================================
    // DATA + COUNTS
    //
    // Avoid unnecessary DateTime fields here because we have
    // already encountered invalid legacy dates elsewhere.
    // ========================================================

    const [
      brands,
      totalFiltered,
      total,
      pending,
      active,
      rejected,
    ] =
      await Promise.all([
        prisma.brandProfile.findMany({
          where,

          skip,

          take: limit,

          select: {
            id: true,

            userId: true,

            companyName: true,

            companyType: true,

            category: true,

            website: true,

            pocFullName: true,

            pocMobile: true,

            designation: true,

            approvalStatus: true,

            rejectionReason: true,

            user: {
              select: {
                email: true,

                mobile: true,

                status: true,
              },
            },

            _count: {
              select: {
                campaigns: true,
              },
            },
          },

          orderBy: {
            id: "desc",
          },
        }),

        prisma.brandProfile.count({
          where,
        }),

        prisma.brandProfile.count({
          where: {
            deletedAt: null,
          },
        }),

        prisma.brandProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "PENDING",
          },
        }),

        prisma.brandProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "ACTIVE",
          },
        }),

        prisma.brandProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "REJECTED",
          },
        }),
      ]);

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalFiltered /
            limit
        )
      );

    return NextResponse.json({
      success: true,

      data: brands,

      summary: {
        total,
        pending,
        active,
        rejected,
      },

      pagination: {
        page,

        limit,

        total:
          totalFiltered,

        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET ADMIN BRANDS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load Brands.",
      },
      {
        status: 500,
      }
    );
  }
}