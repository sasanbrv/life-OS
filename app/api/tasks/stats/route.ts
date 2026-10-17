
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const timeZone = "Asia/Tehran";
    const today = getDateInTimeZone(timeZone);

    const dateString =
      request.nextUrl.searchParams.get("date") ?? today;

    const date = parseDate(dateString);

    if (!date) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const [tasks, habits] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          scheduledDate: date,
        },
        select: {
          isCompleted: true,
        },
      }),

      prisma.habit.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        select: {
          id: true,
          recurrence: true,
          entries: {
            where: {
              userId: user.id,
              date,
            },
            select: {
              isCompleted: true,
            },
            take: 1,
          },
        },
      }),
    ]);

    // JavaScript day indexes: Sunday = 0, Saturday = 6.
    const dayOfWeek = new Date(
      `${dateString}T12:00:00.000Z`,
    ).getUTCDay();

    const dueHabits = habits.filter((habit) => {
      const recurrence = habit.recurrence as {
        days?: unknown;
      } | null;

      return (
        Array.isArray(recurrence?.days) &&
        recurrence.days.some(
          (day) =>
            typeof day === "number" &&
            day === dayOfWeek,
        )
      );
    });

    const completedTasks = tasks.filter(
      (task) => task.isCompleted,
    ).length;

    const completedHabits = dueHabits.filter(
      (habit) => habit.entries[0]?.isCompleted === true,
    ).length;

    // Each task and each scheduled habit counts once.
    const total = tasks.length + dueHabits.length;
    const completed = completedTasks + completedHabits;

    const missed =
      dateString < today ? total - completed : 0;

    const pending = total - completed - missed;

    const completionRate =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return NextResponse.json({
      date: dateString,
      today,
      timeZone,
      total,
      completed,
      missed,
      pending,
      completionRate,
      taskTotal: tasks.length,
      habitTotal: dueHabits.length,
      completedTasks,
      completedHabits,
    });
  } catch (error) {
    console.error("GET /api/tasks/stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch task statistics" },
      { status: 500 },
    );
  }
}
