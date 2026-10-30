import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

import {
  deleteFromR2,
  uploadToR2,
} from "@/lib/storage/r2";

export const runtime =
  "nodejs";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const IMAGE_EXTENSION_MAP:
  Record<string, string> = {
    "image/jpeg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp",
  };

export async function POST(
  request: Request
) {
  let uploadedImageKey:
    | string
    | null =
    null;

  try {
    // ============================================================
    // 1. AUTH
    // ============================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unauthorized. Please login.",
        },
        {
          status:
            401,
        }
      );
    }

    if (
      currentUser.role !==
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Forbidden. Only testers can upload a profile image.",
        },
        {
          status:
            403,
        }
      );
    }

    // ============================================================
    // 2. TESTER PROFILE
    // ============================================================

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id:
            true,

          profileImage:
            true,
        },
      });

    if (!testerProfile) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tester profile not found.",
        },
        {
          status:
            404,
        }
      );
    }

    // ============================================================
    // 3. FORM DATA
    // ============================================================

    const formData =
      await request.formData();

    const profileImage =
      formData.get(
        "profileImage"
      );

    if (
      !(profileImage instanceof File)
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Profile image is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ============================================================
    // 4. VALIDATE IMAGE
    // ============================================================

    if (
      !ALLOWED_IMAGE_TYPES.has(
        profileImage.type
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Profile image must be JPG, PNG or WEBP.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      profileImage.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Profile image must be 5 MB or smaller.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      profileImage.size <=
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Profile image is empty.",
        },
        {
          status:
            400,
        }
      );
    }

    // ============================================================
    // 5. UPLOAD TO R2
    // ============================================================

    const extension =
      IMAGE_EXTENSION_MAP[
        profileImage.type
      ];

    const objectKey =
      `tester-profiles/` +
      `tester-${testerProfile.id}/` +
      `${Date.now()}-${randomUUID()}.${extension}`;

    const uploadedImage =
      await uploadToR2({
        key:
          objectKey,

        file:
          Buffer.from(
            await profileImage.arrayBuffer()
          ),

        contentType:
          profileImage.type,
      });

    uploadedImageKey =
      uploadedImage.key;

    if (!uploadedImage.url) {
      await deleteFromR2(
        uploadedImage.key
      );

      uploadedImageKey =
        null;

      return NextResponse.json(
        {
          success:
            false,

          message:
            "R2 public URL is not configured.",
        },
        {
          status:
            500,
        }
      );
    }

    // ============================================================
    // 6. UPDATE TESTER PROFILE
    // ============================================================

    const previousProfileImage =
      testerProfile.profileImage;

    const updatedProfile =
      await prisma.testerProfile.update({
        where: {
          id:
            testerProfile.id,
        },

        data: {
          profileImage:
            uploadedImage.url,
        },

        select: {
          id:
            true,

          profileImage:
            true,
        },
      });

    // The new object is now referenced by the DB,
    // so it must not be deleted by the catch cleanup.
    uploadedImageKey =
      null;

    // ============================================================
    // 7. BEST-EFFORT OLD R2 IMAGE CLEANUP
    // ============================================================

    if (
      previousProfileImage &&
      previousProfileImage !==
        updatedProfile.profileImage
    ) {
      const publicBaseUrl =
        process.env
          .R2_PUBLIC_URL
          ?.replace(
            /\/$/,
            ""
          );

      if (
        publicBaseUrl &&
        previousProfileImage.startsWith(
          `${publicBaseUrl}/`
        )
      ) {
        const previousKey =
          previousProfileImage.slice(
            publicBaseUrl.length +
              1
          );

        if (previousKey) {
          try {
            await deleteFromR2(
              previousKey
            );
          } catch (
            cleanupError
          ) {
            console.error(
              "DELETE OLD TESTER PROFILE IMAGE ERROR:",
              cleanupError
            );
          }
        }
      }
    }

    // ============================================================
    // 8. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Profile image uploaded successfully.",

        data: {
          testerProfileId:
            updatedProfile.id,

          profileImage:
            updatedProfile.profileImage,
        },
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "TESTER PROFILE IMAGE UPLOAD ERROR:",
      error
    );

    if (uploadedImageKey) {
      try {
        await deleteFromR2(
          uploadedImageKey
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "TESTER PROFILE IMAGE CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to upload profile image.",
      },
      {
        status:
          500,
      }
    );
  }
}
