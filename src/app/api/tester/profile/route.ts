import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";

function safeDateToISOString(
  value: Date | string | null | undefined
) {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const userId = Number(
      searchParams.get("userId")
    );

    // ------------------------------------------------
    // 1. VALIDATE USER ID
    // ------------------------------------------------

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid userId is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------
    // 2. GET TESTER
    // ------------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          role: true,
          email: true,
          mobile: true,
          status: true,

          testerProfile: {
            select: {
              id: true,

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
              rejectionReason: true,

              interests: {
                select: {
                  id: true,
                  interestId: true,

                  interest: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },

              bankDetails: {
                select: {
                  id: true,

                  accountHolderName: true,
                  bankName: true,

                  accountNumberLast4: true,

                  ifscCode: true,
                  upiId: true,

                  isVerified: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

    // ------------------------------------------------
    // 3. CHECK USER
    // ------------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (user.role !== "TESTER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user is not a tester.",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.testerProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    const testerProfile =
      user.testerProfile;

    // ------------------------------------------------
    // 4. RETURN PROFILE
    // ------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Tester profile fetched successfully.",

        data: {
          id: testerProfile.id,

          fullName:
            testerProfile.fullName,

          gender:
            testerProfile.gender,

          ageCategory:
           testerProfile.ageCategory,          

          pinCode:
            testerProfile.pinCode,

          city:
            testerProfile.city,

          state:
            testerProfile.state,

          profileImage:
            testerProfile.profileImage,

          instagramId:
            testerProfile.instagramId,

          approvalStatus:
            testerProfile.approvalStatus,

          approvedAt:
            safeDateToISOString(
              testerProfile.approvedAt
            ),

          rejectionReason:
            testerProfile.rejectionReason,

          user: {
            id: user.id,

            email:
              user.email,

            mobile:
              user.mobile,

            status:
              user.status,
          },

          interests:
            testerProfile.interests,

          bankDetails:
            testerProfile.bankDetails
              ? {
                  id:
                    testerProfile
                      .bankDetails.id,

                  accountHolderName:
                    testerProfile
                      .bankDetails
                      .accountHolderName,

                  bankName:
                    testerProfile
                      .bankDetails
                      .bankName,

                  accountNumberLast4:
                    testerProfile
                      .bankDetails
                      .accountNumberLast4,

                  ifscCode:
                    testerProfile
                      .bankDetails
                      .ifscCode,

                  upiId:
                    testerProfile
                      .bankDetails
                      .upiId,

                  isVerified:
                    testerProfile
                      .bankDetails
                      .isVerified,

                  isActive:
                    testerProfile
                      .bankDetails
                      .isActive,
                }
              : null,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get tester profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching the tester profile.",
      },
      {
        status: 500,
      }
    );
  }
}