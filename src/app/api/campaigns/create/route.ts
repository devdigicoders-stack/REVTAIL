import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

// import {
//   mkdir,
//   unlink,
//   writeFile,
// } from "fs/promises";

// import path from "path";
import {
  uploadToR2,
  deleteFromR2,
} from '@/lib/storage/r2';

import prisma from "@/lib/prisma";

import {
  getCurrentUser,
} from "@/lib/current-user";

import {
  TargetGender,
} from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

type ClientQuestionType =
  | "radio"
  | "checkbox"
  | "text";

type PrismaQuestionType =
  | "TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE";

type CustomQuestionInput = {
  type: ClientQuestionType;

  question: string;

  options: string[];
};

type ValidationErrors =
  Record<
    string,
    string |
      Record<string, string>
  >;

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_CUSTOM_TYPES:
  ClientQuestionType[] = [
    "radio",
    "checkbox",
    "text",
  ];

  const ALLOWED_MARKETPLACES = [
  'Amazon',
  'Flipkart',
  'Myntra',
  'Meesho',
  'Blinkit',
  'Zepto',
  'BigBasket',
  'Swiggy Instamart',
  'Brand’s Website',
  'AJIO',
  'Other',
] as const;

// ============================================================
// HELPERS
// ============================================================

function mapQuestionType(
  type:
    ClientQuestionType
): PrismaQuestionType {
  switch (type) {
    case "radio":
      return "SINGLE_CHOICE";

    case "checkbox":
      return "MULTIPLE_CHOICE";

    case "text":
      return "TEXT";

    default:
      throw new Error(
        "Invalid question type."
      );
  }
}

function parseJsonField<T>(
  value:
    FormDataEntryValue |
    null
): T | null {
  if (
    typeof value !==
      "string" ||
    value.trim() ===
      ""
  ) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as T;
  } catch {
    return null;
  }
}

function isValidHttpUrl(
  value:
    string
) {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function parseDateOnly(
  value:
    string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

export const runtime = 'nodejs'; //added for R2 upload to work in production

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  // const savedImageAbsolutePaths: string[] = [];   //to track saved images for cleanup in case of error
  const uploadedR2Keys: string[] = []; //used to track uploaded R2 keys for cleanup in case of error

  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

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

    // ========================================================
    // BOTH BRAND + ADMIN MAY CREATE
    // ========================================================

    if (
      currentUser.role !==
        "BRAND" &&
      currentUser.role !==
        "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Only Brand or Admin can create campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. FORM DATA
    // ========================================================

    const body =
      await request.formData();

    const productName =
      String(
        body.get(
          "productName"
        ) ?? ""
      ).trim();

    const productLink =
      String(
        body.get(
          "productLink"
        ) ?? ""
      ).trim();
    const marketplace = String(body.get('marketplace') ?? '').trim();
    const productDescription =
      String(
        body.get(
          "productDescription"
        ) ?? ""
      ).trim();

    const earning =
      String(
        body.get(
          "earning"
        ) ?? ""
      ).trim();

    const slots =
      String(
        body.get(
          "slots"
        ) ?? ""
      ).trim();

    const startDate =
      String(
        body.get(
          "startDate"
        ) ?? ""
      ).trim();

    const endDate =
      String(
        body.get(
          "endDate"
        ) ?? ""
      ).trim();

    const targetState =
      String(
        body.get(
          "state"
        ) ?? "any"
      ).trim();

    const targetCity =
      String(
        body.get(
          "city"
        ) ?? "any"
      ).trim();

    const targetGenderRaw =
      String(
        body.get(
          "gender"
        ) ?? "ANY"
      )
        .trim()
        .toUpperCase();

    const task4RequiredRaw =
      String(
        body.get(
          "task4Required"
        ) ?? "false"
      )
        .trim()
        .toLowerCase();

    // ========================================================
    // ADMIN SELECTED BRAND
    // ========================================================

    const selectedBrandIdRaw =
      String(
        body.get(
          "brandId"
        ) ?? ""
      ).trim();

    const selectedFixedQuestionIds =
      parseJsonField<unknown>(
        body.get(
          "selectedFixedQuestionIds"
        )
      );

    const customQuestions =
      parseJsonField<unknown>(
        body.get(
          "customQuestions"
        )
      );

    // ========================================================
    // IMAGES
    // ========================================================

    const rawProductImages =
      body.getAll(
        "productImages"
      );

    const productImages =
      rawProductImages.filter(
        (
          item
        ): item is File =>
          item instanceof
            File &&
          item.size > 0
      );

    // ========================================================
    // 3. VALIDATION
    // ========================================================

    const errors:
      ValidationErrors = {};

    // --------------------------------------------------------
    // Admin must select a Brand
    // --------------------------------------------------------

    let selectedBrandId:
      number | null =
      null;

    if (
      currentUser.role ===
      "ADMIN"
    ) {
      selectedBrandId =
        Number(
          selectedBrandIdRaw
        );

      if (
        !Number.isInteger(
          selectedBrandId
        ) ||
        selectedBrandId <=
          0
      ) {
        errors.brandId =
          "Please select a valid Brand.";
      }
    }

    if (!productName) {
      errors.productName =
        "Product name is required.";
    }

    // ========================================================
    // IMAGES
    // ========================================================

    if (
      productImages.length ===
      0
    ) {
      errors.productImage =
        "At least one product image is required.";
    } else if (
      productImages.length >
      4
    ) {
      errors.productImage =
        "You can upload a maximum of 4 product images.";
    } else {
      const invalidTypeImage =
        productImages.find(
          (image) =>
            !ALLOWED_IMAGE_TYPES.includes(
              image.type
            )
        );

      const oversizedImage =
        productImages.find(
          (image) =>
            image.size >
            MAX_IMAGE_SIZE
        );

      if (
        invalidTypeImage
      ) {
        errors.productImage =
          `${invalidTypeImage.name}: only JPG, PNG, or WEBP images are allowed.`;
      } else if (
        oversizedImage
      ) {
        errors.productImage =
          `${oversizedImage.name}: each image must be 5 MB or smaller.`;
      }
    }

    // ========================================================
    // PRODUCT LINK
    // ========================================================

    if (!productLink) {
      errors.productLink =
        "Product link is required.";
    } else if (
      !isValidHttpUrl(
        productLink
      )
    ) {
      errors.productLink =
        "Enter a valid http:// or https:// URL.";
    }

     if (!marketplace) {
      errors.marketplace = 'Marketplace is required.';
    } else if (
      !ALLOWED_MARKETPLACES.includes(
        marketplace as (typeof ALLOWED_MARKETPLACES)[number]
      )
    ) {
      errors.marketplace = 'Invalid marketplace selected.';
    }
    
    if (
      !productDescription
    ) {
      errors.productDescription =
        "Product description is required.";
    }

    // ========================================================
    // EARNING
    // ========================================================

    const earningAmount =
      Number(
        earning
      );

    if (!earning) {
      errors.earning =
        "Earning per tester is required.";
    } else if (
      !Number.isFinite(
        earningAmount
      ) ||
      earningAmount <= 0
    ) {
      errors.earning =
        "Earning must be greater than 0.";
    }

    // ========================================================
    // SLOTS
    // ========================================================

    const totalSlots =
      Number(
        slots
      );

    if (!slots) {
      errors.slots =
        "Total slots are required.";
    } else if (
      !Number.isInteger(
        totalSlots
      ) ||
      totalSlots <= 0
    ) {
      errors.slots =
        "Total slots must be a whole number greater than 0.";
    }

    // ========================================================
    // DATES
    // ========================================================

    let parsedStartDate:
      Date | null =
      null;

    let parsedEndDate:
      Date | null =
      null;

    if (!startDate) {
      errors.startDate =
        "Start date is required.";
    } else {
      parsedStartDate =
        parseDateOnly(
          startDate
        );

      if (
        !parsedStartDate
      ) {
        errors.startDate =
          "Enter a valid start date.";
      }
    }

    if (!endDate) {
      errors.endDate =
        "End date is required.";
    } else {
      parsedEndDate =
        parseDateOnly(
          endDate
        );

      if (
        !parsedEndDate
      ) {
        errors.endDate =
          "Enter a valid end date.";
      }
    }

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedEndDate <
        parsedStartDate
    ) {
      errors.endDate =
        "End date cannot be before the start date.";
    }

    // ========================================================
    // GENDER
    // ========================================================

    if (
      !Object.values(
        TargetGender
      ).includes(
        targetGenderRaw as
          TargetGender
      )
    ) {
      errors.gender =
        "Invalid target gender.";
    }

    if (
      task4RequiredRaw !==
        "true" &&
      task4RequiredRaw !==
        "false"
    ) {
      errors.task4Required =
        "Task 4 required must be true or false.";
    }

    // ========================================================
    // FIXED QUESTIONS
    // ========================================================

    if (
      !Array.isArray(
        selectedFixedQuestionIds
      )
    ) {
      errors.selectedFixedQuestionIds =
        "Invalid fixed question selection.";
    } else if (
      selectedFixedQuestionIds.length ===
      0
    ) {
      errors.selectedFixedQuestionIds =
        "Select at least one fixed question before continuing.";
    } else {
      const allIdsValid =
        selectedFixedQuestionIds.every(
          (id) =>
            Number.isInteger(
              Number(id)
            ) &&
            Number(id) > 0
        );

      if (
        !allIdsValid
      ) {
        errors.selectedFixedQuestionIds =
          "Invalid fixed question selection.";
      }
    }

    // ========================================================
    // CUSTOM QUESTIONS
    // ========================================================

    if (
      !Array.isArray(
        customQuestions
      )
    ) {
      errors.customQuestions =
        "Invalid custom questions data.";
    } else if (
      customQuestions.length >
      5
    ) {
      errors.customQuestions =
        "A campaign can contain a maximum of 5 custom questions.";
    } else {
      const customQuestionErrors:
        Record<
          string,
          string
        > = {};

      customQuestions.forEach(
        (
          rawQuestion,
          index
        ) => {
          if (
            typeof rawQuestion !==
              "object" ||
            rawQuestion ===
              null ||
            Array.isArray(
              rawQuestion
            )
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "Invalid custom question.";

            return;
          }

          const q =
            rawQuestion as
              Partial<CustomQuestionInput>;

          const questionText =
            typeof q.question ===
            "string"
              ? q.question.trim()
              : "";

          const questionType =
            q.type;

          const options =
            Array.isArray(
              q.options
            )
              ? q.options
              : [];

          if (
            !questionText
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "Question title is required.";

            return;
          }

          if (
            !questionType ||
            !ALLOWED_CUSTOM_TYPES.includes(
              questionType
            )
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "Invalid question type.";

            return;
          }

          if (
            questionType ===
            "text"
          ) {
            return;
          }

          if (
            options.length >
            4
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "A custom choice question can contain a maximum of 4 options.";

            return;
          }

          const cleanOptions =
            options.map(
              (option) =>
                typeof option ===
                "string"
                  ? option.trim()
                  : ""
            );

          if (
            cleanOptions.some(
              (option) =>
                option === ""
            )
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "Complete all option fields or remove unused options.";

            return;
          }

          if (
            cleanOptions.length <
            2
          ) {
            customQuestionErrors[
              `question_${
                index + 1
              }`
            ] =
              "At least 2 options are required.";
          }
        }
      );

      if (
        Object.keys(
          customQuestionErrors
        ).length >
        0
      ) {
        errors.customQuestions =
          customQuestionErrors;
      }
    }

    // ========================================================
    // RETURN VALIDATION ERRORS
    // ========================================================

    if (
      Object.keys(
        errors
      ).length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Validation failed. Please correct the submitted campaign data.",

          errors,
        },
        {
          status: 400,
        }
      );
    }

    const targetGender =
      targetGenderRaw as
        TargetGender;

    const task4Required =
      task4RequiredRaw ===
      "true";

    const validFixedQuestionIds =
      (
        selectedFixedQuestionIds as
          unknown[]
      ).map(
        Number
      );

    const validCustomQuestions =
      customQuestions as
        CustomQuestionInput[];

    // ========================================================
    // 4. RESOLVE BRAND
    // ========================================================

    let brandProfile:
      | {
          id: number;
        }
      | null =
      null;

    // --------------------------------------------------------
    // BRAND USER
    // --------------------------------------------------------

    if (
      currentUser.role ===
      "BRAND"
    ) {
      brandProfile =
        await prisma.brandProfile.findUnique({
          where: {
            userId:
              currentUser.userId,
          },

          select: {
            id: true,
          },
        });

      if (
        !brandProfile
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Brand profile not found. Complete the Brand profile first.",
          },
          {
            status:
              404,
          }
        );
      }
    }

    // --------------------------------------------------------
    // ADMIN USER
    // --------------------------------------------------------

    if (
      currentUser.role ===
      "ADMIN"
    ) {
      brandProfile =
        await prisma.brandProfile.findFirst({
          where: {
            id:
              selectedBrandId!,

            deletedAt:
              null,

            approvalStatus:
              "ACTIVE",

            user: {
              role:
                "BRAND",

              status:
                "ACTIVE",
            },
          },

          select: {
            id: true,
          },
        });

      if (
        !brandProfile
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Selected Brand is invalid or is not approved.",
          },
          {
            status:
              400,
          }
        );
      }
    }

    if (!brandProfile) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unable to resolve Brand.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. VALIDATE FIXED QUESTIONS
    // ========================================================

    const uniqueFixedIds =
      [
        ...new Set(
          validFixedQuestionIds
        ),
      ];

    const fixedQuestions =
      await prisma.question.findMany({
        where: {
          id: {
            in:
              uniqueFixedIds,
          },

          source:
            "FIXED",

          isActive:
            true,
        },

        select: {
          id: true,

          questionText:
            true,

          questionType:
            true,
        },
      });

    if (
      fixedQuestions.length !==
      uniqueFixedIds.length
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Validation failed. Please correct the submitted campaign data.",

          errors: {
            selectedFixedQuestionIds:
              "One or more selected fixed questions are invalid or inactive.",
          },
        },
        {
          status:
            400,
        }
      );
    }

    const fixedQuestionMap =
      new Map(
        fixedQuestions.map(
          (question) => [
            question.id,
            question,
          ]
        )
      );

    const orderedFixedQuestions =
      uniqueFixedIds
        .map(
          (id) =>
            fixedQuestionMap.get(
              id
            )
        )
        .filter(
          (
            question
          ): question is NonNullable<
            typeof question
          > =>
            Boolean(
              question
            )
        );

    // ========================================================
    // 6. SAVE IMAGES
    // ========================================================

    // const uploadDirectory =
    //   path.join(
    //     process.cwd(),
    //     "public",
    //     "uploads",
    //     "campaigns"
    //   );

    // await mkdir(
    //   uploadDirectory,
    //   {
    //     recursive:
    //       true,
    //   }
    // );

    // const productImagePaths:
    //   string[] = [];

    // for (
    //   const image of
    //   productImages
    // ) {
    //   const bytes =
    //     Buffer.from(
    //       await image.arrayBuffer()
    //     );

    //   const extension =
    //     path.extname(
    //       image.name
    //     ) || ".jpg";

    //   const fileName =
    //     `${Date.now()}-${randomUUID()}${extension}`;

    //   const absolutePath =
    //     path.join(
    //       uploadDirectory,
    //       fileName
    //     );

    //   await writeFile(
    //     absolutePath,
    //     bytes
    //   );

    //   savedImageAbsolutePaths.push(
    //     absolutePath
    //   );

    //   productImagePaths.push(
    //     `/uploads/campaigns/${fileName}`
    //   );
    // }

    // const primaryProductImagePath =
    //   productImagePaths[0];


     const campaignCode =
      `CMP-${Date.now()}-${randomUUID()
        .replace(
          /-/g,
          ""
        )
        .slice(
          0,
          6
        )
        .toUpperCase()}`;

    // ------------------------------------------------------------
    // 6. Upload product images to Cloudflare R2.
    //
    // R2 uploads cannot participate in the Prisma/MySQL transaction,
    // therefore every successfully uploaded key is tracked.
    // If campaign creation fails later, the uploaded objects are
    // removed from R2 in the catch block.
    // ------------------------------------------------------------

    const productImagePaths: string[] = [];

    for (const image of productImages) {
      const bytes = Buffer.from(await image.arrayBuffer());

      // Get extension from original filename.
      const originalExtension = image.name
        .split('.')
        .pop()
        ?.toLowerCase();

      let extension = originalExtension || 'jpg';

      // Defensive fallback based on validated MIME type.
      if (!originalExtension) {
        if (image.type === 'image/png') {
          extension = 'png';
        } else if (image.type === 'image/webp') {
          extension = 'webp';
        } else {
          extension = 'jpg';
        }
      }

      const fileName =
        `${Date.now()}-${randomUUID()}.${extension}`;

      /*
      * We don't yet have campaign.id because the campaign
      * database record is created after images are uploaded.
      *
      * campaignCode could also be used, but at this point
      * it hasn't been generated in the current code.
      */
      const r2Key =
        `campaigns/product-images/${brandProfile.id}/${fileName}`;

      const uploadedImage = await uploadToR2({
        file: bytes,
        key: r2Key,
        contentType: image.type,
      });

      uploadedR2Keys.push(uploadedImage.key);

      if (!uploadedImage.url) {
        throw new Error(
          'R2_PUBLIC_URL is not configured. Campaign image URL cannot be generated.'
        );
      }

      productImagePaths.push(uploadedImage.url);
    }

    // First image remains primary image for backward compatibility.
    const primaryProductImagePath = productImagePaths[0];

    // ========================================================
    // 7. STATUS BASED ON CREATOR
    // ========================================================

    const isAdmin =
      currentUser.role ===
      "ADMIN";

    const now =
      new Date();

    // ========================================================
    // 8. CREATE TRANSACTION
    // ========================================================

    // const campaignCode =
    //   `CMP-${Date.now()}-${randomUUID()
    //     .replace(
    //       /-/g,
    //       ""
    //     )
    //     .slice(
    //       0,
    //       6
    //     )
    //     .toUpperCase()}`;

    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {
          // ==================================================
          // CAMPAIGN
          // ==================================================

          const campaign =
            await tx.campaign.create({
              data: {
                brandId:
                  brandProfile.id,

                createdBy:
                  currentUser.userId,

                campaignCode,

                productName,

                productImage:
                  primaryProductImagePath,

                productLink,

                marketplace,

                productDescription,

                earningAmount,

                currency:
                  "INR",

                totalSlots,

                filledSlots:
                  0,

                availableSlots:
                  totalSlots,

                targetState,

                targetCity,

                targetGender,

                task4Required,

                startDate:
                  parsedStartDate,

                endDate:
                  parsedEndDate,

                // ============================================
                // ADMIN -> LIVE DIRECTLY
                // BRAND -> SUBMITTED
                // ============================================

                status:
                  isAdmin
                    ? "LIVE"
                    : "SUBMITTED",

                submittedAt:
                  isAdmin
                    ? null
                    : now,

                approvedAt:
                  isAdmin
                    ? now
                    : null,

                approvedBy:
                  isAdmin
                    ? currentUser.userId
                    : null,
              },
            });

          // ==================================================
          // CAMPAIGN IMAGES
          // ==================================================

          await tx.campaignImage.createMany({
            data:
              productImagePaths.map(
                (
                  imagePath,
                  index
                ) => ({
                  campaignId:
                    campaign.id,

                  imagePath,

                  imageOrder:
                    index + 1,
                })
              ),
          });

          let questionOrder =
            1;

          // ==================================================
          // FIXED QUESTIONS
          // ==================================================

          for (
            const fixedQuestion of
            orderedFixedQuestions
          ) {
            await tx.campaignQuestion.create({
              data: {
                campaignId:
                  campaign.id,

                questionId:
                  fixedQuestion.id,

                questionText:
                  fixedQuestion.questionText,

                questionType:
                  fixedQuestion.questionType,

                source:
                  "FIXED",

                isRequired:
                  true,

                questionOrder,
              },
            });

            questionOrder +=
              1;
          }

          // ==================================================
          // CUSTOM QUESTIONS
          // ==================================================

          for (
            const customQuestion of
            validCustomQuestions
          ) {
            const questionText =
              customQuestion
                .question
                .trim();

            const questionType =
              mapQuestionType(
                customQuestion.type
              );

            const cleanOptions =
              questionType ===
              "TEXT"
                ? []
                : customQuestion.options.map(
                    (
                      option
                    ) =>
                      option.trim()
                  );

            const createdQuestion =
              await tx.question.create({
                data: {
                  questionText,

                  questionType,

                  source:
                    "CUSTOM",

                  isActive:
                    true,

                  createdBy:
                    currentUser.userId,

                  ...(cleanOptions.length >
                  0
                    ? {
                        options: {
                          create:
                            cleanOptions.map(
                              (
                                optionText,
                                index
                              ) => ({
                                optionText,

                                optionOrder:
                                  index +
                                  1,
                              })
                            ),
                        },
                      }
                    : {}),
                },
              });

            await tx.campaignQuestion.create({
              data: {
                campaignId:
                  campaign.id,

                questionId:
                  createdQuestion.id,

                questionText,

                questionType,

                source:
                  "CUSTOM",

                isRequired:
                  true,

                questionOrder,
              },
            });

            questionOrder +=
              1;
          }

          return tx.campaign.findUnique({
            where: {
              id:
                campaign.id,
            },

            include: {
              brand: {
                select: {
                  id: true,

                  companyName:
                    true,
                },
              },

              images: {
                orderBy: {
                  imageOrder:
                    "asc",
                },
              },

              campaignQuestions: {
                orderBy: {
                  questionOrder:
                    "asc",
                },

                include: {
                  question: {
                    include: {
                      options: {
                        orderBy: {
                          optionOrder:
                            "asc",
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );

    // ========================================================
    // 9. SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          isAdmin
            ? "Campaign created successfully and is now LIVE."
            : "Campaign submitted successfully for Admin approval.",

        data:
          result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE CAMPAIGN ERROR:",
      error
    );

    // ========================================================
    // CLEANUP ORPHAN IMAGES
    // ========================================================

    // await Promise.all(
    //   savedImageAbsolutePaths.map(
    //     async (
    //       absolutePath
    //     ) => {
    //       try {
    //         await unlink(
    //           absolutePath
    //         );
    //       } catch {
    //         // Ignore cleanup failure.
    //       }
    //     }
    //   )
    // );

    // Remove R2 objects if campaign/database creation failed.
    // This prevents orphan campaign images in R2.
    if (uploadedR2Keys.length > 0) {
      const cleanupResults = await Promise.allSettled(
        uploadedR2Keys.map((key) =>
          deleteFromR2(key)
        )
      );

      cleanupResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            'R2 CLEANUP FAILED:',
            uploadedR2Keys[index],
            result.reason
          );
        }
      });
    }

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to create campaign.",
      },
      {
        status: 500,
      }
    );
  }

}