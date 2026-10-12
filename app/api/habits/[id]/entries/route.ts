
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function parseDate(value: unknown): Date | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
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

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id: habitId } = await context.params;

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: user.id },
      select: { id: true },
    });

    if (!habit) {
      return errorResponse("Habit not found.", 404);
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam ? parseDate(dateParam) : null;

    if (dateParam && !date) {
      return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
    }

    const entries = await prisma.habitEntry.findMany({
      where: {
        habitId,
        userId: user.id,
        ...(date ? { date } : {}),
      },
      orderBy: { date: "desc" },
    });

    return Response.json({ entries });
  } catch (error) {
    console.error("Get habit entries failed:", error);
    return errorResponse("Failed to retrieve habit entries.", 500);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id: habitId } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request data.", 400);
    }

    const data = body as Record<string, unknown>;
    const date = parseDate(data.date);

    if (!date) {
      return errorResponse("A valid date is required (YYYY-MM-DD).", 400);
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!habit) {
      return errorResponse("Active habit not found.", 404);
    }

    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
      create: {
        habitId,
        userId: user.id,
        date,
        isCompleted: true,
      },
      update: {
        isCompleted: true,
      },
    });

    return Response.json({
      message: "Habit marked as completed.",
      entry,
    });
  } catch (error) {
    console.error("Complete habit failed:", error);
    return errorResponse("Failed to complete habit.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id: habitId } = await context.params;
    const date = parseDate(
      request.nextUrl.searchParams.get("date")
    );

    if (!date) {
      return errorResponse("A valid date is required (YYYY-MM-DD).", 400);
    }

    const result = await prisma.habitEntry.deleteMany({
      where: {
        habitId,
        userId: user.id,
        date,
      },
    });

    if (result.count === 0) {
      return errorResponse("Habit entry not found.", 404);
    }

    return Response.json({
      message: "Habit completion removed.",
    });
  } catch (error) {
    console.error("Uncomplete habit failed:", error);
    return errorResponse("Failed to update habit completion.", 500);
  }
}
