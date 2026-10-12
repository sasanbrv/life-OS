
import { NextRequest } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function isValidRecurrence(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const recurrence = value as Record<string, unknown>;

  if (recurrence.frequency === "DAILY") {
    return true;
  }

  if (recurrence.frequency === "WEEKLY") {
    return (
      Array.isArray(recurrence.daysOfWeek) &&
      recurrence.daysOfWeek.length > 0 &&
      recurrence.daysOfWeek.every(
        (day) =>
          Number.isInteger(day) &&
          typeof day === "number" &&
          day >= 0 &&
          day <= 6
      ) &&
      new Set(recurrence.daysOfWeek).size ===
        recurrence.daysOfWeek.length
    );
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const date = request.nextUrl.searchParams.get("date");
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    let parsedDate: Date | undefined;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
      }

      parsedDate = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      ) {
        return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
      }
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        entries: {
          where: {
            userId: user.id,
            ...(parsedDate ? { date: parsedDate } : {}),
          },
          orderBy: { date: "desc" },
        },
      },
    });

    return Response.json({ habits });
  } catch (error) {
    console.error("Get habits failed:", error);
    return errorResponse("Failed to retrieve habits.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

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

    if (
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.trim().length > 150
    ) {
      return errorResponse(
        "Title is required and must be at most 150 characters.",
        400
      );
    }

    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string"
    ) {
      return errorResponse("Description must be a string.", 400);
    }

    const recurrence =
      data.recurrence ?? { frequency: "DAILY" };

    if (!isValidRecurrence(recurrence)) {
      return errorResponse(
        "Recurrence must be DAILY or WEEKLY with valid daysOfWeek (0-6).",
        400
      );
    }

    const habit = await prisma.habit.create({
      data: {
        title: data.title.trim(),
        description:
          typeof data.description === "string"
            ? data.description.trim() || null
            : null,
        recurrence: recurrence as Prisma.InputJsonValue,
        userId: user.id,
      },
      include: {
        entries: true,
      },
    });

    return Response.json(
      { message: "Habit created successfully.", habit },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create habit failed:", error);
    return errorResponse("Failed to create habit.", 500);
  }
}
