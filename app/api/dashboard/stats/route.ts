
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Asia/Tehran";
const DAY_MS = 24 * 60 * 60 * 1000;

function getDateInTimeZone(date: Date, timeZone = TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function dateToUtc(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function addDays(dateString: string, amount: number): string {
  const date = dateToUtc(dateString);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function getDayOfWeek(dateString: string): number {
  return dateToUtc(dateString).getUTCDay();
}

function isHabitScheduled(recurrence: unknown, dayOfWeek: number): boolean {
  if (!recurrence || typeof recurrence !== "object") return false;

  const days = (recurrence as { days?: unknown }).days;

  return (
    Array.isArray(days) &&
    days.some((day) => typeof day === "number" && day === dayOfWeek)
  );
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getDateInTimeZone(new Date());
    const weekStart = addDays(today, -6);
    const monthStart = addDays(today, -29);

    const [
      todayTasks,
      weeklyTasks,
      activeHabits,
      monthlyEntries,
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          scheduledDate: dateToUtc(today),
        },
        select: {
          isCompleted: true,
        },
      }),

      prisma.task.findMany({
        where: {
          userId: user.id,
          scheduledDate: {
            gte: dateToUtc(weekStart),
            lte: dateToUtc(today),
          },
        },
        select: {
          scheduledDate: true,
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
          title: true,
          recurrence: true,
        },
      }),

      prisma.habitEntry.findMany({
        where: {
          userId: user.id,
          date: {
            gte: dateToUtc(monthStart),
            lte: dateToUtc(today),
          },
        },
        select: {
          habitId: true,
          date: true,
          isCompleted: true,
        },
      }),
    ]);

    const todayHabitIds = activeHabits
      .filter((habit) =>
        isHabitScheduled(habit.recurrence, getDayOfWeek(today)),
      )
      .map((habit) => habit.id);

    const todayEntries = await prisma.habitEntry.findMany({
      where: {
        userId: user.id,
        habitId: { in: todayHabitIds },
        date: dateToUtc(today),
      },
      select: {
        habitId: true,
        isCompleted: true,
      },
    });

    const todayEntryMap = new Map(
      todayEntries.map((entry) => [entry.habitId, entry.isCompleted]),
    );

    const completedTasks = todayTasks.filter(
      (task) => task.isCompleted,
    ).length;

    const completedHabits = todayHabitIds.filter(
      (id) => todayEntryMap.get(id) === true,
    ).length;

    const total = todayTasks.length + todayHabitIds.length;
    const completed = completedTasks + completedHabits;

    const overview = {
      total,
      completed,
      pending: total - completed,
      missed: 0,
      completionRate:
        total === 0 ? 0 : Math.round((completed / total) * 100),
      habitCompletionRate:
        todayHabitIds.length === 0
          ? 0
          : Math.round((completedHabits / todayHabitIds.length) * 100),
    };

    const weeklyProductivity = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const tasksForDay = weeklyTasks.filter(
        (task) =>
          getDateInTimeZone(task.scheduledDate, "UTC") === date,
      );

      const scheduledHabits = activeHabits.filter((habit) =>
        isHabitScheduled(habit.recurrence, getDayOfWeek(date)),
      );

      const completedHabitsForDay = monthlyEntries.filter(
        (entry) =>
          getDateInTimeZone(entry.date, "UTC") === date &&
          entry.isCompleted &&
          scheduledHabits.some((habit) => habit.id === entry.habitId),
      ).length;

      const totalForDay = tasksForDay.length + scheduledHabits.length;
      const completedForDay =
        tasksForDay.filter((task) => task.isCompleted).length +
        completedHabitsForDay;

      return {
        date,
        rate:
          totalForDay === 0
            ? 0
            : Math.round((completedForDay / totalForDay) * 100),
      };
    });

    const habitPerformance = activeHabits.map((habit) => {
      const scheduledDates = Array.from({ length: 30 }, (_, index) =>
        addDays(monthStart, index),
      ).filter((date) =>
        isHabitScheduled(habit.recurrence, getDayOfWeek(date)),
      );

      const completedDates = new Set(
        monthlyEntries
          .filter(
            (entry) =>
              entry.habitId === habit.id &&
              entry.isCompleted,
          )
          .map((entry) => getDateInTimeZone(entry.date, "UTC")),
      );

      const completedCount = scheduledDates.filter((date) =>
        completedDates.has(date),
      ).length;

      return {
        id: habit.id,
        title: habit.title,
        rate:
          scheduledDates.length === 0
            ? 0
            : Math.round((completedCount / scheduledDates.length) * 100),
      };
    });

    return NextResponse.json({
      today,
      timeZone: TIME_ZONE,
      overview,
      weeklyProductivity,
      habitPerformance,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
