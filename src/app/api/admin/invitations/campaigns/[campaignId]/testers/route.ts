import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = { params: Promise<{ campaignId: string }> };

function isAny(value: string | null | undefined) {
  if (!value) return true;
  return value.trim().toLowerCase() === "any";
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Access denied. Admin only." }, { status: 403 });
    }

    const { campaignId } = await context.params;
    const id = Number(campaignId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: "Invalid campaign ID." }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        campaignCode: true,
        productName: true,
        status: true,
        targetState: true,
        targetCity: true,
        targetGender: true,
        availableSlots: true,
        brand: {
          select: {
            id: true,
            companyName: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
    }
    if (campaign.status !== "LIVE") {
      return NextResponse.json({ success: false, message: "Only LIVE campaigns can send invitations." }, { status: 400 });
    }
    if (!campaign.brand.categoryId) {
      return NextResponse.json({ success: false, message: "This Brand does not have a category assigned." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const requestedLimit = Number(searchParams.get("limit") ?? "20");
    const limit = [10, 20, 50, 100].includes(requestedLimit) ? requestedLimit : 20;

    const where: any = {
      deletedAt: null,
      approvalStatus: "APPROVED",
      user: { status: "ACTIVE" },
      interests: { some: { interestId: campaign.brand.categoryId } },
    };

    if (!isAny(campaign.targetState)) where.state = campaign.targetState;
    if (!isAny(campaign.targetCity)) where.city = campaign.targetCity;
    if (campaign.targetGender !== "ANY") where.gender = campaign.targetGender;

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { pinCode: { contains: search } },
        { city: { contains: search } },
        { state: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { mobile: { contains: search } } },
      ];
    }

    const [total, testers] = await Promise.all([
      prisma.testerProfile.count({ where }),
      prisma.testerProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          gender: true,
          ageCategory: true,
          pinCode: true,
          city: true,
          state: true,
          profileImage: true,
          user: { select: { email: true, mobile: true } },
          interests: {
            where: { interest: { isActive: true } },
            select: { interest: { select: { id: true, name: true } } },
            orderBy: { interest: { name: "asc" } },
          },
          campaignApplications: {
            where: { campaignId: id },
            select: { id: true, status: true },
            take: 1,
          },
          campaignInvitations: {
            where: { campaignId: id, status: "SENT" },
            select: { id: true, invitedAt: true },
            take: 1,
          },
        },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          campaignCode: campaign.campaignCode,
          productName: campaign.productName,
          targetState: campaign.targetState,
          targetCity: campaign.targetCity,
          targetGender: campaign.targetGender,
          availableSlots: campaign.availableSlots,
          brand: {
            id: campaign.brand.id,
            companyName: campaign.brand.companyName,
            categoryId: campaign.brand.categoryId,
            categoryName: campaign.brand.category?.name ?? null,
          },
        },
        testers: testers.map((tester) => ({
          id: tester.id,
          fullName: tester.fullName,
          gender: tester.gender,
          ageCategory: tester.ageCategory,
          pinCode: tester.pinCode,
          city: tester.city,
          state: tester.state,
          profileImage: tester.profileImage,
          email: tester.user.email,
          mobile: tester.user.mobile,
          interests: tester.interests.map((item) => ({
            id: item.interest.id,
            name: item.interest.name,
          })),
          application: tester.campaignApplications[0] ?? null,
          invitation: tester.campaignInvitations[0] ?? null,
          canInvite:
            tester.campaignApplications.length === 0 &&
            tester.campaignInvitations.length === 0,
        })),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET INVITATION TESTERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to load eligible testers." },
      { status: 500 }
    );
  }
}
