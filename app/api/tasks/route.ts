
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@/app/generated/prisma/client";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const status = params.get("status");
    const priority = params.get("priority");
    const categoryId = params.get("categoryId");
    const sort = params.get("sort") ?? "createdAt";
    const order = params.get("order") === "asc" ? "asc" : "desc";

    if (
      status &&
      status !== "ALL" &&
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return errorResponse("Invalid task status.", 400);
    }

    if (
      priority &&
      priority !== "ALL" &&
      !allowedPriorities.includes(
        priority as (typeof allowedPriorities)[number]
      )
    ) {
      return errorResponse("Invalid task priority.", 400);
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput =
    sort === "title"
        ? { title: order }
        : sort === "dueDate"
            ? { dueDate: order }
                : sort === "priority"
                    ? { priority: order }
                        : { createdAt: order };

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                {
                  description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(status && status !== "ALL"
          ? { status: status as (typeof allowedStatuses)[number] }
          : {}),
        ...(priority && priority !== "ALL"
          ? {
              priority:
                priority as (typeof allowedPriorities)[number],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy,
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

    return Response.json({ tasks });
  } catch (error) {
    console.error("Get tasks failed:", error);
    return errorResponse("Failed to retrieve tasks.", 500);
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

    if (!isRecord(body)) {
      return errorResponse("Invalid request data.", 400);
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return errorResponse("Task title is required.", 400);
    }

    if (title.length > 200) {
      return errorResponse(
        "Task title must not exceed 200 characters.",
        400
      );
    }

    let description: string | null = null;

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        return errorResponse("Description must be a string.", 400);
      }

      description = body.description.trim() || null;

      if (description && description.length > 5000) {
        return errorResponse(
          "Description must not exceed 5000 characters.",
          400
        );
      }
    }

    let status: (typeof allowedStatuses)[number] = "TODO";

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !allowedStatuses.includes(
          body.status as (typeof allowedStatuses)[number]
        )
      ) {
        return errorResponse("Invalid task status.", 400);
      }

      status = body.status as (typeof allowedStatuses)[number];
    }

    let priority: (typeof allowedPriorities)[number] = "MEDIUM";

    if (body.priority !== undefined) {
      if (
        typeof body.priority !== "string" ||
        !allowedPriorities.includes(
          body.priority as (typeof allowedPriorities)[number]
        )
      ) {
        return errorResponse("Invalid task priority.", 400);
      }

      priority = body.priority as (typeof allowedPriorities)[number];
    }

    let dueDate: Date | null = null;

    if (
      body.dueDate !== undefined &&
      body.dueDate !== null &&
      body.dueDate !== ""
    ) {
      if (typeof body.dueDate !== "string") {
        return errorResponse("Due date must be a string.", 400);
      }

      dueDate = new Date(body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return errorResponse("Invalid due date.", 400);
      }
    }

    let categoryId: string | null = null;

    if (body.categoryId !== undefined && body.categoryId !== null) {
      if (typeof body.categoryId !== "string") {
        return errorResponse("Invalid category.", 400);
      }

      categoryId = body.categoryId.trim() || null;

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
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate,
        completedAt: status === "DONE" ? new Date() : null,
        categoryId,
        userId: user.id,
      },
      include: {
        category: true,
        subtasks: true,
        goals: {
          include: {
            goal: true,
          },
        },
      },
    });

    return Response.json(
      {
        message: "Task created successfully.",
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create task failed:", error);
    return errorResponse("Failed to create task.", 500);
  }
}
