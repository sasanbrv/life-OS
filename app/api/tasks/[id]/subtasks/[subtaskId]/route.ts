
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ subtaskId: string }>;
};

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const { subtaskId } = await context.params;

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

    const subtask = await prisma.subtask.findFirst({
      where: {
        id: subtaskId,
        task: {
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!subtask) {
      return errorResponse("Subtask not found.", 404);
    }

    const updateData: {
      title?: string;
      isDone?: boolean;
      position?: number;
    } = {};

    if ("title" in data) {
      if (typeof data.title !== "string") {
        return errorResponse("Title must be a string.", 400);
      }

      const title = data.title.trim();

      if (!title || title.length > 200) {
        return errorResponse(
          "Title must be between 1 and 200 characters.",
          400
        );
      }

      updateData.title = title;
    }

    if ("isDone" in data) {
      if (typeof data.isDone !== "boolean") {
        return errorResponse("isDone must be a boolean.", 400);
      }

      updateData.isDone = data.isDone;
    }

    if ("position" in data) {
      if (
        typeof data.position !== "number" ||
        !Number.isInteger(data.position) ||
        data.position < 0
      ) {
        return errorResponse(
          "Position must be a non-negative integer.",
          400
        );
      }

      updateData.position = data.position;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields provided.", 400);
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    return Response.json({
      message: "Subtask updated successfully.",
      subtask: updatedSubtask,
    });
  } catch (error) {
    console.error("Update subtask failed:", error);
    return errorResponse("Failed to update subtask.", 500);
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

    const { subtaskId } = await context.params;

    const result = await prisma.subtask.deleteMany({
      where: {
        id: subtaskId,
        task: {
          userId: user.id,
        },
      },
    });

    if (result.count === 0) {
      return errorResponse("Subtask not found.", 404);
    }

    return Response.json({
      message: "Subtask deleted successfully.",
    });
  } catch (error) {
    console.error("Delete subtask failed:", error);
    return errorResponse("Failed to delete subtask.", 500);
  }
}
