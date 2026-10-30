// This API route is for Admin to get all Brands
// with pagination, search and status filter.

import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// GET /api/admin/brands
//
// Examples:
//
// /api/admin/brands
// /api/admin/brands?page=1&limit=10
// /api/admin/brands?status=ACTIVE
// /api/admin/brands?search=nike
// /api/admin/brands?status=ACTIVE&limit=100
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

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
      currentUser.role !==
      "ADMIN"
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

    // ========================================================
    // 2. QUERY PARAMETERS
    // ========================================================

    const { searchParams } =
      new URL(request.url);

    // ========================================================
    // 3. PAGINATION
    // ========================================================

    const requestedPage =
      Number(
        searchParams.get(
          "page"
        ) || "1"
      );

    const requestedLimit =
      Number(
        searchParams.get(
          "limit"
        ) || "10"
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
      (page - 1) *
      limit;

    // ========================================================
    // 4. SEARCH
    // ========================================================

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    // ========================================================
    // 5. STATUS FILTER
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
    // 6. BUILD WHERE CONDITION
    // ========================================================
    //
    // IMPORTANT:
    //
    // BrandProfile.category is now an Interest relation.
    //
    // OLD:
    //
    // category: {
    //   contains: search
    // }
    //
    // NEW:
    //
    // category: {
    //   is: {
    //     name: {
    //       contains: search
    //     }
    //   }
    // }
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

              // ==============================================
              // CATEGORY / INTEREST SEARCH
              // ==============================================

              {
                category: {
                  is: {
                    name: {
                      contains:
                        search,
                    },
                  },
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
    // 7. DATA + COUNTS
    // ========================================================
    //
    // IMPORTANT:
    //
    // Do NOT use:
    //
    // category: true
    //
    // because category is now a related Interest record.
    //
    // Select only the Interest fields needed by this API.
    // This also prevents unnecessary fields such as timestamps
    // from being read from Interest.
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
        // ----------------------------------------------------
        // BRAND LIST
        // ----------------------------------------------------

        prisma.brandProfile.findMany({
          where,

          skip,

          take:
            limit,

          select: {
            id:
              true,

            userId:
              true,

            companyName:
              true,

            companyType:
              true,

            // ================================================
            // NEW CATEGORY FK
            // ================================================

            categoryId:
              true,

            // ================================================
            // CATEGORY / INTEREST
            // ================================================

            category: {
              select: {
                id:
                  true,

                name:
                  true,
              },
            },

            website:
              true,

            pocFullName:
              true,

            pocMobile:
              true,

            designation:
              true,

            approvalStatus:
              true,

            rejectionReason:
              true,

            // ================================================
            // USER
            // ================================================

            user: {
              select: {
                email:
                  true,

                mobile:
                  true,

                status:
                  true,
              },
            },

            // ================================================
            // CAMPAIGN COUNT
            // ================================================

            _count: {
              select: {
                campaigns:
                  true,
              },
            },
          },

          orderBy: {
            id: "desc",
          },
        }),

        // ----------------------------------------------------
        // FILTERED COUNT
        // ----------------------------------------------------

        prisma.brandProfile.count({
          where,
        }),

        // ----------------------------------------------------
        // TOTAL BRANDS
        // ----------------------------------------------------

        prisma.brandProfile.count({
          where: {
            deletedAt:
              null,
          },
        }),

        // ----------------------------------------------------
        // PENDING BRANDS
        // ----------------------------------------------------

        prisma.brandProfile.count({
          where: {
            deletedAt:
              null,

            approvalStatus:
              "PENDING",
          },
        }),

        // ----------------------------------------------------
        // ACTIVE BRANDS
        // ----------------------------------------------------

        prisma.brandProfile.count({
          where: {
            deletedAt:
              null,

            approvalStatus:
              "ACTIVE",
          },
        }),

        // ----------------------------------------------------
        // REJECTED BRANDS
        // ----------------------------------------------------

        prisma.brandProfile.count({
          where: {
            deletedAt:
              null,

            approvalStatus:
              "REJECTED",
          },
        }),
      ]);

    // ========================================================
    // 8. FORMAT RESPONSE
    // ========================================================
    //
    // Keep category as a readable string for existing frontend
    // components.
    //
    // Also provide categoryId and categoryDetails.
    // ========================================================

    const formattedBrands =
      brands.map(
        (brand) => ({
          id:
            brand.id,

          userId:
            brand.userId,

          companyName:
            brand.companyName,

          companyType:
            brand.companyType,

          // ----------------------------------------------
          // Existing frontend compatibility
          // ----------------------------------------------

          category:
            brand.category
              ?.name ??
            null,

          // ----------------------------------------------
          // New relational information
          // ----------------------------------------------

          categoryId:
            brand.categoryId,

          categoryDetails:
            brand.category
              ? {
                  id:
                    brand.category.id,

                  name:
                    brand.category.name,
                }
              : null,

          website:
            brand.website,

          pocFullName:
            brand.pocFullName,

          pocMobile:
            brand.pocMobile,

          designation:
            brand.designation,

          approvalStatus:
            brand.approvalStatus,

          rejectionReason:
            brand.rejectionReason,

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
        })
      );

    // ========================================================
    // 9. PAGINATION
    // ========================================================

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalFiltered /
            limit
        )
      );

    // ========================================================
    // 10. RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data:
        formattedBrands,

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
          page <
          totalPages,

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