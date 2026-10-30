import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    if (currentUser.role !== "TESTER") {
      return NextResponse.json({ success: false, message: "Access denied. Tester only." }, { status: 403 });
    }

    const testerProfile = await prisma.testerProfile.findUnique({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!testerProfile) {
      return NextResponse.json({ success: false, message: "Tester profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const requestedLimit = Number(searchParams.get("limit") ?? "10");
    const limit = [5, 10, 20].includes(requestedLimit) ? requestedLimit : 10;

    const where = { testerProfileId: testerProfile.id, status: "SENT" as const };

    const [total, invitations] = await Promise.all([
      prisma.campaignInvitation.count({ where }),
      prisma.campaignInvitation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          invitedAt: true,
          readAt: true,
          campaign: {
            select: {
              id: true,
              campaignCode: true,
              productName: true,
              productImage: true,
              earningAmount: true,
              currency: true,
              availableSlots: true,
              status: true,
              startDate: true,
              endDate: true,
              brand: {
                select: {
                  companyName: true,
                  category: { select: { name: true } },
                },
              },
              testerApplications: {
                where: { testerProfileId: testerProfile.id },
                select: { id: true, status: true, appliedAt: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { invitedAt: "desc" },
      }),
    ]);

    const unreadIds = invitations.filter((item) => !item.readAt).map((item) => item.id);
    if (unreadIds.length > 0) {
      await prisma.campaignInvitation.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      });
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: invitations.map((invitation) => ({
        invitationId: invitation.id,
        invitedAt: invitation.invitedAt,
        campaign: {
          id: invitation.campaign.id,
          campaignCode: invitation.campaign.campaignCode,
          productName: invitation.campaign.productName,
          productImage: invitation.campaign.productImage,
          earningAmount: Number(invitation.campaign.earningAmount),
          currency: invitation.campaign.currency,
          availableSlots: invitation.campaign.availableSlots,
          status: invitation.campaign.status,
          startDate: invitation.campaign.startDate,
          endDate: invitation.campaign.endDate,
          brandName: invitation.campaign.brand.companyName,
          category: invitation.campaign.brand.category?.name ?? null,
        },
        application: invitation.campaign.testerApplications[0] ?? null,
      })),
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
    console.error("GET TESTER INVITATIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to load invitations." },
      { status: 500 }
    );
  }
}
