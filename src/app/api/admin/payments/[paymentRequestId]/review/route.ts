// what is this file for?
// This file is for the admin to review a payment request.
// The admin can approve or reject the payment request.
// If the admin approves the payment request, they can make the manual payment and mark it paid.
// If the admin rejects the payment request, they must provide a rejection reason.
import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentRequestId: string;
    }>;
  }
) {
  try {
    // ============================================================
    // 1. AUTH
    // ============================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only admins can review payment requests.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 2. ID
    // ============================================================

    const {
      paymentRequestId,
    } = await context.params;

    const parsedId =
      Number(paymentRequestId);

    if (
      !Number.isInteger(parsedId) ||
      parsedId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid paymentRequestId.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 3. BODY
    // ============================================================

    const body =
      await request.json();

    const action =
      typeof body.action === "string"
        ? body.action
            .trim()
            .toUpperCase()
        : "";

    const rejectionReason =
      typeof body.rejectionReason ===
      "string"
        ? body.rejectionReason.trim()
        : "";

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Action must be APPROVE or REJECT.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      !rejectionReason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 4. PAYMENT REQUEST
    // ============================================================

    const paymentRequest =
      await prisma.paymentRequest.findUnique({
        where: {
          id: parsedId,
        },

        select: {
          id: true,

          status: true,

          amount: true,

          testerProfileId: true,

          testerCampaignId: true,
        },
      });

    if (!paymentRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment request not found.",
        },
        { status: 404 }
      );
    }

    if (
      paymentRequest.status !== "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment request is no longer pending review.",
        },
        { status: 409 }
      );
    }

    const now =
      new Date();

    // ============================================================
    // 5. REJECT
    // ============================================================

    if (action === "REJECT") {
      const rejected =
        await prisma.paymentRequest.update({
          where: {
            id: paymentRequest.id,
          },

          data: {
            status: "REJECTED",

            reviewedBy:
              currentUser.userId,

            reviewedAt:
              now,

            rejectionReason,

            approvedAt:
              null,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Payment request rejected successfully.",

          data: {
            id:
              rejected.id,

            status:
              rejected.status,

            rejectionReason:
              rejected.rejectionReason,

            reviewedAt:
              rejected.reviewedAt,
          },
        },
        { status: 200 }
      );
    }

    // ============================================================
    // 6. APPROVE
    // ============================================================

    const approved =
      await prisma.paymentRequest.update({
        where: {
          id:
            paymentRequest.id,
        },

        data: {
          status:
            "APPROVED",

          reviewedBy:
            currentUser.userId,

          reviewedAt:
            now,

          approvedAt:
            now,

          rejectionReason:
            null,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment request approved. Admin can now make the manual payment and mark it paid.",

        data: {
          id:
            approved.id,

          status:
            approved.status,

          approvedAt:
            approved.approvedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin payment review error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while reviewing the payment request.",
      },
      { status: 500 }
    );
  }
}