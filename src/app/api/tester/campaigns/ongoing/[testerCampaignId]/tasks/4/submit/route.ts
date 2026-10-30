import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import { randomUUID } from "crypto";

import {
  deleteFromR2,
  uploadToR2,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      testerCampaignId: string;
    }>;
  }
) {
  let uploadedProofKey:
    | string
    | null = null;

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
          message:
            "Unauthorized. Please login.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      currentUser.role !== "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can submit Task 4.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. TESTER CAMPAIGN ID
    // ============================================================

    const {
      testerCampaignId,
    } = await context.params;

    const parsedTesterCampaignId =
      Number(testerCampaignId);

    if (
      !Number.isInteger(
        parsedTesterCampaignId
      ) ||
      parsedTesterCampaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid testerCampaignId.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. FORM DATA
    // ============================================================

    const formData =
      await request.formData();

    const publishedUrlValue =
      formData.get(
        "publishedUrl"
      );

    const proofImageValue =
      formData.get(
        "proofImage"
      );

    const publishedUrl =
      typeof publishedUrlValue ===
      "string"
        ? publishedUrlValue.trim()
        : "";

    // ============================================================
    // 4. URL VALIDATION
    // ============================================================

    if (!publishedUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Published review URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    try {
      const url =
        new URL(
          publishedUrl
        );

      if (
        url.protocol !==
          "http:" &&
        url.protocol !==
          "https:"
      ) {
        throw new Error();
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid published review URL.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 5. PROOF IMAGE VALIDATION
    // ============================================================

    if (
      !proofImageValue ||
      !(
        proofImageValue instanceof
        File
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Published review proof image is required.",
        },
        {
          status: 400,
        }
      );
    }

    const proofImage =
      proofImageValue;

    if (
      !ALLOWED_FILE_TYPES.includes(
        proofImage.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only JPG, PNG and WEBP images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      proofImage.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Proof image must be smaller than 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 6. TESTER PROFILE
    // ============================================================

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
          approvalStatus: true,
        },
      });

    if (!testerProfile) {
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

    if (
      testerProfile.approvalStatus !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester profile is not approved.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 7. CAMPAIGN + TASK 4
    // ============================================================

    const testerCampaign =
      await prisma.testerCampaign.findFirst({
        where: {
          id:
            parsedTesterCampaignId,

          testerProfileId:
            testerProfile.id,
        },

        select: {
          id: true,

          status: true,

          currentTask: true,

          campaign: {
            select: {
              id: true,
              task4Required: true,
            },
          },

          tasks: {
            where: {
              taskNumber: 4,
            },

            select: {
              id: true,
              status: true,
            },

            take: 1,
          },
        },
      });

    if (!testerCampaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tester campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !testerCampaign
        .campaign
        .task4Required
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 is not required for this campaign.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign is not ongoing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      testerCampaign.currentTask !==
      4
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 is not the current task.",
        },
        {
          status: 400,
        }
      );
    }

    const task4 =
      testerCampaign.tasks[0] ??
      null;

    if (!task4) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 record not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      task4.status ===
      "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 has already been submitted and is waiting for review.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task4.status ===
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 has already been approved.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task4.status !==
        "AVAILABLE" &&
      task4.status !==
        "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 4 cannot be submitted.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 8. UPLOAD PROOF IMAGE TO R2
    // ============================================================

    const extensionMap: Record<
      string,
      string
    > = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension =
      extensionMap[
        proofImage.type
      ];

    const objectKey =
      `tester-tasks/` +
      `tester-${testerProfile.id}/` +
      `campaign-${testerCampaign.id}/` +
      `task-4/` +
      `${Date.now()}-${randomUUID()}.${extension}`;

    const uploadedProof =
      await uploadToR2({
        file:
          Buffer.from(
            await proofImage.arrayBuffer()
          ),

        key:
          objectKey,

        contentType:
          proofImage.type,
      });

    uploadedProofKey =
      uploadedProof.key;

    if (!uploadedProof.url) {
      await deleteFromR2(
        uploadedProof.key
      );

      uploadedProofKey =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate the proof image URL.",
        },
        {
          status: 500,
        }
      );
    }

    const proofImagePath =
      uploadedProof.url;

    // ============================================================
    // 9. DATABASE
    // ============================================================

    const now =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const attemptAggregate =
            await tx.testerTaskSubmission.aggregate({
              where: {
                testerCampaignTaskId:
                  task4.id,
              },

              _max: {
                attemptNumber: true,
              },
            });

          const attemptNumber =
            (
              attemptAggregate
                ._max
                .attemptNumber ??
              0
            ) + 1;

          const submission =
            await tx.testerTaskSubmission.create({
              data: {
                testerCampaignTaskId:
                  task4.id,

                attemptNumber,

                status:
                  "SUBMITTED",

                submittedAt:
                  now,
              },
            });

          const detail =
            await tx.task4PublishDetail.create({
              data: {
                taskSubmissionId:
                  submission.id,

                publishedUrl,

                proofImage:
                  proofImagePath,
              },
            });

          const updatedTask =
            await tx.testerCampaignTask.update({
              where: {
                id:
                  task4.id,
              },

              data: {
                status:
                  "SUBMITTED",

                submittedAt:
                  now,

                rejectedAt:
                  null,

                rejectionReason:
                  null,
              },
            });

          return {
            submission,
            detail,
            updatedTask,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          result.submission
            .attemptNumber ===
            1
            ? "Task 4 submitted successfully and is waiting for approval."
            : "Task 4 resubmitted successfully and is waiting for approval.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          taskId:
            result.updatedTask.id,

          taskNumber: 4,

          taskStatus:
            result.updatedTask.status,

          submission: {
            id:
              result.submission.id,

            attemptNumber:
              result.submission
                .attemptNumber,

            status:
              result.submission
                .status,
          },

          publishDetail: {
            publishedUrl:
              result.detail
                .publishedUrl,

            proofImage:
              result.detail
                .proofImage,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Task 4 submission error:",
      error
    );

    // ============================================================
    // CLEAN UP R2 IMAGE IF DATABASE FAILED
    // ============================================================

    if (
      uploadedProofKey
    ) {
      try {
        await deleteFromR2(
          uploadedProofKey
        );
      } catch {
        // Ignore cleanup error
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate Task 4 submission detected.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting Task 4.",
      },
      {
        status: 500,
      }
    );
  }
}