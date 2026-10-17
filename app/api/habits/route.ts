
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("GET /api/habits:", error);

    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const recurrence = body.recurrence;

    if (!title || title.length > 120) {
      return NextResponse.json(
        { error: "Title must be between 1 and 120 characters" },
        { status: 400 }
      );
    }

    if (
      !recurrence ||
      typeof recurrence !== "object" ||
      Array.isArray(recurrence)
    ) {
      return NextResponse.json(
        { error: "Invalid recurrence" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        title,
        recurrence,
        userId: user.id,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits:", error);

    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
