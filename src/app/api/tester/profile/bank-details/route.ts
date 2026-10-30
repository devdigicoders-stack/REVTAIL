import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
    } = body;

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
    // 2. Required fields
    // -----------------------------
    if (
      !accountHolderName ||
      !bankName ||
      !accountNumber ||
      !ifscCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Account holder name, bank name, account number and IFSC code are required.",
        },
        { status: 400 }
      );
    }

    const normalizedAccountHolderName =
      String(accountHolderName).trim();

    const normalizedBankName =
      String(bankName).trim();

    const normalizedAccountNumber =
      String(accountNumber).replace(/\s/g, "");

    const normalizedIfscCode =
      String(ifscCode).trim().toUpperCase();

    const normalizedUpiId = upiId
      ? String(upiId).trim()
      : null;

    // -----------------------------
    // 3. Account number validation
    // -----------------------------
    if (!/^\d{6,20}$/.test(normalizedAccountNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid account number.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 4. IFSC validation
    // Example: SBIN0001234
    // -----------------------------
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(normalizedIfscCode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid IFSC code.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 5. Find tester profile
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
    // 6. Last 4 digits
    // -----------------------------
    const accountNumberLast4 =
      normalizedAccountNumber.slice(-4);

    // -----------------------------
    // 7. Create or update
    // -----------------------------
    const bankDetails = await prisma.testerBankDetails.upsert({
      where: {
        testerProfileId: testerProfile.id,
      },

      update: {
        accountHolderName: normalizedAccountHolderName,
        bankName: normalizedBankName,
        accountNumber: normalizedAccountNumber,
        accountNumberLast4,
        ifscCode: normalizedIfscCode,
        upiId: normalizedUpiId,

        // If bank details change, re-verification may be required
        isVerified: false,
        isActive: true,
      },

      create: {
        testerProfileId: testerProfile.id,
        accountHolderName: normalizedAccountHolderName,
        bankName: normalizedBankName,
        accountNumber: normalizedAccountNumber,
        accountNumberLast4,
        ifscCode: normalizedIfscCode,
        upiId: normalizedUpiId,
        isVerified: false,
        isActive: true,
      },

      select: {
        id: true,
        testerProfileId: true,
        accountHolderName: true,
        bankName: true,
        accountNumberLast4: true,
        ifscCode: true,
        upiId: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Bank details saved successfully.",
        data: bankDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save tester bank details error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to save bank details due to duplicate data.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving bank details.",
      },
      { status: 500 }
    );
  }
}