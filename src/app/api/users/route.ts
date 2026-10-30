import { NextRequest, NextResponse } from "next/server";
import  prisma from "@/lib/prisma";

// ==========================================
// GET: Fetch all users
// GET /api/users
// ==========================================
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully",
        data: users,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// POST: Create new user
// POST /api/users
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email,password,role } = body;

    // Basic validation
    if (!email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and role are required",
        },
        {
          status: 400,
        }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        {
          status: 409,
        }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        role,
        email,
        password, // Note: You should hash the password before storing it
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      {
        status: 500,
      }
    );
  }
}