//what is the purpose of this file?
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

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
        { status: 401 }
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
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedStatus =
      searchParams
        .get("status")
        ?.toUpperCase() ||
      "PENDING";

    const validStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];

    if (
      !validStatuses.includes(
        requestedStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid application status.",
        },
        { status: 400 }
      );
    }

    const applications =
      await prisma.campaignApplication.findMany({
        where: {
          status:
            requestedStatus as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "CANCELLED",
        },

        select: {
          id: true,
          status: true,

          appliedAt: true,
          reviewedAt: true,

          rejectionReason: true,

          testerProfile: {
            select: {
              id: true,

              userId: true,

              fullName: true,

              gender: true,

              pinCode: true,

              city: true,
              state: true,

              profileImage: true,

              approvalStatus: true,

              user: {
                select: {
                  email: true,
                  mobile: true,
                  status: true,
                },
              },
            },
          },

          campaign: {
            select: {
              id: true,

              campaignCode: true,

              productName: true,

              productImage: true,

              earningAmount: true,

              currency: true,

              status: true,

              totalSlots: true,

              filledSlots: true,

              availableSlots: true,

              brand: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },

        orderBy: {
          appliedAt: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      count:
        applications.length,
      data: applications,
    });
  } catch (error) {
    console.error(
      "GET ADMIN APPLICATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch tester applications.",
      },
      { status: 500 }
    );
  }
}