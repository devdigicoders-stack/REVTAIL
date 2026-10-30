import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  CampaignStatus,
  Prisma,
} from '@prisma/client';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

// ============================================================
// CAMPAIGN STATUS GROUPS
// ============================================================

const ACTIVE_STATUSES: CampaignStatus[] = [
  CampaignStatus.SUBMITTED,
  CampaignStatus.APPROVED,
  CampaignStatus.LIVE,
];

const HISTORY_STATUSES: CampaignStatus[] = [
  CampaignStatus.REJECTED,
  CampaignStatus.COMPLETED,
  CampaignStatus.CANCELLED,
];

// ============================================================
// HELPERS
// ============================================================

function isValidCampaignStatus(
  value: string
): value is CampaignStatus {
  return Object.values(
    CampaignStatus
  ).includes(
    value as CampaignStatus
  );
}

// ============================================================
// GET CAMPAIGNS
//
// Existing:
//
// GET /api/campaigns/list?type=active
// GET /api/campaigns/list?type=history
//
// New:
//
// GET /api/campaigns/list?status=LIVE
//
// GET /api/campaigns/list
//      ?status=LIVE
//      &search=amazon
//      &page=1
//      &limit=10
//
// Search:
// - campaignCode
// - productName
// - brand companyName
// - targetState
// - targetCity
//
// Pagination is optional.
// If page/limit are not supplied, existing behaviour is preserved
// and all matching campaigns are returned.
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==========================================================
    // 1. AUTHENTICATE USER
    // ==========================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized. Please login.',
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================================
    // 2. ALLOW ADMIN / BRAND
    // ==========================================================

    if (
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'BRAND'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Access denied. Only Admin or Brand can view campaigns.',
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 3. QUERY PARAMETERS
    // ==========================================================

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    // ----------------------------------------------------------
    // Existing type support
    // ----------------------------------------------------------

    const type =
      searchParams.get(
        'type'
      ) ??
      'active';

    if (
      type !== 'active' &&
      type !== 'history'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Invalid campaign list type. Use active or history.',
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // Optional exact status
    //
    // Example:
    // ?status=LIVE
    // ----------------------------------------------------------

    const statusParam =
      searchParams
        .get('status')
        ?.trim()
        .toUpperCase() ??
      '';

    if (
      statusParam &&
      !isValidCampaignStatus(
        statusParam
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Invalid campaign status.',
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // Search
    // ----------------------------------------------------------

    const search =
      searchParams
        .get('search')
        ?.trim() ??
      '';

    // ----------------------------------------------------------
    // Pagination
    //
    // Keep pagination optional for backward compatibility.
    // ----------------------------------------------------------

    const hasPagination =
      searchParams.has(
        'page'
      ) ||
      searchParams.has(
        'limit'
      );

    const requestedPage =
      Number(
        searchParams.get(
          'page'
        ) ??
          '1'
      );

    const requestedLimit =
      Number(
        searchParams.get(
          'limit'
        ) ??
          '10'
      );

    const page =
      Number.isInteger(
        requestedPage
      ) &&
      requestedPage >
        0
        ? requestedPage
        : 1;

    const limit =
      [10, 20, 50].includes(
        requestedLimit
      )
        ? requestedLimit
        : 10;

    // ==========================================================
    // 4. STATUS FILTER
    // ==========================================================

    const statuses =
      type === 'active'
        ? ACTIVE_STATUSES
        : HISTORY_STATUSES;

    // ==========================================================
    // 5. BUILD WHERE
    // ==========================================================

    const whereCondition:
      Prisma.CampaignWhereInput =
      {};

    // ----------------------------------------------------------
    // Exact status takes priority.
    //
    // Admin LIVE page:
    // ?status=LIVE
    //
    // Otherwise existing type logic is used.
    // ----------------------------------------------------------

    if (statusParam) {
      whereCondition.status =
        statusParam as CampaignStatus;
    } else {
      whereCondition.status =
        {
          in: statuses,
        };
    }

    // ==========================================================
    // 6. BRAND -> ONLY OWN CAMPAIGNS
    // ==========================================================

    if (
      currentUser.role ===
      'BRAND'
    ) {
      const brandProfile =
        await prisma.brandProfile.findUnique({
          where: {
            userId:
              currentUser.userId,
          },

          select: {
            id: true,
          },
        });

      if (
        !brandProfile
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              'Brand profile not found.',
          },
          {
            status: 404,
          }
        );
      }

      whereCondition.brandId =
        brandProfile.id;
    }

    // ==========================================================
    // 7. SEARCH
    // ==========================================================

    if (search) {
      whereCondition.OR =
        [
          // Campaign code
          {
            campaignCode: {
              contains:
                search,
            },
          },

          // Product name
          {
            productName: {
              contains:
                search,
            },
          },

          // Brand
          {
            brand: {
              is: {
                companyName: {
                  contains:
                    search,
                },
              },
            },
          },

          // State
          {
            targetState: {
              contains:
                search,
            },
          },

          // City
          {
            targetCity: {
              contains:
                search,
            },
          },
        ];
    }

    // ==========================================================
    // 8. TOTAL COUNT
    // ==========================================================

    const total =
      await prisma.campaign.count({
        where:
          whereCondition,
      });

    // ==========================================================
    // 9. GET CAMPAIGNS
    // ==========================================================

    const campaigns =
      await prisma.campaign.findMany({
        where:
          whereCondition,

        // ------------------------------------------------------
        // Only apply skip/take if pagination was requested.
        //
        // This preserves old API behaviour.
        // ------------------------------------------------------

        ...(hasPagination
          ? {
              skip:
                (page - 1) *
                limit,

              take:
                limit,
            }
          : {}),

        select: {
          id: true,

          campaignCode:
            true,

          productName:
            true,

          productImage:
            true,

          earningAmount:
            true,

          currency:
            true,

          totalSlots:
            true,

          filledSlots:
            true,

          availableSlots:
            true,

          targetState:
            true,

          targetCity:
            true,

          targetGender:
            true,

          startDate:
            true,

          endDate:
            true,

          task4Required:
            true,

          status:
            true,

          brandId:
            true,

          createdAt:
            true,

          approvedAt:
            true,

          // ====================================================
          // BRAND
          // ====================================================

          brand: {
            select: {
              id: true,

              companyName:
                true,

              companyType:
                true,

              category: {
                select: {
                  id:
                    true,

                  name:
                    true,
                },
              },
            },
          },

          // ====================================================
          // COUNTS
          //
          // Useful for Admin LIVE listing.
          // ====================================================

          _count: {
            select: {
              testerApplications:
                true,

              testerCampaigns:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            'desc',
        },
      });

    // ==========================================================
    // 10. FORMAT DATA
    //
    // Preserve existing property names such as:
    //
    // earning
    // slots
    // brandName
    //
    // so existing CampaignList components keep working.
    // ==========================================================

    const formattedCampaigns =
      campaigns.map(
        (
          campaign
        ) => ({
          id:
            campaign.id,

          campaignCode:
            campaign.campaignCode,

          productName:
            campaign.productName,

          productImage:
            campaign.productImage,

          // ----------------------------------------------------
          // Brand
          // ----------------------------------------------------

          brandId:
            campaign.brandId,

          brandName:
            campaign.brand
              .companyName,

          brandCompanyType:
            campaign.brand
              .companyType,

          brandCategory:
            campaign.brand
              .category,

          // ----------------------------------------------------
          // Earnings
          // ----------------------------------------------------

          earning:
            Number(
              campaign.earningAmount
            ),

          // Also expose the actual model-style name.
          earningAmount:
            Number(
              campaign.earningAmount
            ),

          currency:
            campaign.currency,

          // ----------------------------------------------------
          // Slots
          // ----------------------------------------------------

          slots:
            campaign.totalSlots,

          totalSlots:
            campaign.totalSlots,

          filledSlots:
            campaign.filledSlots,

          availableSlots:
            campaign.availableSlots,

          // ----------------------------------------------------
          // Applications / enrollment
          // ----------------------------------------------------

          applicationCount:
            campaign._count
              .testerApplications,

          enrolledCount:
            campaign._count
              .testerCampaigns,

          // ----------------------------------------------------
          // Targeting
          // ----------------------------------------------------

          targetState:
            campaign.targetState,

          targetCity:
            campaign.targetCity,

          targetGender:
            campaign.targetGender,

          // ----------------------------------------------------
          // Task configuration
          // ----------------------------------------------------

          task4Required:
            campaign.task4Required,

          // ----------------------------------------------------
          // Dates
          // ----------------------------------------------------

          startDate:
            campaign.startDate
              ? campaign.startDate
                  .toISOString()
                  .slice(
                    0,
                    10
                  )
              : null,

          endDate:
            campaign.endDate
              ? campaign.endDate
                  .toISOString()
                  .slice(
                    0,
                    10
                  )
              : null,

          approvedAt:
            campaign.approvedAt
              ? campaign.approvedAt.toISOString()
              : null,

          createdAt:
            campaign.createdAt.toISOString(),

          status:
            campaign.status,
        })
      );

    // ==========================================================
    // 11. PAGINATION
    // ==========================================================

    const totalPages =
      hasPagination
        ? Math.max(
            1,
            Math.ceil(
              total /
                limit
            )
          )
        : 1;

    // ==========================================================
    // 12. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        role:
          currentUser.role,

        type,

        // Exact status used by Admin LIVE page.
        status:
          statusParam ||
          null,

        search,

        // Number returned in this response.
        count:
          formattedCampaigns.length,

        // Total records matching search/filter.
        total,

        // IMPORTANT:
        // Keep data as array for old pages.
        data:
          formattedCampaigns,

        pagination:
          hasPagination
            ? {
                page,

                limit,

                total,

                totalPages,

                hasNextPage:
                  page <
                  totalPages,

                hasPreviousPage:
                  page >
                  1,
              }
            : null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/campaigns/list error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch campaigns.',
      },
      {
        status: 500,
      }
    );
  }
}