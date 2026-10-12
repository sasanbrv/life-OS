
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id: goalId } = await context.params;

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: user.id,
      },
      include: {
        tasks: {
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
        },
      },
    });

    if (!goal) {
      return errorResponse("Goal not found.", 404);
    }

    return Response.json({
      goalId,
      tasks: goal.tasks.map((item) => item.task),
    });
  } catch (error) {
    console.error("Get goal tasks failed:", error);
    return errorResponse("Failed to retrieve goal tasks.", 500);
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

    const { id: goalId } = await context.params;

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

    const taskId = data.taskId.trim();

    const [goal, task] = await Promise.all([
      prisma.goal.findFirst({
        where: {
          id: goalId,
          userId: user.id,
        },
        select: { id: true },
      }),
      prisma.task.findFirst({
        where: {
          id: taskId,
          userId: user.id,
        },
        select: { id: true },
      }),
    ]);

    if (!goal) {
      return errorResponse("Goal not found.", 404);
    }

    if (!task) {
      return errorResponse("Task not found.", 404);
    }

    await prisma.taskGoal.upsert({
      where: {
        taskId_goalId: {
          taskId,
          goalId,
        },
      },
      create: {
        taskId,
        goalId,
      },
      update: {},
    });

    return Response.json(
      {
        message: "Task linked to goal successfully.",
        goalId,
        taskId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Link task to goal failed:", error);
    return errorResponse("Failed to link task to goal.", 500);
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

    const { id: goalId } = await context.params;
    const taskId = request.nextUrl.searchParams.get("taskId");

    if (!taskId) {
      return errorResponse("Task ID is required.", 400);
    }

    const [goal, task] = await Promise.all([
      prisma.goal.findFirst({
        where: {
          id: goalId,
          userId: user.id,
        },
        select: { id: true },
      }),
      prisma.task.findFirst({
        where: {
          id: taskId,
          userId: user.id,
        },
        select: { id: true },
      }),
    ]);

    if (!goal || !task) {
      return errorResponse("Goal or task not found.", 404);
    }

    const result = await prisma.taskGoal.deleteMany({
      where: {
        goalId,
        taskId,
        task: { userId: user.id },
        goal: { userId: user.id },
      },
    });

    if (result.count === 0) {
      return errorResponse("Task is not linked to this goal.", 404);
    }

    return Response.json({
      message: "Task unlinked from goal successfully.",
    });
  } catch (error) {
    console.error("Unlink task from goal failed:", error);
    return errorResponse("Failed to unlink task from goal.", 500);
  }
}
