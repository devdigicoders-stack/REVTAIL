import {
  NextResponse,
} from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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
      currentUser.role !== "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access live campaigns.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 2. LOAD TESTER PROFILE
    // ============================================================

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
          fullName: true,

          gender: true,

          city: true,
          state: true,

          approvalStatus: true,

          interests: {
            select: {
              interestId: true,
            },
          },
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

    // ============================================================
    // 3. TESTER MUST BE APPROVED
    // ============================================================

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
    // 4. LOCATION REQUIRED FOR ELIGIBILITY
    // ============================================================

    if (
      !testerProfile.city ||
      !testerProfile.state
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please complete your city and state before viewing campaigns.",
        },
        {
          status: 400,
        }
      );
    }

    const testerInterestIds =
      testerProfile.interests.map(
        (item) =>
          item.interestId
      );

    if (
      testerInterestIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: true,

          message:
            "No live campaigns match your interests yet.",

          data: {
            tester: {
              id:
                testerProfile.id,

              fullName:
                testerProfile.fullName,

              city:
                testerProfile.city,

              state:
                testerProfile.state,

              interestIds:
                testerInterestIds,
            },

            totalCampaigns:
              0,

            campaigns:
              [],
          },
        },
        {
          status: 200,
        }
      );
    }

    // Campaign start/end dates are calendar dates in India.
    // Compare against the full current IST day rather than the
    // current timestamp, so a campaign starting today is visible
    // throughout today (including before 05:30 IST if the date
    // was saved at midnight UTC).
    const dateParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateValue = (type: "year" | "month" | "day") =>
      Number(dateParts.find((part) => part.type === type)?.value);

    const year = dateValue("year");
    const month = dateValue("month");
    const day = dateValue("day");

    // Midnight in India = previous day's 18:30 UTC.
    const startOfTodayIST = new Date(
      Date.UTC(year, month - 1, day) - 330 * 60 * 1000
    );
    const endOfTodayIST = new Date(
      startOfTodayIST.getTime() + 24 * 60 * 60 * 1000 - 1
    );

    // Normalize both saved targeting values and the tester's
    // city/state. This handles "Any", "ANY", and surrounding spaces.
    const matchesLocation = (
      target: string | null | undefined,
      testerValue: string
    ) => {
      const normalizedTarget = target?.trim().toLowerCase();
      return (
        normalizedTarget === "any" ||
        normalizedTarget === testerValue.trim().toLowerCase()
      );
    };

    // Campaign.targetGender is an enum, while tester.gender
    // may also be OTHER. ANY must match every tester.
    const matchesGender = (target: string, testerGender: string | null) =>
      target === "ANY" || target === testerGender;

    // ============================================================
    // 5. LOAD ELIGIBLE LIVE CAMPAIGNS
    // ============================================================

    const campaigns =
      await prisma.campaign.findMany({
        where: {
          status: "LIVE",

          availableSlots: {
            gt: 0,
          },

          startDate: {
            lte: endOfTodayIST,
          },

          endDate: {
            gte: startOfTodayIST,
          },

          brand: {
            categoryId: {
              in:
                testerInterestIds,
            },
          },

        },

        select: {
          id: true,

          productName: true,
          productImage: true,
          productDescription: true,
          productLink: true,

          earningAmount: true,

          totalSlots: true,
          filledSlots: true,
          availableSlots: true,

          startDate: true,
          endDate: true,

          task4Required: true,

          targetState: true,
          targetCity: true,
          targetGender: true,

          brand: {
            select: {
              id: true,
              companyName: true,
              categoryId: true,

              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          testerApplications: {
            where: {
              testerProfileId:
                testerProfile.id,
            },

            select: {
              id: true,
              status: true,
              appliedAt: true,
            },

            take: 1,
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    // Compare locations after trimming and ignoring case.
    // This avoids provider-specific Prisma case-insensitive filters
    // and correctly handles database values such as "Any".
    const eligibleCampaigns = campaigns.filter((campaign) =>
      matchesLocation(campaign.targetState, testerProfile.state!) &&
      matchesLocation(campaign.targetCity, testerProfile.city!) &&
      matchesGender(campaign.targetGender, testerProfile.gender)
    );

    // ============================================================
    // 6. FORMAT RESPONSE
    // ============================================================

    const formattedCampaigns =
      eligibleCampaigns.map((campaign) => {
        const application =
          campaign
            .testerApplications[0] ??
          null;

        return {
          id:
            campaign.id,

          productName:
            campaign.productName,

          productImage:
            campaign.productImage,

          productDescription:
            campaign.productDescription,

          productLink:
            campaign.productLink,

          earningAmount:
            campaign.earningAmount,

          totalSlots:
            campaign.totalSlots,

          filledSlots:
            campaign.filledSlots,

          availableSlots:
            campaign.availableSlots,

          startDate:
            campaign.startDate,

          endDate:
            campaign.endDate,

          task4Required:
            campaign.task4Required,

          brand: {
            id:
              campaign.brand?.id ??
              null,

            companyName:
              campaign.brand
                ?.companyName ??
              null,

            categoryId:
              campaign.brand
                ?.categoryId ??
              null,

            category:
              campaign.brand
                ?.category
                ? {
                    id:
                      campaign.brand
                        .category
                        .id,

                    name:
                      campaign.brand
                        .category
                        .name,
                  }
                : null,
          },

          application:
            application
              ? {
                  id:
                    application.id,

                  status:
                    application.status,

                  appliedAt:
                    application.appliedAt,
                }
              : null,

          canApply:
            application === null,
        };
      });

    // ============================================================
    // 7. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Live campaigns fetched successfully.",

        data: {
          tester: {
            id:
              testerProfile.id,

            fullName:
              testerProfile.fullName,

            city:
              testerProfile.city,

            state:
              testerProfile.state,

            interestIds:
              testerInterestIds,
          },

          totalCampaigns:
            formattedCampaigns.length,

          campaigns:
            formattedCampaigns,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get live tester campaigns error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching live campaigns.",
      },
      {
        status: 500,
      }
    );
  }
}