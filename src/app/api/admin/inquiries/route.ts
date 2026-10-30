import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const status = searchParams.get("status") || "ALL";
    const q = searchParams.get("q")?.trim() || "";

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { subject: { contains: q } },
        { message: { contains: q } },
      ];
    }

    const [inquiries, total, newCount, inProgressCount, resolvedCount, totalAll] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.contactInquiry.count({ where: { status: "IN_PROGRESS" } }),
      prisma.contactInquiry.count({ where: { status: "RESOLVED" } }),
      prisma.contactInquiry.count(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary: {
        total: totalAll,
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching admin inquiries:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ success: false, message: "Inquiry ID is required." }, { status: 400 });
    }

    const validStatuses = ["NEW", "IN_PROGRESS", "RESOLVED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status value." }, { status: 400 });
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error: unknown) {
    console.error("Error updating inquiry status:", error);
    return NextResponse.json({ success: false, message: "Failed to update inquiry." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Valid Inquiry ID is required." }, { status: 400 });
    }

    await prisma.contactInquiry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (error: unknown) {
    console.error("Error deleting inquiry:", error);
    return NextResponse.json({ success: false, message: "Failed to delete inquiry." }, { status: 500 });
  }
}

