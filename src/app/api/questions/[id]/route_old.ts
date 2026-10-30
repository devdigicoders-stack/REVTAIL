import { NextRequest, NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const VALID_TYPES = [
  "TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
] as const;


type QuestionType = (typeof VALID_TYPES)[number];

function isValidQuestionType(type: unknown): type is QuestionType {
  return (
    typeof type === "string" &&
    VALID_TYPES.includes(type as QuestionType)
  );
}

function getQuestionId(id: string): number | null {
  const questionId = Number(id);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return null;
  }

  return questionId;
}

/**
 * GET /api/questions/:id
 *
 * Get one question with its options.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const questionId = getQuestionId(id);

    if (!questionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid question ID.",
        },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
  where: {
    id: questionId,
  },
  select: {
    id: true,
    questionText: true,
    questionType: true,
    source: true,
    isActive: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,

    options: {
      orderBy: {
        optionOrder: "asc",
      },
    },
  },
});

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("GET /api/questions/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch question.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/questions/:id
 *
 * Update question and its options.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const questionId = getQuestionId(id);

    if (!questionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid question ID.",
        },
        { status: 400 }
      );
    }

    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
      include: {
        options: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    let body: {
      questionText?: unknown;
      questionType?: unknown;
      options?: unknown;
      isActive?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const { questionText, questionType, options, isActive } = body;

    // questionText is required
    if (
      typeof questionText !== "string" ||
      questionText.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "questionText is required.",
        },
        { status: 400 }
      );
    }

    // questionType is required
    if (!isValidQuestionType(questionType)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid questionType. Allowed values: TEXT, SINGLE_CHOICE, MULTIPLE_CHOICE.",
        },
        { status: 400 }
      );
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "isActive must be true or false.",
        },
        { status: 400 }
      );
    }

    let cleanedOptions: string[] = [];

    if (questionType === "TEXT") {
      if (options !== undefined && options !== null) {
        if (!Array.isArray(options) || options.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "TEXT questions cannot have options.",
            },
            { status: 400 }
          );
        }
      }
    } else {
      if (!Array.isArray(options)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "options are required for SINGLE_CHOICE and MULTIPLE_CHOICE questions.",
          },
          { status: 400 }
        );
      }

      cleanedOptions = options
        .filter((option) => typeof option === "string")
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

      cleanedOptions = [...new Set(cleanedOptions)];

      if (cleanedOptions.length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: "At least 2 unique options are required.",
          },
          { status: 400 }
        );
      }
    }

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: {
          id: questionId,
        },
        data: {
          questionText: questionText.trim(),
          questionType,
          ...(typeof isActive === "boolean"
            ? { isActive }
            : {}),
        },
      });

      // Replace options.
      // This is simple and reliable for the Admin question bank.
      await tx.questionOption.deleteMany({
        where: {
          questionId,
        },
      });

      if (cleanedOptions.length > 0) {
        await tx.questionOption.createMany({
          data: cleanedOptions.map((option, index) => ({
            questionId,
            optionText: option,
            optionOrder: index + 1,
          })),
        });
      }

      return tx.question.findUnique({
        where: {
          id: questionId,
        },
        include: {
          options: {
            orderBy: {
              optionOrder: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Question updated successfully.",
      data: updatedQuestion,
    });
  } catch (error) {
    console.error("PUT /api/questions/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update question.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions/:id
 *
 * Soft delete if the question has already been used
 * in a campaign. Otherwise physically delete it.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin only.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const questionId = getQuestionId(id);

    if (!questionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid question ID.",
        },
        { status: 400 }
      );
    }

    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
      include: {
        _count: {
          select: {
            campaignQuestions: true,
          },
        },
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    /*
     * If the question has already been used by a campaign,
     * do not physically delete it.
     *
     * Instead deactivate it so historical campaign data
     * remains intact.
     */
    if (existingQuestion._count.campaignQuestions > 0) {
      const deactivatedQuestion = await prisma.question.update({
        where: {
          id: questionId,
        },
        data: {
          isActive: false,
        },
        include: {
          options: {
            orderBy: {
              optionOrder: "asc",
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Question has already been used in a campaign and was deactivated instead of permanently deleted.",
        data: deactivatedQuestion,
      });
    }

    // Question has never been used.
    // Physical delete is safe because QuestionOption has
    // onDelete: Cascade.
    await prisma.question.delete({
      where: {
        id: questionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete question.",
      },
      { status: 500 }
    );
  }
}