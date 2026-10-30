import {
  NextRequest,
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// HELPERS
// ============================================================

function parseAnswer(
  value: string | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Normal TEXT / SINGLE_CHOICE answer.
  }

  const cleaned = value.trim();

  return cleaned ? [cleaned] : [];
}

function formatAgeCategory(
  value: string
) {
  switch (value) {
    case "AGE_18_24":
      return "18-24";

    case "AGE_25_34":
      return "25-34";

    case "AGE_35_44":
      return "35-44";

    case "AGE_45_PLUS":
      return "45+";

    default:
      return value;
  }
}

// ============================================================
// GET ADMIN TESTER ANALYTICS
//
// GET /api/admin/analytics/testers
//
// Supported filters:
// - search
// - brandId
// - state
// - city
// - ageCategory
// - gender
// - interestId
// - minRating
// - fixedQuestionId
// - fixedAnswer
// - page
// - limit
// ============================================================

export async function GET(
  request: NextRequest
) {
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
    // 2. QUERY PARAMETERS
    // ========================================================

    const { searchParams } =
      new URL(request.url);

    const search =
      (
        searchParams.get(
          "search"
        ) ?? ""
      )
        .trim()
        .toLowerCase();

    const brandId =
      Number(
        searchParams.get(
          "brandId"
        )
      ) || 0;

    const state =
      (
        searchParams.get(
          "state"
        ) ?? ""
      ).trim();

    const city =
      (
        searchParams.get(
          "city"
        ) ?? ""
      ).trim();

    const ageCategory =
      (
        searchParams.get(
          "ageCategory"
        ) ?? ""
      ).trim();

    const gender =
      (
        searchParams.get(
          "gender"
        ) ?? ""
      ).trim();

    const interestId =
      Number(
        searchParams.get(
          "interestId"
        )
      ) || 0;

    const minRatingRaw =
      searchParams.get(
        "minRating"
      );

    const minRating =
      minRatingRaw
        ? Number(
            minRatingRaw
          )
        : null;

    const fixedQuestionId =
      Number(
        searchParams.get(
          "fixedQuestionId"
        )
      ) || 0;

    const fixedAnswer =
      (
        searchParams.get(
          "fixedAnswer"
        ) ?? ""
      )
        .trim()
        .toLowerCase();

    const page =
      Math.max(
        1,
        Number(
          searchParams.get(
            "page"
          ) ?? "1"
        ) || 1
      );

    const requestedLimit =
      Number(
        searchParams.get(
          "limit"
        ) ?? "10"
      );

    const limit =
      [10, 20, 50].includes(
        requestedLimit
      )
        ? requestedLimit
        : 10;

    if (
      minRating !== null &&
      (
        Number.isNaN(
          minRating
        ) ||
        minRating < 1 ||
        minRating > 5
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "minRating must be between 1 and 5.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. BASIC TESTER FILTER
    //
    // Average rating and fixed-answer filtering are calculated
    // after loading because they are derived from Task 3 data.
    // ========================================================

    const where: any = {
      deletedAt: null,
    };

    if (state) {
      where.state = state;
    }

    if (city) {
      where.city = city;
    }

    if (ageCategory) {
      where.ageCategory =
        ageCategory;
    }

    if (gender) {
      where.gender =
        gender;
    }

    if (
      interestId > 0
    ) {
      where.interests = {
        some: {
          interestId,
        },
      };
    }

    // ========================================================
    // 4. LOAD TESTERS
    // ========================================================

    const testers =
      await prisma.testerProfile.findMany({
        where,

        select: {
          id: true,

          fullName: true,

          gender: true,

          ageCategory: true,

          pinCode: true,

          city: true,

          state: true,

          profileImage: true,

          instagramId: true,

          approvalStatus: true,

          user: {
            select: {
              id: true,

              email: true,

              mobile: true,

              status: true,
            },
          },

          interests: {
            where: {
              interest: {
                isActive:
                  true,
              },
            },

            select: {
              interestId:
                true,

              interest: {
                select: {
                  id: true,

                  name: true,
                },
              },
            },

            orderBy: {
              interest: {
                name:
                  "asc",
              },
            },
          },

          testerCampaigns: {
            select: {
              id: true,

              status: true,

              campaign: {
                select: {
                  id: true,

                  campaignCode:
                    true,

                  productName:
                    true,

                  brandId:
                    true,

                  brand: {
                    select: {
                      id: true,

                      companyName:
                        true,
                    },
                  },
                },
              },

              tasks: {
                where: {
                  taskNumber:
                    3,
                },

                select: {
                  id: true,

                  submissions: {
                    where: {
                      status:
                        "APPROVED",
                    },

                    select: {
                      id: true,

                      task3ReviewDetail: {
                        select: {
                          id: true,

                          rating:
                            true,

                          answers: {
                            select: {
                              id: true,

                              answerText:
                                true,

                              campaignQuestion: {
                                select: {
                                  id: true,

                                  questionId:
                                    true,

                                  questionText:
                                    true,

                                  questionType:
                                    true,

                                  source:
                                    true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          fullName:
            "asc",
        },
      });

    // ========================================================
    // 5. DERIVED ANALYTICS
    // ========================================================

    const formatted =
      testers
        .map(
          (
            tester
          ) => {
            // Brand filtering also scopes rating/question analytics.
            const campaigns =
              brandId > 0
                ? tester.testerCampaigns.filter(
                    (
                      item
                    ) =>
                      item.campaign
                        .brandId ===
                      brandId
                  )
                : tester.testerCampaigns;

            if (
              brandId > 0 &&
              campaigns.length ===
                0
            ) {
              return null;
            }

            const ratings:
              number[] =
              [];

            const fixedAnswers =
              new Map<
                number,
                string[]
              >();

            campaigns.forEach(
              (
                testerCampaign
              ) => {
                testerCampaign.tasks.forEach(
                  (
                    task
                  ) => {
                    task.submissions.forEach(
                      (
                        submission
                      ) => {
                        const review =
                          submission
                            .task3ReviewDetail;

                        if (!review) {
                          return;
                        }

                        if (
                          Number.isInteger(
                            review.rating
                          ) &&
                          review.rating >=
                            1 &&
                          review.rating <=
                            5
                        ) {
                          ratings.push(
                            review.rating
                          );
                        }

                        review.answers.forEach(
                          (
                            answer
                          ) => {
                            const question =
                              answer
                                .campaignQuestion;

                            if (
                              question.source !==
                                "FIXED" ||
                              !question.questionId
                            ) {
                              return;
                            }

                            const values =
                              parseAnswer(
                                answer.answerText
                              );

                            const currentValues =
                              fixedAnswers.get(
                                question.questionId
                              ) ?? [];

                            fixedAnswers.set(
                              question.questionId,
                              [
                                ...currentValues,
                                ...values,
                              ]
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );

            const averageRating =
              ratings.length >
              0
                ? Number(
                    (
                      ratings.reduce(
                        (
                          total,
                          rating
                        ) =>
                          total +
                          rating,
                        0
                      ) /
                      ratings.length
                    ).toFixed(
                      2
                    )
                  )
                : null;

            // ------------------------------------------------
            // AVERAGE RATING FILTER
            // ------------------------------------------------

            if (
              minRating !==
                null &&
              (
                averageRating ===
                  null ||
                averageRating <
                  minRating
              )
            ) {
              return null;
            }

            // ------------------------------------------------
            // FIXED QUESTION / ANSWER FILTER
            // ------------------------------------------------

            if (
              fixedQuestionId >
              0
            ) {
              const answers =
                fixedAnswers.get(
                  fixedQuestionId
                ) ?? [];

              if (
                answers.length ===
                0
              ) {
                return null;
              }

              if (
                fixedAnswer
              ) {
                const hasAnswer =
                  answers.some(
                    (
                      answer
                    ) =>
                      answer
                        .toLowerCase()
                        .includes(
                          fixedAnswer
                        )
                  );

                if (
                  !hasAnswer
                ) {
                  return null;
                }
              }
            }

            // ------------------------------------------------
            // TEXT SEARCH
            // ------------------------------------------------

            if (search) {
              const searchable =
                [
                  tester.fullName,
                  tester.user.email ??
                    "",
                  tester.user.mobile ??
                    "",
                  tester.instagramId ??
                    "",
                  tester.pinCode,
                  tester.city ??
                    "",
                  tester.state ??
                    "",
                  ...tester.interests.map(
                    (item) =>
                      item.interest
                        .name
                  ),
                ]
                  .join(" ")
                  .toLowerCase();

              if (
                !searchable.includes(
                  search
                )
              ) {
                return null;
              }
            }

            const uniqueBrandNames =
              [
                ...new Set(
                  campaigns.map(
                    (
                      item
                    ) =>
                      item.campaign
                        .brand
                        .companyName
                  )
                ),
              ];

            const uniqueFixedAnswers =
              Object.fromEntries(
                [
                  ...fixedAnswers.entries(),
                ].map(
                  (
                    [
                      questionId,
                      values,
                    ]
                  ) => [
                    String(
                      questionId
                    ),
                    [
                      ...new Set(
                        values
                      ),
                    ],
                  ]
                )
              );

            return {
              id:
                tester.id,

              userId:
                tester.user.id,

              fullName:
                tester.fullName,

              profileImage:
                tester.profileImage,

              instagramId:
                tester.instagramId,

              email:
                tester.user.email,

              mobile:
                tester.user.mobile,

              gender:
                tester.gender,

              ageCategory:
                tester.ageCategory,

              ageLabel:
                formatAgeCategory(
                  tester.ageCategory
                ),

              pinCode:
                tester.pinCode,

              city:
                tester.city,

              state:
                tester.state,

              approvalStatus:
                tester.approvalStatus,

              userStatus:
                tester.user.status,

              interests:
                tester.interests.map(
                  (
                    item
                  ) => ({
                    id:
                      item.interest
                        .id,

                    name:
                      item.interest
                        .name,
                  })
                ),

              averageRating,

              ratingsCount:
                ratings.length,

              campaignCount:
                campaigns.length,

              brandNames:
                uniqueBrandNames,

              fixedAnswers:
                uniqueFixedAnswers,
            };
          }
        )
        .filter(
          (
            item
          ): item is NonNullable<
            typeof item
          > =>
            item !== null
        );

    // ========================================================
    // 6. PAGINATION
    // ========================================================

    const total =
      formatted.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit
        )
      );

    const safePage =
      Math.min(
        page,
        totalPages
      );

    const start =
      (safePage -
        1) *
      limit;

    const data =
      formatted.slice(
        start,
        start +
          limit
      );

    // ========================================================
    // 7. FILTER METADATA
    // ========================================================

    const [
      brands,
      fixedQuestions,
      states,
      interests,
    ] =
      await Promise.all([
        prisma.brandProfile.findMany({
          where: {
            deletedAt:
              null,
          },

          select: {
            id: true,

            companyName:
              true,
          },

          orderBy: {
            companyName:
              "asc",
          },
        }),

        prisma.question.findMany({
          where: {
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

            options: {
              orderBy: {
                optionOrder:
                  "asc",
              },

              select: {
                id: true,

                optionText:
                  true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        }),

        prisma.testerProfile.findMany({
          where: {
            deletedAt:
              null,

            state: {
              not: null,
            },
          },

          distinct: [
            "state",
          ],

          select: {
            state: true,
          },

          orderBy: {
            state:
              "asc",
          },
        }),

        prisma.interest.findMany({
          where: {
            isActive:
              true,
          },

          select: {
            id: true,

            name: true,
          },

          orderBy: {
            name: "asc",
          },
        }),
      ]);

    // ========================================================
    // 8. RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      data,

      filters: {
        brands,

        states:
          states
            .map(
              (
                item
              ) =>
                item.state
            )
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                  "string" &&
                value.trim().length >
                  0
            ),

        interests,

        ageCategories: [
          {
            value:
              "AGE_18_24",
            label:
              "18-24",
          },
          {
            value:
              "AGE_25_34",
            label:
              "25-34",
          },
          {
            value:
              "AGE_35_44",
            label:
              "35-44",
          },
          {
            value:
              "AGE_45_PLUS",
            label:
              "45+",
          },
        ],

        genders: [
          "MALE",
          "FEMALE",
          "OTHER",
        ],

        fixedQuestions,
      },

      summary: {
        matchedTesters:
          total,

        withRatings:
          formatted.filter(
            (
              item
            ) =>
              item.averageRating !==
              null
          ).length,
      },

      pagination: {
        page:
          safePage,

        limit,

        total,

        totalPages,

        hasNextPage:
          safePage <
          totalPages,

        hasPreviousPage:
          safePage >
          1,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
