import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid name (at least 2 characters)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Please provide a subject (at least 2 characters)." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Please provide a message (at least 5 characters)." },
        { status: 400 }
      );
    }

    const newInquiry = await prisma.contactInquiry.create({
      data: {
        name: name.trim().slice(0, 191),
        email: email.trim().toLowerCase().slice(0, 191),
        subject: subject.trim().slice(0, 191),
        message: message.trim(),
        status: "NEW",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your message has been submitted successfully.",
        data: { id: newInquiry.id },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error submitting contact inquiry:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong while submitting your message. Please try again later." },
      { status: 500 }
    );
  }
}

