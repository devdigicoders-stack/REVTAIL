import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {AgeCategory, Gender, Prisma,} from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  TESTER_SIGNUP_VERIFIED_COOKIE,
  verifySignupVerifiedToken,
} from "@/lib/tester-signup-otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fullName,
      mobile,
      password,
      gender,
      ageCategory,
      pinCode,
    } = body;

    // ------------------------------------------------
    // 1. Required field validation
    // ------------------------------------------------

    if (
      !fullName ||
      !mobile ||
      !password ||
      !gender ||
      !ageCategory ||
      !pinCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 2. Normalize input
    // ------------------------------------------------

    const rawMobile = String(mobile)
      .trim()
      .replace(/[\s-]/g, "");

    const normalizedName = String(fullName).trim();
    const normalizedPinCode = String(pinCode).trim();

    // Store Tester mobile consistently as a 10-digit Indian number.
    const normalizedMobile = rawMobile.startsWith("+91")
      ? rawMobile.slice(3)
      : rawMobile;

    // ------------------------------------------------
    // 3. Mobile validation
    // ------------------------------------------------

    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 4. Verify WhatsApp OTP confirmation
    // ------------------------------------------------

      const verifiedToken =
        request.cookies.get(
          TESTER_SIGNUP_VERIFIED_COOKIE
        )?.value;

      const mobileVerified =
        verifySignupVerifiedToken(
          verifiedToken,
          normalizedMobile
        );

      if (
        !mobileVerified
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Please verify your mobile number with the WhatsApp OTP before creating your account.",
          },
          {
            status:
              403,
          }
        );
      }
      
    // ------------------------------------------------
    // 4. Password validation
    // ------------------------------------------------

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 5. Gender validation
    // ------------------------------------------------

    const normalizedGender =
      String(gender).trim().toUpperCase() as Gender;

    const validGenders: Gender[] = [
      "MALE",
      "FEMALE",
      "OTHER",
    ];

    if (!validGenders.includes(normalizedGender)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid gender.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 6. Age category validation
    // ------------------------------------------------

    const normalizedAgeCategory =
      String(ageCategory).trim().toUpperCase() as AgeCategory;

    const validAgeCategories: AgeCategory[] = [
      "AGE_18_24",
      "AGE_25_34",
      "AGE_35_44",
      "AGE_45_PLUS",
    ];

    if (!validAgeCategories.includes(normalizedAgeCategory)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid age category.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 7. India PIN code validation
    // ------------------------------------------------

    if (!/^\d{6}$/.test(normalizedPinCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 6-digit PIN code.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 8. Lookup PIN code from our own PinCodeMaster
    // ------------------------------------------------

    const pinLocation = await prisma.pinCodeMaster.findFirst({
      where: {
        pinCode: normalizedPinCode,
        isActive: true,
      },
      select: {
        pinCode: true,
        city: true,
        state: true,
      },
    });

    if (!pinLocation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PIN code not found. Please enter a valid Indian PIN code.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 9. Normalize location from master table
    // ------------------------------------------------

    const city = pinLocation.city.trim();
    const state = pinLocation.state.trim();

    if (!city || !state) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Location information is unavailable for this PIN code.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 10. Check existing mobile
    // ------------------------------------------------

    const existingUser = await prisma.user.findUnique({
      where: {
        mobile: normalizedMobile,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this mobile number already exists.",
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------
    // 11. Hash password
    // ------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // ------------------------------------------------
    // 12. Create User + TesterProfile atomically
    // ------------------------------------------------

    const tester = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          mobile: normalizedMobile,
          password: hashedPassword,
          role: "TESTER",

          // Tester requires Admin approval
          status: "PENDING",
        },
      });

      const testerProfile = await tx.testerProfile.create({
        data: {
          userId: user.id,
          fullName: normalizedName,
          gender: normalizedGender,
          ageCategory: normalizedAgeCategory,

          // PIN + derived location
          pinCode: normalizedPinCode,
          city,
          state,

          approvalStatus: "PENDING",
        },
      });

      return {
        user,
        testerProfile,
      };
    });

    // ------------------------------------------------
    // 13. Success response
    // ------------------------------------------------

    const response = NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Your account is pending admin approval.",

        data: {
          userId: tester.user.id,
          testerProfileId: tester.testerProfile.id,
          fullName: tester.testerProfile.fullName,
          mobile: tester.user.mobile,
          gender: tester.testerProfile.gender,
          ageCategory: tester.testerProfile.ageCategory,

          pinCode: tester.testerProfile.pinCode,
          city: tester.testerProfile.city,
          state: tester.testerProfile.state,

          status: tester.user.status,
          approvalStatus: tester.testerProfile.approvalStatus,
        },
      },
      { status: 201 }
    );

    // OTP verification is single-use for signup.
    response.cookies.set(
      TESTER_SIGNUP_VERIFIED_COOKIE,
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error("Tester signup error:", error);

    // Handles race condition if same unique value
    // is submitted simultaneously
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this mobile number already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while registering the tester.",
      },
      { status: 500 }
    );
  }
}