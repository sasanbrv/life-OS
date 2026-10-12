
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    const date = dateParam ? parseDate(dateParam) : new Date(
      new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"
    );

    if (!date) {
      return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
    }

    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      myDayEntries,
      todayHabits,
      activeGoals,
      upcomingTasks,
      recentTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: { userId: user.id },
      }),

      prisma.task.count({
        where: {
          userId: user.id,
          status: "DONE",
        },
      }),

      prisma.task.count({
        where: {
          userId: user.id,
          status: "IN_PROGRESS",
        },
      }),

      prisma.task.count({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: { lt: date },
        },
      }),

      prisma.myDayEntry.findMany({
        where: {
          userId: user.id,
          date,
        },
        orderBy: { createdAt: "asc" },
        include: {
          task: {
            include: {
              category: true,
              subtasks: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      }),

      prisma.habit.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
        include: {
          entries: {
            where: {
              userId: user.id,
              date,
            },
          },
        },
      }),

      prisma.goal.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        orderBy: [
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        take: 5,
        include: {
          tasks: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      }),

      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: {
            gte: date,
            lt: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { category: true },
      }),

      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { category: true },
      }),
    ]);

    const completedTodayHabits = todayHabits.filter((habit) =>
      habit.entries.some((entry) => entry.isCompleted)
    ).length;

    const completedMyDayTasks = myDayEntries.filter(
      (entry) => entry.task.status === "DONE"
    ).length;

    return Response.json({
      date: date.toISOString().slice(0, 10),

      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completedTodayHabits,
        totalTodayHabits: todayHabits.length,
        completedMyDayTasks,
        totalMyDayTasks: myDayEntries.length,
      },

      myDay: myDayEntries.map((entry) => entry.task),

      habits: todayHabits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        description: habit.description,
        recurrence: habit.recurrence,
        isCompleted: habit.entries.some(
          (entry) => entry.isCompleted
        ),
      })),

      goals: activeGoals,

      upcomingTasks,

      recentTasks,
    });
  } catch (error) {
    console.error("Get dashboard failed:", error);
    return errorResponse("Failed to retrieve dashboard data.", 500);
  }
}
