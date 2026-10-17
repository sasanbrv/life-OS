
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

function getDateInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}



export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const view = params.get("view") ?? "day";
    const dateString = params.get("date");

    if (!["day", "missed", "upcoming", "completed"].includes(view)) {
      return NextResponse.json({ error: "Invalid view" }, { status: 400 });
    }

    const timeZone = "Asia/Tehran";
    const today = getDateInTimeZone(timeZone);
    const selectedDate = dateString ? parseDate(dateString) : parseDate(today);

    if (!selectedDate) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const where = {
      userId: user.id,
      ...(view === "day"
        ? {
            isCompleted: false,
            scheduledDate: { equals: selectedDate },
          }
        : {}),
      ...(view === "missed"
        ? {
            isCompleted: false,
            scheduledDate: { lt: parseDate(today)! },
          }
        : {}),
      ...(view === "upcoming"
        ? {
            isCompleted: false,
            scheduledDate: { gt: parseDate(today)! },
          }
        : {}),
      ...(view === "completed"
        ? {
            isCompleted: true,
            ...(dateString
              ? { scheduledDate: { equals: selectedDate } }
              : {}),
          }
        : {}),
    };

    const tasks = await prisma.task.findMany({
  where,
  orderBy: [
    { scheduledDate: "asc" },
    { startTime: { sort: "asc", nulls: "last" } },
    { createdAt: "asc" },
  ],
});

    return NextResponse.json({ tasks, today, timeZone });
  } catch (error) {
    console.error("GET /api/tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const scheduledDate = parseDate(body.scheduledDate);

    const startTime =
      typeof body.startTime === "string" && body.startTime.trim()
        ? body.startTime.trim()
        : null;

    const endTime =
      typeof body.endTime === "string" && body.endTime.trim()
        ? body.endTime.trim()
        : null;

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "Title is required and must be at most 200 characters." },
        { status: 400 },
      );
    }

    if (!scheduledDate) {
      return NextResponse.json(
        { error: "A valid scheduledDate is required (YYYY-MM-DD)." },
        { status: 400 },
      );
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      return NextResponse.json(
        { error: "Both startTime and endTime must be provided together." },
        { status: 400 },
      );
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      (startTime && !timePattern.test(startTime)) ||
      (endTime && !timePattern.test(endTime))
    ) {
      return NextResponse.json(
        { error: "Times must use HH:mm format." },
        { status: 400 },
      );
    }

    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json(
        { error: "End time must be later than start time." },
        { status: 400 },
      );
    }

    const toDateTime = (time: string | null) => {
      if (!time) return null;

      const [hours, minutes] = time.split(":").map(Number);
      const result = new Date(scheduledDate);
      result.setUTCHours(hours, minutes, 0, 0);
      return result;
    };

    const task = await prisma.task.create({
      data: {
        title,
        scheduledDate,
        startTime: toDateTime(startTime),
        endTime: toDateTime(endTime),
        userId: user.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

