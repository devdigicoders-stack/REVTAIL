import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // =========================================================
    // 1. READ REQUEST BODY
    // =========================================================

    const body = await request.json();

    const {
      email,
      password,
      companyName,
      companyType,
      categoryId,
      website,
      pocFullName,
      pocMobile,
      designation,
    } = body;

    // =========================================================
    // 2. NORMALIZE DATA
    // =========================================================

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const normalizedCompanyName =
      typeof companyName === "string"
        ? companyName.trim()
        : "";

    const normalizedCompanyType =
      typeof companyType === "string"
        ? companyType.trim()
        : "";

    const normalizedCategoryId =
      Number(categoryId);

    const normalizedWebsite =
      typeof website === "string"
        ? website.trim()
        : "";

    const normalizedPocFullName =
      typeof pocFullName === "string"
        ? pocFullName.trim()
        : "";

    const normalizedPocMobile =
      typeof pocMobile === "string"
        ? pocMobile.trim()
        : "";

    const normalizedDesignation =
      typeof designation === "string"
        ? designation.trim()
        : "";

    // =========================================================
    // 3. REQUIRED FIELD VALIDATION
    // =========================================================

    if (!normalizedEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        { status: 400 }
      );
    }

    if (!normalizedCompanyName) {
      return NextResponse.json(
        {
          success: false,
          message: "Company name is required.",
        },
        { status: 400 }
      );
    }

    if (!normalizedCompanyType) {
      return NextResponse.json(
        {
          success: false,
          message: "Company type is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(
        normalizedCategoryId
      ) ||
      normalizedCategoryId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid business category.",
        },
        {
          status: 400,
        }
      );
  }

    // =========================================================
    // 4. EMAIL VALIDATION
    // =========================================================

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

    // =========================================================
    // 5. PASSWORD VALIDATION
    // =========================================================

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 6. OPTIONAL POC MOBILE VALIDATION
    // =========================================================

    if (
      normalizedPocMobile &&
      !/^[6-9]\d{9}$/.test(
        normalizedPocMobile
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. OPTIONAL WEBSITE VALIDATION
    // =========================================================

    if (normalizedWebsite) {
      try {
        const parsedUrl =
          new URL(normalizedWebsite);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid website URL including http:// or https://.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 8. CHECK EXISTING EMAIL
    // =========================================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },

        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 9. HASH PASSWORD
    // =========================================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const selectedInterest =
      await prisma.interest.findFirst({
        where: {
          id: normalizedCategoryId,
          isActive: true,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!selectedInterest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected business category is invalid or inactive.",
        },
        {
          status: 400,
        }
      );
    }
    // =========================================================
    // 10. CREATE USER + BRAND PROFILE
    // =========================================================
    //
    // Transaction ensures that either:
    //
    // User + BrandProfile both get created
    //
    // OR
    //
    // neither gets created.
    // =========================================================

    const brand =
      await prisma.$transaction(
        async (tx) => {
          // -----------------------------------------------
          // CREATE USER
          // -----------------------------------------------

          const user =
            await tx.user.create({
              data: {
                email:
                  normalizedEmail,

                password:
                  hashedPassword,

                role: "BRAND",

                // Brand needs Admin approval
                status: "PENDING",
              },
            });

          // -----------------------------------------------
          // CREATE BRAND PROFILE
          // -----------------------------------------------

          const brandProfile =
            await tx.brandProfile.create({
              data: {
                userId:
                  user.id,

                companyName:
                  normalizedCompanyName,

                companyType:
                  normalizedCompanyType,

                categoryId:
                  normalizedCategoryId,

                website:
                  normalizedWebsite ||
                  null,

                pocFullName:
                  normalizedPocFullName ||
                  null,

                pocMobile:
                  normalizedPocMobile ||
                  null,

                designation:
                  normalizedDesignation ||
                  null,

                approvalStatus:
                  "PENDING",
              },
            });

          return {
            user,
            brandProfile,
          };
        }
      );

    // =========================================================
    // 11. SUCCESS RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Brand registration successful. Your account is pending admin approval.",

        data: {
          userId:
            brand.user.id,

          brandProfileId:
            brand.brandProfile.id,

          email:
            brand.user.email,

          companyName:
            brand.brandProfile
              .companyName,

          companyType:
            brand.brandProfile
              .companyType,

          category:
            selectedInterest,

          website:
            brand.brandProfile
              .website,

          pocFullName:
            brand.brandProfile
              .pocFullName,

          pocMobile:
            brand.brandProfile
              .pocMobile,

          designation:
            brand.brandProfile
              .designation,

          status:
            brand.user.status,

          approvalStatus:
            brand.brandProfile
              .approvalStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "BRAND SIGNUP ERROR:",
      error
    );

    // =========================================================
    // PRISMA UNIQUE CONSTRAINT
    // =========================================================

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with the provided information already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while registering the Brand.",
      },
      { status: 500 }
    );
  }
}