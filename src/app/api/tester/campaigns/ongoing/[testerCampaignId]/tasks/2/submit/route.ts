import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import { randomUUID } from "crypto";

import {
  deleteFromR2,
  uploadToR2,
} from "@/lib/storage/r2";

import { Prisma } from "@prisma/client";

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
    // 1. AUTHENTICATED USER
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
      currentUser.role !==
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can submit campaign tasks.",
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
    } =
      await context.params;

    const parsedTesterCampaignId =
      Number(
        testerCampaignId
      );

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
    // 3. READ FORM DATA
    // ============================================================

    const formData =
      await request.formData();

    const proofImageValue =
      formData.get(
        "proofImage"
      );

    // ============================================================
    // 4. VALIDATE IMAGE
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
            "Product received proof image is required.",
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
    // 5. GET TESTER PROFILE
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
            "Your tester profile is not approved yet.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 6. GET OWN TESTER CAMPAIGN + TASK 2
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

          tasks: {
            where: {
              taskNumber: 2,
            },

            select: {
              id: true,
              taskNumber: true,
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

    // ============================================================
    // 7. CAMPAIGN MUST BE ONGOING
    // ============================================================

    if (
      testerCampaign.status !==
      "ONGOING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tasks can only be submitted for an ongoing campaign.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 8. TASK 2 MUST BE CURRENT
    // ============================================================

    if (
      testerCampaign.currentTask !==
      2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 is not the current task.",
        },
        {
          status: 400,
        }
      );
    }

    const task2 =
      testerCampaign.tasks[0] ??
      null;

    if (!task2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 record not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 9. VALIDATE TASK STATUS
    // ============================================================

    if (
      task2.status ===
      "LOCKED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 is currently locked.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      task2.status ===
      "SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 has already been submitted and is waiting for review.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task2.status ===
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 has already been approved.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      task2.status !==
        "AVAILABLE" &&
      task2.status !==
        "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Task 2 cannot be submitted at this stage.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 10. UPLOAD PROOF IMAGE TO R2
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
      `task-2/` +
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
    // 11. DATABASE TRANSACTION
    // ============================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------------
          // Automatic attempt number
          // ------------------------------------------------------

          const attemptAggregate =
            await tx.testerTaskSubmission.aggregate({
              where: {
                testerCampaignTaskId:
                  task2.id,
              },

              _max: {
                attemptNumber:
                  true,
              },
            });

          const previousAttemptNumber =
            attemptAggregate
              ._max
              .attemptNumber ??
            0;

          const attemptNumber =
            previousAttemptNumber +
            1;

          // ------------------------------------------------------
          // Submission
          // ------------------------------------------------------

          const submission =
            await tx.testerTaskSubmission.create({
              data: {
                testerCampaignTaskId:
                  task2.id,

                attemptNumber,

                status:
                  "SUBMITTED",

                submittedAt:
                  new Date(),
              },
            });

          // ------------------------------------------------------
          // Task 2 detail
          // ------------------------------------------------------

          const receivedDetail =
            await tx.task2ReceivedDetail.create({
              data: {
                taskSubmissionId:
                  submission.id,

                proofImage:
                  proofImagePath,
              },
            });

          // ------------------------------------------------------
          // Update task status
          // ------------------------------------------------------

          const updatedTask =
            await tx.testerCampaignTask.update({
              where: {
                id:
                  task2.id,
              },

              data: {
                status:
                  "SUBMITTED",

                submittedAt:
                  new Date(),

                rejectedAt:
                  null,

                rejectionReason:
                  null,
              },
            });

          return {
            submission,
            receivedDetail,
            updatedTask,
          };
        }
      );

    // ============================================================
    // 12. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          result.submission
            .attemptNumber === 1
            ? "Task 2 submitted successfully and is waiting for approval."
            : "Task 2 resubmitted successfully and is waiting for approval.",

        data: {
          testerCampaignId:
            testerCampaign.id,

          taskId:
            result.updatedTask.id,

          taskNumber: 2,

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

            submittedAt:
              result.submission
                .submittedAt,
          },

          receivedProof: {
            proofImage:
              result.receivedDetail
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
      "Task 2 submission error:",
      error
    );

    // ============================================================
    // CLEAN UP R2 FILE IF DB FAILED
    // ============================================================

    if (
      uploadedProofKey
    ) {
      try {
        await deleteFromR2(
          uploadedProofKey
        );
      } catch (
        fileDeleteError
      ) {
        console.error(
          "Unable to clean Task 2 R2 image:",
          fileDeleteError
        );
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
            "A submission attempt already exists. Please try again.",
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
          "Something went wrong while submitting Task 2.",
      },
      {
        status: 500,
      }
    );
  }
}