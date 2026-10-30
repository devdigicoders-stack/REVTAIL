// this api route is for admin to update the status of a brand (approve or reject) by id and send an email 
// notification to the brand user
import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import {
  sendBrandStatusEmail,
} from "@/lib/mailer";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      currentUser.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // BRAND ID
    // ========================================================

    const { id } =
      await params;

    const brandId =
      Number(id);

    if (
      !Number.isInteger(
        brandId
      ) ||
      brandId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Brand ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // REQUEST
    // ========================================================

    const body =
      await request.json();

    const action =
      String(
        body.action ?? ""
      )
        .trim()
        .toUpperCase();

    const reason =
      typeof body.reason ===
      "string"
        ? body.reason.trim()
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
        {
          status: 400,
        }
      );
    }

    if (
      action === "REJECT" &&
      !reason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // FIND BRAND
    // ========================================================

    const brand =
      await prisma.brandProfile.findUnique({
        where: {
          id: brandId,
        },

        select: {
          id: true,

          userId: true,

          companyName: true,

          approvalStatus: true,

          user: {
            select: {
              id: true,

              role: true,

              email: true,

              status: true,
            },
          },
        },
      });

    if (!brand) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      brand.user.role !==
      "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user is not a Brand.",
        },
        {
          status: 400,
        }
      );
    }

    if (!brand.user.email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand does not have an email address. Status was not changed.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // APPROVE
    // ========================================================

    if (
      action === "APPROVE"
    ) {
      if (
        brand.approvalStatus ===
        "ACTIVE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Brand is already approved.",
          },
          {
            status: 409,
          }
        );
      }

      const now =
        new Date();

      await prisma.$transaction(
        async (tx) => {
          await tx.brandProfile.update({
            where: {
              id: brandId,
            },

            data: {
              approvalStatus:
                "ACTIVE",

              approvedAt:
                now,

              rejectionReason:
                null,
            },

            select: {
              id: true,
            },
          });

          await tx.user.update({
            where: {
              id:
                brand.userId,
            },

            data: {
              status:
                "ACTIVE",
            },

            select: {
              id: true,
            },
          });
        }
      );

      // ======================================================
      // EMAIL AFTER DB COMMIT
      // ======================================================

      let emailSent =
        true;

      let emailError:
        | string
        | null =
        null;

      try {
        await sendBrandStatusEmail({
          to:
            brand.user.email,

          companyName:
            brand.companyName,

          status:
            "ACTIVE",
        });
      } catch (
        mailError
      ) {
        emailSent =
          false;

        emailError =
          mailError instanceof
          Error
            ? mailError.message
            : "Unable to send approval email.";

        console.error(
          "BRAND APPROVAL EMAIL ERROR:",
          mailError
        );
      }

      return NextResponse.json({
        success: true,

        message: emailSent
          ? "Brand approved successfully. Approval email has been sent."
          : "Brand approved successfully, but the approval email could not be sent.",

        data: {
          brandId,

          userId:
            brand.userId,

          approvalStatus:
            "ACTIVE",

          userStatus:
            "ACTIVE",

          emailSent,

          emailError,
        },
      });
    }

    // ========================================================
    // REJECT
    // ========================================================

    await prisma.$transaction(
      async (tx) => {
        await tx.brandProfile.update({
          where: {
            id: brandId,
          },

          data: {
            approvalStatus:
              "REJECTED",

            approvedAt:
              null,

            rejectionReason:
              reason,
          },

          select: {
            id: true,
          },
        });

        await tx.user.update({
          where: {
            id:
              brand.userId,
          },

          data: {
            status:
              "REJECTED",
          },

          select: {
            id: true,
          },
        });
      }
    );

    let emailSent =
      true;

    let emailError:
      | string
      | null =
      null;

    try {
      await sendBrandStatusEmail({
        to:
          brand.user.email,

        companyName:
          brand.companyName,

        status:
          "REJECTED",

        rejectionReason:
          reason,
      });
    } catch (
      mailError
    ) {
      emailSent =
        false;

      emailError =
        mailError instanceof
        Error
          ? mailError.message
          : "Unable to send rejection email.";

      console.error(
        "BRAND REJECTION EMAIL ERROR:",
        mailError
      );
    }

    return NextResponse.json({
      success: true,

      message: emailSent
        ? "Brand rejected. Rejection email has been sent."
        : "Brand rejected, but the rejection email could not be sent.",

      data: {
        brandId,

        userId:
          brand.userId,

        approvalStatus:
          "REJECTED",

        userStatus:
          "REJECTED",

        emailSent,

        emailError,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE BRAND STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to update Brand status.",
      },
      {
        status: 500,
      }
    );
  }
}