
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const dateString = request.nextUrl.searchParams.get("date");
    const date = parseDate(dateString);

    if (!date) {
      return NextResponse.json(
        { error: "Provide a valid date in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const entry = await prisma.habitEntry.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date,
        },
      },
    });

    return NextResponse.json({
      date: dateString,
      isCompleted: entry?.isCompleted ?? false,
      completedAt: entry?.completedAt ?? null,
    });
  } catch (error) {
    console.error("GET habit logs:", error);

    return NextResponse.json(
      { error: "Failed to fetch habit entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const date = parseDate(body.date);

    if (!date) {
      return NextResponse.json(
        { error: "Provide a valid date in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (typeof body.isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "isCompleted must be a boolean" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Active habit not found" },
        { status: 404 }
      );
    }

    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId: id,
          date,
        },
      },
      create: {
        habitId: id,
        userId: user.id,
        date,
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted ? new Date() : null,
      },
      update: {
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PUT habit logs:", error);

    return NextResponse.json(
      { error: "Failed to update habit entry" },
      { status: 500 }
    );
  }
}
