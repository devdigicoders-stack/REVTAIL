import {
  NextRequest,
  NextResponse,
} from 'next/server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

// ============================================================
// GET CITIES BY STATE
//
// GET /api/pincode-master/cities?state=Delhi
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    // --------------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // 2. Read state
    // --------------------------------------------------------

    const { searchParams } =
      new URL(request.url);

    const state =
      searchParams
        .get('state')
        ?.trim() ?? '';

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          message:
            'State is required.',
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // 3. Verify state
    // --------------------------------------------------------

    const existingState =
      await prisma.pinCodeMaster.findFirst({
        where: {
          state,
          isActive: true,
        },

        select: {
          id: true,
        },
      });

    if (!existingState) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Selected state was not found.',
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // 4. Get unique cities
    // --------------------------------------------------------

    const records =
      await prisma.pinCodeMaster.findMany({
        where: {
          state,
          isActive: true,

          city: {
            not: '',
          },
        },

        distinct: ['city'],

        select: {
          city: true,
        },

        orderBy: {
          city: 'asc',
        },
      });

    // --------------------------------------------------------
    // 5. Clean duplicate data
    // --------------------------------------------------------

    const cities = Array.from(
      new Set(
        records
          .map((item) =>
            item.city.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

    // --------------------------------------------------------
    // 6. Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        state,

        count: cities.length,

        data: cities,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET PINCODE CITIES ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load cities.',
      },
      {
        status: 500,
      }
    );
  }
}