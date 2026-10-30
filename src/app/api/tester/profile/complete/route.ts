import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      email,
      profileImage,
      instagramId,
    } = body;

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Email validation
    // --------------------------------------------------

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid email address.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 3. Check tester exists
    // --------------------------------------------------

    const tester = await prisma.user.findUnique({
      where: {
        id: parsedUserId,
      },
      include: {
        testerProfile: true,
      },
    });

    if (!tester) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Confirm user is a TESTER
    // --------------------------------------------------

    if (tester.role !== "TESTER") {
      return NextResponse.json(
        {
          success: false,
          message: "This user is not a tester.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 5. Make sure TesterProfile exists
    // --------------------------------------------------

    if (!tester.testerProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Tester profile not found.",
        },
        { status: 404 }
      );
    }

    const normalizedEmail = email
      ? String(email).trim().toLowerCase()
      : undefined;

    // --------------------------------------------------
    // 6. Check duplicate email
    // --------------------------------------------------

    if (normalizedEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,

          NOT: {
            id: parsedUserId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This email address is already registered with another account.",
          },
          { status: 409 }
        );
      }
    }

    // --------------------------------------------------
    // 7. Update User + TesterProfile using transaction
    // --------------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // Update email in User table
        const updatedUser = await tx.user.update({
          where: {
            id: parsedUserId,
          },
          data: {
            ...(normalizedEmail && {
              email: normalizedEmail,
              
            }),
          },
          select: {
            id: true,
            email: true,
            mobile: true,
            role: true,
            status: true,
          },
        });

        // Update tester-specific profile
        const updatedProfile =
          await tx.testerProfile.update({
            where: {
              userId: parsedUserId,
            },
            data: {
              ...(profileImage !== undefined && {
                profileImage:
                  profileImage?.trim() || null,
              }),

              ...(instagramId !== undefined && {
                instagramId:
                  instagramId?.trim() || null,
              }),
            },
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
              approvedAt: true,
              updatedAt: true,
            },
          });

        return {
          user: updatedUser,
          profile: updatedProfile,
        };
      }
    );

    // --------------------------------------------------
    // 8. Response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Tester profile updated successfully.",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Tester profile completion error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email address is already being used.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while updating the tester profile.",
      },
      { status: 500 }
    );
  }
}