import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

/**
 * GET /api/questions
 *
 * Optional query parameters:
 * ?isActive=true
 * ?type=SINGLE_CHOICE
 */
// export async function GET(request: NextRequest) {
//   try {
//     const currentUser = await getCurrentUser();

//     if (!currentUser) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthorized",
//         },
//         { status: 401 }
//       );
//     }

//     if (currentUser.role !== "ADMIN") {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Access denied. Admin only.",
//         },
//         { status: 403 }
//       );
//     }

//     const { searchParams } = new URL(request.url);

//     const isActiveParam = searchParams.get("isActive");
//     const typeParam = searchParams.get("type");
//     const sourceParam = searchParams.get("source");

//     const where: {
//       isActive?: boolean;
//       questionType?: QuestionType,
//       source?: "FIXED" | "CUSTOM";
//     } = {};

//     if (isActiveParam !== null) {
//       if (isActiveParam !== "true" && isActiveParam !== "false") {
//         return NextResponse.json(
//           {
//             success: false,
//             message: "isActive must be true or false.",
//           },
//           { status: 400 }
//         );
//       }

//       where.isActive = isActiveParam === "true";
//     }

//     if (typeParam !== null) {
//       if (!isValidQuestionType(typeParam)) {
//         return NextResponse.json(
//           {
//             success: false,
//             message:
//               "Invalid question type. Allowed values: TEXT, SINGLE_CHOICE, MULTIPLE_CHOICE.",
//           },
//           { status: 400 }
//         );
//       }

//       where.questionType = typeParam;
//     }
//     if (sourceParam !== null) {
//       if (sourceParam !== "FIXED" && sourceParam !== "CUSTOM") {
//         return NextResponse.json(
//           {
//             success: false,
//             message:
//               "Invalid source. Allowed values: FIXED, CUSTOM.",
//           },
//           { status: 400 }
//         );
//       }

//       where.source = sourceParam;
//     }

    
// const questions = await prisma.question.findMany({
//   where,
//   select: {
//     id: true,
//     questionText: true,
//     questionType: true,
//     source: true,
//     isActive: true,
//     createdBy: true,
//     createdAt: true,
//     updatedAt: true,

//     options: {
//       orderBy: {
//         optionOrder: "asc",
//       },
//       select: {
//         id: true,
//         questionId: true,
//         optionText: true,
//         optionOrder: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     },
//   },
//   orderBy: {
//     createdAt: "desc",
//   },
// });
//     return NextResponse.json({
//       success: true,
//       count: questions.length,
//       data: questions,
//     });
//   } catch (error) {
//     console.error("GET /api/questions error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch questions.",
//       },
//       { status: 500 }
//     );
//   }
// }
export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Check logged-in user
    // --------------------------------------------------
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Only ADMIN and BRAND can access this endpoint
    // --------------------------------------------------
    if (currentUser.role !== "ADMIN" && currentUser.role !== "BRAND") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. You do not have permission to access questions.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. BRAND:
    //    Brand must only see active FIXED questions.
    //    Ignore any query parameters sent by Brand.
    // --------------------------------------------------
    if (currentUser.role === "BRAND") {
      const questions = await prisma.question.findMany({
        where: {
          source: "FIXED",
          isActive: true,
        },

        select: {
          id: true,
          questionText: true,
          questionType: true,
          source: true,
          isActive: true,

          options: {
            orderBy: {
              optionOrder: "asc",
            },

            select: {
              id: true,
              questionId: true,
              optionText: true,
              optionOrder: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Fixed questions fetched successfully.",
          data: questions,
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------
    // 4. ADMIN:
    //    Admin can filter question bank.
    // --------------------------------------------------
    const { searchParams } = new URL(request.url);

    const isActiveParam = searchParams.get("isActive");
    const typeParam = searchParams.get("type");
    const sourceParam = searchParams.get("source");

    const where: {
      isActive?: boolean;
      questionType?: "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
      source?: "FIXED" | "CUSTOM";
    } = {};

    // --------------------------------------------------
    // isActive filter
    // --------------------------------------------------
    if (isActiveParam !== null) {
      if (isActiveParam !== "true" && isActiveParam !== "false") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid isActive value. Use true or false.",
          },
          { status: 400 }
        );
      }

      where.isActive = isActiveParam === "true";
    }

    // --------------------------------------------------
    // Question Type filter
    // --------------------------------------------------
    if (typeParam !== null) {
      const allowedTypes = [
        "TEXT",
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
      ] as const;

      if (
        !allowedTypes.includes(
          typeParam as (typeof allowedTypes)[number]
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid question type. Allowed values: TEXT, SINGLE_CHOICE, MULTIPLE_CHOICE.",
          },
          { status: 400 }
        );
      }

      where.questionType =
        typeParam as "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    }

    // --------------------------------------------------
    // Source filter
    // --------------------------------------------------
    if (sourceParam !== null) {
      if (sourceParam !== "FIXED" && sourceParam !== "CUSTOM") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid source. Allowed values: FIXED, CUSTOM.",
          },
          { status: 400 }
        );
      }

      where.source = sourceParam;
    }

    // --------------------------------------------------
    // 5. Get questions for Admin
    // --------------------------------------------------
    const questions = await prisma.question.findMany({
      where,

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

          select: {
            id: true,
            questionId: true,
            optionText: true,
            optionOrder: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Questions fetched successfully.",
        data: questions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}
/**
 * POST /api/questions
 *
 * Create a new reusable Admin question.
 */
export async function POST(request: NextRequest) {
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

    // Validate question text
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

    // Validate question type
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

    // Validate isActive
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

      // Remove duplicate options
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

    const question = await prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.question.create({
        data: {
          questionText: questionText.trim(),
          questionType,
          isActive:
            typeof isActive === "boolean" ? isActive : true,
          createdBy: currentUser.userId,
        },
      });

      if (cleanedOptions.length > 0) {
        await tx.questionOption.createMany({
          data: cleanedOptions.map((option, index) => ({
            questionId: createdQuestion.id,
            optionText: option,
            optionOrder: index + 1,
          })),
        });
      }

      return tx.question.findUnique({
        where: {
          id: createdQuestion.id,
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

    return NextResponse.json(
      {
        success: true,
        message: "Question created successfully.",
        data: question,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/questions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create question.",
      },
      { status: 500 }
    );
  }
}