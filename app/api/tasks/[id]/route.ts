
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
const allowedPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id } = await context.params;

    if (!id) {
      return errorResponse("Task ID is required.", 400);
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existingTask) {
      return errorResponse("Task not found.", 404);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    if (!isRecord(body)) {
      return errorResponse("Invalid request data.", 400);
    }

    const data: {
      title?: string;
      description?: string | null;
      status?: (typeof allowedStatuses)[number];
      priority?: (typeof allowedPriorities)[number];
      dueDate?: Date | null;
      completedAt?: Date | null;
      categoryId?: string | null;
    } = {};

    if ("title" in body) {
      if (typeof body.title !== "string") {
        return errorResponse("Task title must be a string.", 400);
      }

      const title = body.title.trim();

      if (!title || title.length > 200) {
        return errorResponse(
          "Task title must be between 1 and 200 characters.",
          400
        );
      }

      data.title = title;
    }

    if ("description" in body) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return errorResponse("Description must be a string.", 400);
      }

      const description =
        typeof body.description === "string"
          ? body.description.trim()
          : null;

      if (description && description.length > 5000) {
        return errorResponse(
          "Description must not exceed 5000 characters.",
          400
        );
      }

      data.description = description || null;
    }

    if ("status" in body) {
      if (
        typeof body.status !== "string" ||
        !allowedStatuses.includes(
          body.status as (typeof allowedStatuses)[number]
        )
      ) {
        return errorResponse("Invalid task status.", 400);
      }

      data.status = body.status as (typeof allowedStatuses)[number];
      data.completedAt =
        data.status === "DONE" ? new Date() : null;
    }

    if ("priority" in body) {
      if (
        typeof body.priority !== "string" ||
        !allowedPriorities.includes(
          body.priority as (typeof allowedPriorities)[number]
        )
      ) {
        return errorResponse("Invalid task priority.", 400);
      }

      data.priority =
        body.priority as (typeof allowedPriorities)[number];
    }

    if ("dueDate" in body) {
      if (
        body.dueDate === null ||
        body.dueDate === ""
      ) {
        data.dueDate = null;
      } else if (typeof body.dueDate === "string") {
        const date = new Date(body.dueDate);

        if (Number.isNaN(date.getTime())) {
          return errorResponse("Invalid due date.", 400);
        }

        data.dueDate = date;
      } else {
        return errorResponse("Due date must be a string or null.", 400);
      }
    }

    if ("categoryId" in body) {
      if (
        body.categoryId !== null &&
        typeof body.categoryId !== "string"
      ) {
        return errorResponse("Invalid category.", 400);
      }

      const categoryId =
        typeof body.categoryId === "string"
          ? body.categoryId.trim() || null
          : null;

      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: user.id,
          },
          select: { id: true },
        });

        if (!category) {
          return errorResponse("Category not found.", 404);
        }
      }

      data.categoryId = categoryId;
    }

    if (Object.keys(data).length === 0) {
      return errorResponse("No valid fields provided to update.", 400);
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        category: true,
        subtasks: {
          orderBy: { position: "asc" },
        },
        goals: {
          include: {
            goal: true,
          },
        },
      },
    });

    return Response.json({
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("Update task failed:", error);
    return errorResponse("Failed to update task.", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { id } = await context.params;

    const result = await prisma.task.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return errorResponse("Task not found.", 404);
    }

    return Response.json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task failed:", error);
    return errorResponse("Failed to delete task.", 500);
  }
}
