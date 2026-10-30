import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";

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
// GET TESTER ANALYTICS EXCEL
//
// ADMIN ONLY
//
// GET /api/admin/analytics/testers/export
// Uses the same filters as the analytics page, but does not
// apply pagination.
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
            "Excel export is available to Admin only.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 2. FILTERS
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
    // 3. FIXED QUESTIONS
    //
    // Each fixed question becomes one Excel column.
    // ========================================================

    const fixedQuestions =
      await prisma.question.findMany({
        where: {
          source:
            "FIXED",
        },

        select: {
          id: true,

          questionText:
            true,
        },

        orderBy: {
          id: "asc",
        },
      });

    // ========================================================
    // 4. BASIC TESTER FILTER
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
    // 5. LOAD TESTERS
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

          instagramId: true,

          approvalStatus: true,

          user: {
            select: {
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
                  submissions: {
                    where: {
                      status:
                        "APPROVED",
                    },

                    select: {
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
                                  questionId:
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
    // 6. BUILD EXCEL ROWS
    // ========================================================

    const rows:
      Record<
        string,
        string | number
      >[] =
      [];

    for (
      const tester
      of testers
    ) {
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
        continue;
      }

      const ratings:
        number[] =
        [];

      const fixedAnswers =
        new Map<
          number,
          string[]
        >();

      for (
        const testerCampaign
        of campaigns
      ) {
        for (
          const task
          of testerCampaign.tasks
        ) {
          for (
            const submission
            of task.submissions
          ) {
            const review =
              submission
                .task3ReviewDetail;

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
              const question =
                answer
                  .campaignQuestion;

              if (
                question.source !==
                  "FIXED" ||
                !question.questionId
              ) {
                continue;
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
          }
        }
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

      // ------------------------------------------------------
      // RATING FILTER
      // ------------------------------------------------------

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
        continue;
      }

      // ------------------------------------------------------
      // FIXED QUESTION FILTER
      // ------------------------------------------------------

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
          continue;
        }

        if (
          fixedAnswer &&
          !answers.some(
            (
              answer
            ) =>
              answer
                .toLowerCase()
                .includes(
                  fixedAnswer
                )
          )
        ) {
          continue;
        }
      }

      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

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
              (
                item
              ) =>
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
          continue;
        }
      }

      const row:
        Record<
          string,
          string | number
        > =
        {
          "Tester ID":
            tester.id,

          Name:
            tester.fullName,

          Email:
            tester.user.email ??
            "",

          Mobile:
            tester.user.mobile ??
            "",

          Instagram:
            tester.instagramId ??
            "",

          Gender:
            tester.gender,

          Age:
            formatAgeCategory(
              tester.ageCategory
            ),

          Interests:
            tester.interests
              .map(
                (
                  item
                ) =>
                  item.interest
                    .name
              )
              .join(", "),

          State:
            tester.state ??
            "",

          City:
            tester.city ??
            "",

          "PIN Code":
            tester.pinCode,

          "Approval Status":
            tester.approvalStatus,

          "Account Status":
            tester.user.status,

          "Average Rating":
            averageRating ??
            "",

          "Rating Count":
            ratings.length,

          "Campaign Count":
            campaigns.length,

          Brands:
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
            ].join(", "),
        };

      // ------------------------------------------------------
      // ONE EXCEL COLUMN PER FIXED QUESTION
      // ------------------------------------------------------

      fixedQuestions.forEach(
        (
          question
        ) => {
          row[
            question.questionText
          ] =
            [
              ...new Set(
                fixedAnswers.get(
                  question.id
                ) ?? []
              ),
            ].join(", ");
        }
      );

      rows.push(row);
    }

    // ========================================================
    // 7. CREATE XLSX
    // ========================================================

    const workbook =
      XLSX.utils.book_new();

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    // Basic useful column widths.
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 12 },
      { wch: 10 },
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 35 },
      ...fixedQuestions.map(
        () => ({
          wch: 35,
        })
      ),
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Tester Analytics"
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          type:
            "buffer",

          bookType:
            "xlsx",
        }
      );

    const filename =
      `tester-analytics-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

    return new NextResponse(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "ANALYTICS EXPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to export analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
