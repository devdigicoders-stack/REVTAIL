import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

// ============================================================
// GET UNIQUE STATES
// GET /api/pincode-master/states
// ============================================================

export async function GET() {
  try {
    // --------------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please login.',
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------------
    // 2. Get unique active states
    // --------------------------------------------------------

    const records =
      await prisma.pinCodeMaster.findMany({
        where: {
          isActive: true,

          state: {
            not: '',
          },
        },

        distinct: ['state'],

        select: {
          state: true,
        },

        orderBy: {
          state: 'asc',
        },
      });

    // --------------------------------------------------------
    // 3. Clean data
    // --------------------------------------------------------

    const states = Array.from(
      new Set(
        records
          .map((item) =>
            item.state.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

    // --------------------------------------------------------
    // 4. Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        count: states.length,

        data: states,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET PINCODE STATES ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load states.',
      },
      {
        status: 500,
      }
    );
  }
}