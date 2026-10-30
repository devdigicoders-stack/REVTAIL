import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, interestIds } = body;

    // -----------------------------
    // 1. Validate userId
    // -----------------------------
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid userId is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. Validate interests
    // -----------------------------
    if (!Array.isArray(interestIds)) {
      return NextResponse.json(
        {
          success: false,
          message: "interestIds must be an array.",
        },
        { status: 400 }
      );
    }

    if (interestIds.length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester must select at least 5 interests.",
        },
        { status: 400 }
      );
    }

    const parsedInterestIds = interestIds.map((id: unknown) => Number(id));

    if (
      parsedInterestIds.some(
        (id: number) => !Number.isInteger(id) || id <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All interest IDs must be valid integers.",
        },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueInterestIds = [...new Set(parsedInterestIds)];

    if (uniqueInterestIds.length !== parsedInterestIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate interests are not allowed.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3. Find tester profile
    // -----------------------------
    const testerProfile = await prisma.testerProfile.findUnique({
      where: {
        userId: parsedUserId,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!testerProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester profile not found.",
        },
        { status: 404 }
      );
    }

    if (testerProfile.user.role !== "TESTER") {
      return NextResponse.json(
        {
          success: false,
          message: "This user is not a tester.",
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // 4. Validate interest IDs exist
    // -----------------------------
    const interests = await prisma.interest.findMany({
      where: {
        id: {
          in: uniqueInterestIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (interests.length !== uniqueInterestIds.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected interests are invalid or inactive.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 5. Replace current interests
    // -----------------------------
    await prisma.$transaction(async (tx) => {
      await tx.testerInterest.deleteMany({
        where: {
          testerProfileId: testerProfile.id,
        },
      });

      if (uniqueInterestIds.length > 0) {
        await tx.testerInterest.createMany({
          data: uniqueInterestIds.map((interestId) => ({
            testerProfileId: testerProfile.id,
            interestId,
          })),
        });
      }
    });

    // -----------------------------
    // 6. Return updated interests
    // -----------------------------
    const updatedInterests = await prisma.testerInterest.findMany({
      where: {
        testerProfileId: testerProfile.id,
      },
      include: {
        interest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tester interests updated successfully.",
        data: updatedInterests.map((item) => item.interest),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update tester interests error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating tester interests.",
      },
      { status: 500 }
    );
  }
}

