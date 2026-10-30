import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  TargetGender,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    campaignId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    if (
      currentUser.role !==
      "TESTER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Only testers can access campaign details.",
        },
        { status: 403 }
      );
    }

    const {
      campaignId,
    } =
      await context.params;

    const parsedCampaignId =
      Number(
        campaignId
      );

    if (
      !Number.isInteger(
        parsedCampaignId
      ) ||
      parsedCampaignId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid campaign ID.",
        },
        { status: 400 }
      );
    }

    const testerProfile =
      await prisma.testerProfile.findUnique({
        where: {
          userId:
            currentUser.userId,
        },

        select: {
          id: true,
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
        { status: 404 }
      );
    }

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
        { status: 403 }
      );
    }

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
        { status: 400 }
      );
    }

    const campaign =
      await prisma.campaign.findUnique({
        where: {
          id:
            parsedCampaignId,
        },

        select: {
          id: true,
          campaignCode: true,
          productName: true,
          productImage: true,
          productDescription: true,
          productLink: true,
          earningAmount: true,
          currency: true,
          totalSlots: true,
          filledSlots: true,
          availableSlots: true,
          startDate: true,
          endDate: true,
          status: true,
          targetState: true,
          targetCity: true,
          targetGender: true,
          task4Required: true,

          images: {
            select: {
              id: true,
              imagePath: true,
              imageOrder: true,
            },

            orderBy: {
              imageOrder:
                "asc",
            },
          },

          brand: {
            select: {
              id: true,
              companyName: true,
              companyType: true,
              categoryId: true,
              website: true,

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
              reviewedAt: true,
              rejectionReason: true,

              testerCampaign: {
                select: {
                  id: true,
                  status: true,
                  currentTask: true,
                },
              },
            },

            orderBy: {
              appliedAt:
                "desc",
            },

            take: 1,
          },
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Campaign not found.",
        },
        { status: 404 }
      );
    }

    const now =
      new Date();

    // ============================================================
    // NULL-SAFE LIVE DATE CHECK
    // ============================================================

    if (
      campaign.status !==
        "LIVE" ||
      !campaign.startDate ||
      !campaign.endDate ||
      campaign.startDate >
        now ||
      campaign.endDate <
        now
    ) {
      // Only improve the error message; keep the live-date
      // validation and all campaign eligibility rules unchanged.
      const formatCampaignDate = (date: Date) =>
        new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(date);

      let message = "This campaign is currently unavailable.";

      if (!campaign.startDate || !campaign.endDate) {
        message =
          "Campaign dates are not configured. Please contact support.";
      } else if (campaign.startDate > now) {
        message = `This campaign starts on ${formatCampaignDate(
          campaign.startDate
        )}. Please check back then.`;
      } else if (campaign.endDate < now) {
        message = `This campaign ended on ${formatCampaignDate(
          campaign.endDate
        )}.`;
      } else if (campaign.status !== "LIVE") {
        message = "This campaign is currently unavailable.";
      }

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    const testerInterestIds =
      testerProfile.interests.map(
        (item) =>
          item.interestId
      );

    const categoryMatches =
      campaign.brand
        ?.categoryId != null &&
      testerInterestIds.includes(
        campaign.brand.categoryId
      );

    const targetState =
      campaign.targetState
        ?.trim()
        .toLowerCase();

    const targetCity =
      campaign.targetCity
        ?.trim()
        .toLowerCase();

    const testerState =
      testerProfile.state
        .trim()
        .toLowerCase();

    const testerCity =
      testerProfile.city
        .trim()
        .toLowerCase();

    const testerTargetGender:
      TargetGender | null =
      testerProfile.gender ===
        "MALE" ||
      testerProfile.gender ===
        "FEMALE"
        ? testerProfile.gender
        : null;

    const stateMatches =
      targetState ===
        "any" ||
      targetState ===
        testerState;

    const cityMatches =
      targetCity ===
        "any" ||
      targetCity ===
        testerCity;

    const genderMatches =
      campaign.targetGender ===
        "ANY" ||
      (
        testerTargetGender !==
          null &&
        campaign.targetGender ===
          testerTargetGender
      );

    // ============================================================
    // NULL-SAFE SLOT VALUE
    // ============================================================

    const availableSlots =
      campaign.availableSlots ??
      0;

    const slotsAvailable =
      availableSlots >
      0;

    const eligible =
      categoryMatches &&
      stateMatches &&
      cityMatches &&
      genderMatches &&
      slotsAvailable;

    if (!eligible) {
      const eligibilityReasons:
        string[] = [];

      if (!categoryMatches) {
        eligibilityReasons.push(
          "INTEREST_MISMATCH"
        );
      }

      if (!stateMatches) {
        eligibilityReasons.push(
          "STATE_MISMATCH"
        );
      }

      if (!cityMatches) {
        eligibilityReasons.push(
          "CITY_MISMATCH"
        );
      }

      if (!genderMatches) {
        eligibilityReasons.push(
          "GENDER_MISMATCH"
        );
      }

      if (!slotsAvailable) {
        eligibilityReasons.push(
          "NO_AVAILABLE_SLOTS"
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "You are not eligible for this campaign.",
          eligibilityReasons,
        },
        { status: 403 }
      );
    }

    const application =
      campaign
        .testerApplications[0] ??
      null;

    const steps = [
      {
        taskNumber: 1,
        title:
          "Buy Product",
        description:
          "Purchase the campaign product and submit order ID, purchase amount and proof.",
      },
      {
        taskNumber: 2,
        title:
          "Product Received",
        description:
          "Upload a photograph after receiving the product.",
      },
      {
        taskNumber: 3,
        title:
          "Write Review & Rating",
        description:
          "Submit your product review, rating and questionnaire answers.",
      },
    ];

    if (
      campaign.task4Required
    ) {
      steps.push({
        taskNumber: 4,
        title:
          "Copy/Paste Review",
        description:
          "Publish the approved review externally and submit the URL/proof.",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Campaign details fetched successfully.",

        data: {
          campaign: {
            id:
              campaign.id,

            campaignCode:
              campaign.campaignCode,

            productName:
              campaign.productName,

            productImage:
              campaign.productImage,

            productDescription:
              campaign.productDescription,

            productLink:
              campaign.productLink,

            earningAmount:
              Number(
                campaign.earningAmount
              ),

            currency:
              campaign.currency,

            status:
              campaign.status,

            totalSlots:
              campaign.totalSlots,

            filledSlots:
              campaign.filledSlots,

            availableSlots:
              availableSlots,

            slots: {
              total:
                campaign.totalSlots,

              filled:
                campaign.filledSlots,

              available:
                availableSlots,
            },

            startDate:
              campaign.startDate,

            endDate:
              campaign.endDate,

            task4Required:
              campaign.task4Required,

            images:
              campaign.images,

            brand: {
              id:
                campaign.brand
                  ?.id ??
                null,

              companyName:
                campaign.brand
                  ?.companyName ??
                null,

              companyType:
                campaign.brand
                  ?.companyType ??
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

              website:
                campaign.brand
                  ?.website ??
                null,
            },
          },

          steps,

          application:
            application
              ? {
                  id:
                    application.id,

                  status:
                    application.status,

                  appliedAt:
                    application.appliedAt,

                  reviewedAt:
                    application.reviewedAt,

                  rejectionReason:
                    application.rejectionReason,

                  testerCampaign:
                    application
                      .testerCampaign,
                }
              : null,

          canApply:
            application ===
              null &&
            availableSlots >
              0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get tester campaign detail error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching campaign details.",
      },
      { status: 500 }
    );
  }
}