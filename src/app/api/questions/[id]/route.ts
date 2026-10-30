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

type QuestionType =
  (typeof VALID_TYPES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidQuestionType(
  value: unknown
): value is QuestionType {
  return (
    typeof value ===
      "string" &&
    VALID_TYPES.includes(
      value as QuestionType
    )
  );
}

// ============================================================
// AUTH
// ============================================================

async function getAdmin() {
  const currentUser =
    await getCurrentUser();

  return currentUser;
}

// ============================================================
// GET ONE FIXED QUESTION
// ============================================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser =
      await getAdmin();

    if (
      !currentUser ||
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

    const {
      id,
    } =
      await context.params;

    const questionId =
      Number(id);

    if (
      !Number.isInteger(
        questionId
      ) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid question ID.",
        },
        {
          status: 400,
        }
      );
    }

    const question =
      await prisma.question.findFirst({
        where: {
          id:
            questionId,

          source:
            "FIXED",
        },

        include: {
          options: {
            orderBy: {
              optionOrder:
                "asc",
            },
          },

          _count: {
            select: {
              campaignQuestions:
                true,
            },
          },
        },
      });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Fixed question not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      data: {
        ...question,

        usageCount:
          question._count
            .campaignQuestions,
      },
    });
  } catch (error) {
    console.error(
      "GET QUESTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load question.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// UPDATE FIXED QUESTION
// ============================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser =
      await getAdmin();

    if (
      !currentUser ||
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

    const {
      id,
    } =
      await context.params;

    const questionId =
      Number(id);

    if (
      !Number.isInteger(
        questionId
      ) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid question ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.question.findFirst({
        where: {
          id:
            questionId,

          source:
            "FIXED",
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Fixed question not found.",
        },
        {
          status: 404,
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
                item
              ): item is string =>
                typeof item ===
                "string"
            )
            .map(
              (item) =>
                item.trim()
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

    const question =
      await prisma.$transaction(
        async (tx) => {
          await tx.question.update({
            where: {
              id:
                questionId,
            },

            data: {
              questionText:
                questionText.trim(),

              questionType,

              isActive:
                typeof isActive ===
                "boolean"
                  ? isActive
                  : true,
            },
          });

          await tx.questionOption.deleteMany({
            where: {
              questionId,
            },
          });

          if (
            cleanedOptions.length >
            0
          ) {
            await tx.questionOption.createMany({
              data:
                cleanedOptions.map(
                  (
                    optionText,
                    index
                  ) => ({
                    questionId,

                    optionText,

                    optionOrder:
                      index +
                      1,
                  })
                ),
            });
          }

          return tx.question.findUnique({
            where: {
              id:
                questionId,
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
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "Question updated successfully.",

      data:
        question,
    });
  } catch (error) {
    console.error(
      "PUT QUESTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update question.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE FIXED QUESTION
// ============================================================

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser =
      await getAdmin();

    if (
      !currentUser ||
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

    const {
      id,
    } =
      await context.params;

    const questionId =
      Number(id);

    if (
      !Number.isInteger(
        questionId
      ) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid question ID.",
        },
        {
          status: 400,
        }
      );
    }

    const question =
      await prisma.question.findFirst({
        where: {
          id:
            questionId,

          source:
            "FIXED",
        },

        select: {
          id: true,

          questionText:
            true,
        },
      });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Fixed question not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.question.delete({
      where: {
        id:
          questionId,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Question deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE QUESTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to delete question.",
      },
      {
        status: 500,
      }
    );
  }
}