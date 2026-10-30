import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const VALID_TYPES = [
  "TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
] as const;

const VALID_SOURCES = [
  "FIXED",
  "CUSTOM",
] as const;

type QuestionType =
  (typeof VALID_TYPES)[number];

type QuestionSource =
  (typeof VALID_SOURCES)[number];

function isValidQuestionType(
  value: unknown
): value is QuestionType {
  return (
    typeof value === "string" &&
    VALID_TYPES.includes(
      value as QuestionType
    )
  );
}

function isValidSource(
  value: unknown
): value is QuestionSource {
  return (
    typeof value === "string" &&
    VALID_SOURCES.includes(
      value as QuestionSource
    )
  );
}

// ============================================================
// GET QUESTIONS
//
// ADMIN
// - can browse FIXED/CUSTOM
// - supports pagination/search
//
// BRAND
// - only active FIXED questions
// - used by CreateCampaignForm
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
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
        "ADMIN" &&
      currentUser.role !==
        "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const sourceParam =
      searchParams.get(
        "source"
      );

    const typeParam =
      searchParams.get(
        "type"
      );

    const isActiveParam =
      searchParams.get(
        "isActive"
      );

    const search =
      searchParams
        .get("search")
        ?.trim() ??
      "";

    const pageParam =
      searchParams.get(
        "page"
      );

    const limitParam =
      searchParams.get(
        "limit"
      );

    // Pagination is optional.
    // Important so CreateCampaignForm continues
    // receiving all active FIXED questions.
    const usePagination =
      pageParam !== null ||
      limitParam !== null;

    const page =
      Math.max(
        1,
        Number(
          pageParam ??
            "1"
        ) || 1
      );

    const allowedLimits = [
      10,
      20,
      50,
    ];

    const requestedLimit =
      Number(
        limitParam ??
          "10"
      );

    const limit =
      allowedLimits.includes(
        requestedLimit
      )
        ? requestedLimit
        : 10;

    const where: any = {};

    // ========================================================
    // BRAND ACCESS
    // ========================================================

    if (
      currentUser.role ===
      "BRAND"
    ) {
      where.source =
        "FIXED";

      where.isActive =
        true;
    } else {
      // ======================================================
      // ADMIN FILTERS
      // ======================================================

      if (
        sourceParam !==
        null
      ) {
        if (
          !isValidSource(
            sourceParam
          )
        ) {
          return NextResponse.json(
            {
              success:
                false,
              message:
                "Invalid source.",
            },
            {
              status: 400,
            }
          );
        }

        where.source =
          sourceParam;
      }

      if (
        isActiveParam !==
        null
      ) {
        if (
          isActiveParam !==
            "true" &&
          isActiveParam !==
            "false"
        ) {
          return NextResponse.json(
            {
              success:
                false,
              message:
                "isActive must be true or false.",
            },
            {
              status: 400,
            }
          );
        }

        where.isActive =
          isActiveParam ===
          "true";
      }
    }

    // ========================================================
    // TYPE
    // ========================================================

    if (
      typeParam !== null
    ) {
      if (
        !isValidQuestionType(
          typeParam
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid question type.",
          },
          {
            status: 400,
          }
        );
      }

      where.questionType =
        typeParam;
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {
      where.questionText = {
        contains:
          search,
      };
    }

    // ========================================================
    // COUNT
    // ========================================================

    const total =
      await prisma.question.count({
        where,
      });

    // ========================================================
    // QUESTIONS
    // ========================================================

    const questions =
      await prisma.question.findMany({
        where,

        select: {
          id: true,

          questionText:
            true,

          questionType:
            true,

          source:
            true,

          isActive:
            true,

          createdBy:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          options: {
            orderBy: {
              optionOrder:
                "asc",
            },

            select: {
              id: true,

              questionId:
                true,

              optionText:
                true,

              optionOrder:
                true,
            },
          },

          _count: {
            select: {
              campaignQuestions:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        ...(usePagination
          ? {
              skip:
                (page -
                  1) *
                limit,

              take:
                limit,
            }
          : {}),
      });

    const data =
      questions.map(
        (question) => ({
          ...question,

          usageCount:
            question
              ._count
              .campaignQuestions,
        })
      );

    const totalPages =
      usePagination
        ? Math.max(
            1,
            Math.ceil(
              total /
                limit
            )
          )
        : 1;

    return NextResponse.json({
      success: true,

      count:
        data.length,

      total,

      data,

      pagination:
        usePagination
          ? {
              page,

              limit,

              total,

              totalPages,

              hasNextPage:
                page <
                totalPages,

              hasPreviousPage:
                page > 1,
            }
          : null,
    });
  } catch (error) {
    console.error(
      "GET /api/questions ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to fetch questions.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// CREATE FIXED QUESTION
//
// ADMIN ONLY
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
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
            "Access denied. Admin only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // MAXIMUM 10 FIXED QUESTIONS
    // ========================================================

    const fixedCount =
      await prisma.question.count({
        where: {
          source:
            "FIXED",
        },
      });

    if (
      fixedCount >= 10
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Maximum 10 fixed questions are allowed. Delete an existing fixed question before creating another.",
        },
        {
          status: 409,
        }
      );
    }

    const body =
      await request.json();

    const {
      questionText,
      questionType,
      options,
      isActive,
    } =
      body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      typeof questionText !==
        "string" ||
      !questionText.trim()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Question text is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidQuestionType(
        questionType
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid question type.",
        },
        {
          status: 400,
        }
      );
    }

    let cleanedOptions:
      string[] =
      [];

    if (
      questionType !==
      "TEXT"
    ) {
      if (
        !Array.isArray(
          options
        )
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Options are required.",
          },
          {
            status: 400,
          }
        );
      }

      cleanedOptions = [
        ...new Set(
          options
            .filter(
              (
                option
              ): option is string =>
                typeof option ===
                "string"
            )
            .map(
              (option) =>
                option.trim()
            )
            .filter(Boolean)
        ),
      ];

      if (
        cleanedOptions.length <
        2
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "At least 2 unique options are required.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ========================================================
    // CREATE
    // ========================================================

    const question =
      await prisma.question.create({
        data: {
          questionText:
            questionText.trim(),

          questionType,

          source:
            "FIXED",

          isActive:
            typeof isActive ===
            "boolean"
              ? isActive
              : true,

          createdBy:
            currentUser.userId,

          ...(cleanedOptions.length >
          0
            ? {
                options: {
                  create:
                    cleanedOptions.map(
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

        include: {
          options: {
            orderBy: {
              optionOrder:
                "asc",
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Fixed question created successfully.",

        data:
          question,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/questions ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to create question.",
      },
      {
        status: 500,
      }
    );
  }
}

