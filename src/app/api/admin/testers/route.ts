import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

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

    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

    const statusParam =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const allowedStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "BLOCKED",
    ] as const;

    type TesterStatus =
      (typeof allowedStatuses)[number];

    let approvalStatus:
      | TesterStatus
      | undefined;

    if (statusParam) {
      if (
        !allowedStatuses.includes(
          statusParam as TesterStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid Tester status.",
          },
          {
            status: 400,
          }
        );
      }

      approvalStatus =
        statusParam as TesterStatus;
    }


    // --------------------------------------------------------
    // Age Group
    // --------------------------------------------------------

    const ageCategoryParam =
      searchParams
        .get("ageCategory")
        ?.trim()
        .toUpperCase();

    const allowedAgeCategories = [
      "AGE_18_24",
      "AGE_25_34",
      "AGE_35_44",
      "AGE_45_PLUS",
    ] as const;

    type AgeCategory =
      (typeof allowedAgeCategories)[number];

    let ageCategory:
      | AgeCategory
      | undefined;

    if (ageCategoryParam) {
      if (
        !allowedAgeCategories.includes(
          ageCategoryParam as AgeCategory
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid age category.",
          },
          {
            status: 400,
          }
        );
      }

      ageCategory =
        ageCategoryParam as AgeCategory;
    }

    // --------------------------------------------------------
    // Gender
    // --------------------------------------------------------

    const genderParam =
      searchParams
        .get("gender")
        ?.trim()
        .toUpperCase();

    const allowedGenders = [
      "MALE",
      "FEMALE",
    ] as const;

    type Gender =
      (typeof allowedGenders)[number];

    let gender:
      | Gender
      | undefined;

    if (genderParam) {
      if (
        !allowedGenders.includes(
          genderParam as Gender
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid gender.",
          },
          {
            status: 400,
          }
        );
      }

      gender =
        genderParam as Gender;
    }


    let matchedTesterIds:
      number[] | null =
      null;

    if (search) {
      const matchedRows =
        await prisma.$queryRaw<
          Array<{
            id: number;
          }>
        >`
          SELECT DISTINCT
            tp.id
          FROM
            tester_profiles AS tp
          LEFT JOIN
            users AS u
              ON u.id = tp.userId
          WHERE
            tp.deletedAt IS NULL
            AND
            (
              CONVERT(tp.fullName USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )

              OR CONVERT(tp.pinCode USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )

              OR CONVERT(tp.city USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )

              OR CONVERT(tp.state USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )

              OR CONVERT(u.mobile USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )

              OR CONVERT(u.email USING utf8mb4)
                COLLATE utf8mb4_unicode_ci
                LIKE CONCAT(
                  '%',
                  CONVERT(${search} USING utf8mb4)
                    COLLATE utf8mb4_unicode_ci,
                  '%'
                )
            )
        `;

      matchedTesterIds =
        matchedRows.map(
          (row) =>
            Number(row.id)
        );
    }

    // ========================================================
    // 4. WHERE CONDITION
    // ========================================================

    const where = {
      deletedAt: null,

      ...(approvalStatus
        ? {
            approvalStatus,
          }
        : {}),

      ...(ageCategory
        ? {
            ageCategory,
          }
        : {}),

      ...(gender
        ? {
            gender,
          }
        : {}),

      ...(matchedTesterIds !==
      null
        ? {
            id: {
              in:
                matchedTesterIds,
            },
          }
        : {}),
    };

    // ========================================================
    // 5. LOAD TESTERS + COUNTS
    //
    // NOTE:
    // We intentionally avoid DateTime fields because your DB
    // previously contained legacy invalid date values.
    // ========================================================

    const [
      testers,
      totalFiltered,
      total,
      pending,
      approved,
      rejected,
    ] =
      await Promise.all([
        prisma.testerProfile.findMany({
          where,

          skip,

          take: limit,

          select: {
            id: true,

            userId: true,

            fullName: true,

            gender: true,

            ageCategory: true,

            pinCode: true,

            city: true,

            state: true,

            profileImage: true,

            instagramId: true,

            approvalStatus: true,

            rejectionReason: true,

            user: {
              select: {
                email: true,

                mobile: true,

                status: true,
              },
            },

            interests: {
              select: {
                interest: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },

          orderBy: {
            id: "desc",
          },
        }),

        // Filtered records
        prisma.testerProfile.count({
          where,
        }),

        // Total
        prisma.testerProfile.count({
          where: {
            deletedAt: null,
          },
        }),

        // Pending
        prisma.testerProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "PENDING",
          },
        }),

        // Approved
        prisma.testerProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "APPROVED",
          },
        }),

        // Rejected
        prisma.testerProfile.count({
          where: {
            deletedAt: null,

            approvalStatus:
              "REJECTED",
          },
        }),
      ]);

    // ========================================================
    // 6. PAGINATION
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
    // 7. RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data: testers,

      summary: {
        total,
        pending,
        approved,
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
      "GET ADMIN TESTERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load Testers.",
      },
      {
        status: 500,
      }
    );
  }
}