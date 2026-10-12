
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

    if (!dateParam) {
      return errorResponse("A date is required (YYYY-MM-DD).", 400);
    }

    const date = parseDate(dateParam);

    if (!date) {
      return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
    }

    const entries = await prisma.myDayEntry.findMany({
      where: {
        userId: user.id,
        date,
      },
      orderBy: {
        createdAt: "asc",
      },
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
    });

    return Response.json({
      date: dateParam,
      entries,
      tasks: entries.map((entry) => entry.task),
    });
  } catch (error) {
    console.error("Get My Day failed:", error);
    return errorResponse("Failed to retrieve My Day tasks.", 500);
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
      typeof data.taskId !== "string" ||
      !data.taskId.trim()
    ) {
      return errorResponse("Task ID is required.", 400);
    }

    if (typeof data.date !== "string") {
      return errorResponse("Date is required (YYYY-MM-DD).", 400);
    }

    const date = parseDate(data.date);

    if (!date) {
      return errorResponse("Invalid date. Use YYYY-MM-DD.", 400);
    }

    const taskId = data.taskId.trim();

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!task) {
      return errorResponse("Task not found.", 404);
    }

    const entry = await prisma.myDayEntry.upsert({
      where: {
        userId_taskId_date: {
          userId: user.id,
          taskId,
          date,
        },
      },
      create: {
        userId: user.id,
        taskId,
        date,
      },
      update: {},
      include: {
        task: true,
      },
    });

    return Response.json(
      {
        message: "Task added to My Day.",
        entry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add My Day task failed:", error);
    return errorResponse("Failed to add task to My Day.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const params = request.nextUrl.searchParams;
    const taskId = params.get("taskId");
    const dateParam = params.get("date");

    if (!taskId) {
      return errorResponse("Task ID is required.", 400);
    }

    const date = parseDate(dateParam);

    if (!date) {
      return errorResponse("A valid date is required (YYYY-MM-DD).", 400);
    }

    const result = await prisma.myDayEntry.deleteMany({
      where: {
        userId: user.id,
        taskId,
        date,
      },
    });

    if (result.count === 0) {
      return errorResponse("My Day entry not found.", 404);
    }

    return Response.json({
      message: "Task removed from My Day.",
    });
  } catch (error) {
    console.error("Remove My Day task failed:", error);
    return errorResponse("Failed to remove task from My Day.", 500);
  }
}
