//Master interests route handler
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // moongoose - mongodb, prisma - mysql 
  try {
    const interests = await prisma.interest.findMany({
      where: {
        isActive: true,
      },

      select: {
        id: true,
        name: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Interests fetched successfully.",
        data: interests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get interests error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching interests.",
      },
      { status: 500 }
    );
  }
}