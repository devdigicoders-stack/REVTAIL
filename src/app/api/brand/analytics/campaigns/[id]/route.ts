import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import {
  getCurrentUser,
} from "@/lib/current-user";

type RouteContext = {
  params:
    Promise<{
      id: string;
    }>;
};

type Counter =
  Map<
    string,
    number
  >;

// ============================================================
// HELPERS
// ============================================================

function parseAnswer(
  value:
    string | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
    }
  } catch {
    // SINGLE_CHOICE / TEXT answer.
  }

  const cleaned =
    value.trim();

  return cleaned
    ? [
        cleaned,
      ]
    : [];
}

function formatAgeCategory(
  value:
    string | null
) {
  if (!value) {
    return "Unknown";
  }

  switch (
    value
  ) {
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

function increment(
  counter:
    Counter,
  key:
    string
) {
  counter.set(
    key,
    (
      counter.get(
        key
      ) ??
      0
    ) +
      1
  );
}

function distribution(
  counter:
    Counter,
  denominator:
    number,
  sortByCount =
    false
) {
  const output =
    Array.from(
      counter.entries()
    ).map(
      (
        [
          label,
          count,
        ]
      ) => ({
        label,
        count,

        percentage:
          denominator >
          0
            ? Number(
                (
                  (
                    count /
                    denominator
                  ) *
                  100
                ).toFixed(
                  1
                )
              )
            : 0,
      })
    );

  if (
    sortByCount
  ) {
    output.sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
    );
  }

  return output;
}

// ============================================================
// GET /api/brand/analytics/campaigns/[id]
//
// Returns analytics only when the selected campaign belongs
// to the currently logged-in Brand.
// ============================================================

export async function GET(
  _request:
    Request,
  context:
    RouteContext
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
      "BRAND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Brand only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. BRAND PROFILE
    // ========================================================

    const brandProfile =
      await prisma.brandProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id:
            true,

          companyName:
            true,
        },
      });

    if (!brandProfile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brand profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 3. CAMPAIGN ID
    // ========================================================

    const {
      id,
    } =
      await context.params;

    const campaignId =
      Number(
        id
      );

    if (
      !Number.isInteger(
        campaignId
      ) ||
      campaignId <=
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid campaign ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. CAMPAIGN
    //
    // IMPORTANT:
    // brandId condition prevents one Brand from accessing
    // another Brand's campaign analytics by changing the URL.
    // ========================================================

    const campaign =
      await prisma.campaign.findFirst({
        where: {
          id:
            campaignId,

          brandId:
            brandProfile.id,
        },

        select: {
          id:
            true,

          campaignCode:
            true,

          productName:
            true,

          status:
            true,

          updatedAt:
            true,

          brand: {
            select: {
              companyName:
                true,
            },
          },

          campaignQuestions: {
            orderBy: {
              questionOrder:
                "asc",
            },

            select: {
              id:
                true,

              questionText:
                true,

              questionType:
                true,

              source:
                true,

              question: {
                select: {
                  options: {
                    orderBy: {
                      optionOrder:
                        "asc",
                    },

                    select: {
                      optionText:
                        true,

                      optionOrder:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign not found or you do not have access to it.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      campaign.status !==
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Analytics are available only for completed campaigns.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // 5. COMPLETED TESTERS + LATEST APPROVED TASK 3
    // ========================================================

    const testerCampaigns =
      await prisma.testerCampaign.findMany({
        where: {
          campaignId,

          status:
            "COMPLETED",
        },

        select: {
          id:
            true,

          testerProfile: {
            select: {
              gender:
                true,

              ageCategory:
                true,

              city:
                true,
            },
          },

          tasks: {
            where: {
              taskNumber:
                3,
            },

            take:
              1,

            select: {
              id:
                true,

              submissions: {
                where: {
                  status:
                    "APPROVED",
                },

                orderBy: {
                  submittedAt:
                    "desc",
                },

                take:
                  1,

                select: {
                  id:
                    true,

                  task3ReviewDetail: {
                    select: {
                      rating:
                        true,

                      answers: {
                        select: {
                          answerText:
                            true,

                          campaignQuestion: {
                            select: {
                              id:
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
      });

    // ========================================================
    // 6. DEMOGRAPHICS
    // ========================================================

    const completedTesters =
      testerCampaigns.length;

    const genderCounter:
      Counter =
      new Map();

    const ageCounter:
      Counter =
      new Map();

    const cityCounter:
      Counter =
      new Map();

    for (
      const testerCampaign
      of testerCampaigns
    ) {
      const profile =
        testerCampaign
          .testerProfile;

      increment(
        genderCounter,
        profile.gender ||
          "Unknown"
      );

      increment(
        ageCounter,
        formatAgeCategory(
          profile.ageCategory
        )
      );

      increment(
        cityCounter,
        profile.city?.trim() ||
          "Unknown"
      );
    }

    // ========================================================
    // 7. RATINGS + QUESTIONNAIRE ANSWERS
    // ========================================================

    const ratings:
      number[] =
      [];

    const questionAnswers =
      new Map<
        number,
        string[][]
      >();

    for (
      const testerCampaign
      of testerCampaigns
    ) {
      const review =
        testerCampaign
          .tasks[0]
          ?.submissions[0]
          ?.task3ReviewDetail;

      if (!review) {
        continue;
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

      for (
        const answer
        of review.answers
      ) {
        const questionId =
          answer
            .campaignQuestion
            .id;

        const values =
          parseAnswer(
            answer.answerText
          );

        const existing =
          questionAnswers.get(
            questionId
          ) ??
          [];

        existing.push(
          values
        );

        questionAnswers.set(
          questionId,
          existing
        );
      }
    }

    // ========================================================
    // 8. STAR RATING
    // ========================================================

    const ratingCounts =
      new Map<
        number,
        number
      >([
        [
          1,
          0,
        ],
        [
          2,
          0,
        ],
        [
          3,
          0,
        ],
        [
          4,
          0,
        ],
        [
          5,
          0,
        ],
      ]);

    for (
      const rating
      of ratings
    ) {
      ratingCounts.set(
        rating,
        (
          ratingCounts.get(
            rating
          ) ??
          0
        ) +
          1
      );
    }

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

    const ratingDistribution =
      Array.from(
        ratingCounts.entries()
      ).map(
        (
          [
            rating,
            count,
          ]
        ) => ({
          rating,
          count,

          percentage:
            ratings.length >
            0
              ? Number(
                  (
                    (
                      count /
                      ratings.length
                    ) *
                    100
                  ).toFixed(
                    1
                  )
                )
              : 0,
        })
      );

    // ========================================================
    // 9. QUESTION ANALYTICS
    // ========================================================

    const formattedQuestions =
      campaign
        .campaignQuestions
        .map(
          (
            question
          ) => {
            const respondentAnswers =
              questionAnswers.get(
                question.id
              ) ??
              [];

            const responseCount =
              respondentAnswers
                .filter(
                  (
                    values
                  ) =>
                    values.length >
                    0
                )
                .length;

            const optionCounter:
              Counter =
              new Map();

            const configuredOptions =
              question
                .question
                ?.options
                ?.map(
                  (
                    option
                  ) =>
                    option.optionText
                ) ??
              [];

            for (
              const option
              of configuredOptions
            ) {
              optionCounter.set(
                option,
                0
              );
            }

            for (
              const values
              of respondentAnswers
            ) {
              for (
                const value
                of values
              ) {
                optionCounter.set(
                  value,
                  (
                    optionCounter.get(
                      value
                    ) ??
                    0
                  ) +
                    1
                );
              }
            }

            const options =
              Array.from(
                optionCounter.entries()
              ).map(
                (
                  [
                    label,
                    count,
                  ]
                ) => ({
                  label,
                  count,

                  percentage:
                    responseCount >
                    0
                      ? Number(
                          (
                            (
                              count /
                              responseCount
                            ) *
                            100
                          ).toFixed(
                            1
                          )
                        )
                      : 0,
                })
              );

            return {
              id:
                question.id,

              questionText:
                question.questionText,

              questionType:
                question.questionType,

              source:
                question.source,

              responseCount,

              options,
            };
          }
        );

    // ========================================================
    // 10. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          campaign: {
            id:
              campaign.id,

            campaignCode:
              campaign.campaignCode,

            productName:
              campaign.productName,

            brandName:
              campaign.brand
                .companyName,

            status:
              campaign.status,

            completedAt:
              campaign.updatedAt.toISOString(),
          },

          summary: {
            completedTesters,

            ratedTesters:
              ratings.length,

            averageRating,
          },

          rating: {
            average:
              averageRating,

            totalRatings:
              ratings.length,

            distribution:
              ratingDistribution,
          },

          gender:
            distribution(
              genderCounter,
              completedTesters
            ),

          ageGroups:
            distribution(
              ageCounter,
              completedTesters
            ),

          topCities:
            distribution(
              cityCounter,
              completedTesters,
              true
            ).slice(
              0,
              8
            ),

          fixedQuestions:
            formattedQuestions.filter(
              (
                question
              ) =>
                question.source ===
                "FIXED"
            ),

          brandQuestions:
            formattedQuestions.filter(
              (
                question
              ) =>
                question.source !==
                "FIXED"
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET BRAND CAMPAIGN ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load campaign analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
