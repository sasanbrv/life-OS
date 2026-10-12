
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

    const { id } = await context.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        subtasks: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!task) {
      return errorResponse("Task not found.", 404);
    }

    return Response.json({ subtasks: task.subtasks });
  } catch (error) {
    console.error("Get subtasks failed:", error);
    return errorResponse("Failed to retrieve subtasks.", 500);
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

    const { id } = await context.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!task) {
      return errorResponse("Task not found.", 404);
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
    const title =
      typeof data.title === "string" ? data.title.trim() : "";

    if (!title) {
      return errorResponse("Subtask title is required.", 400);
    }

    if (title.length > 200) {
      return errorResponse(
        "Subtask title must not exceed 200 characters.",
        400
      );
    }

    const position =
      typeof data.position === "number" &&
      Number.isInteger(data.position) &&
      data.position >= 0
        ? data.position
        : 0;

    const subtask = await prisma.subtask.create({
      data: {
        title,
        position,
        taskId: task.id,
      },
    });

    return Response.json(
      {
        message: "Subtask created successfully.",
        subtask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subtask failed:", error);
    return errorResponse("Failed to create subtask.", 500);
  }
}
