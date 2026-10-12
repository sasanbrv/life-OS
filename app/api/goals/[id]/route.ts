
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function parseOptionalDate(
  value: unknown
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
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

    const { id } = await context.params;

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        startDate: true,
        dueDate: true,
      },
    });

    if (!existingGoal) {
      return errorResponse("Goal not found.", 404);
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

    const updateData: {
      title?: string;
      description?: string | null;
      status?: string;
      manualProgress?: number;
      startDate?: Date | null;
      dueDate?: Date | null;
    } = {};

    if (data.title !== undefined) {
      if (
        typeof data.title !== "string" ||
        !data.title.trim() ||
        data.title.trim().length > 200
      ) {
        return errorResponse("Invalid goal title.", 400);
      }

      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (
        data.description !== null &&
        typeof data.description !== "string"
      ) {
        return errorResponse("Invalid description.", 400);
      }

      updateData.description =
        typeof data.description === "string"
          ? data.description.trim() || null
          : null;
    }

    if (data.status !== undefined) {
      if (
        typeof data.status !== "string" ||
        !["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"].includes(
          data.status
        )
      ) {
        return errorResponse("Invalid goal status.", 400);
      }

      updateData.status = data.status;
    }

    if (data.manualProgress !== undefined) {
      if (
        typeof data.manualProgress !== "number" ||
        !Number.isInteger(data.manualProgress) ||
        data.manualProgress < 0 ||
        data.manualProgress > 100
      ) {
        return errorResponse(
          "Manual progress must be an integer from 0 to 100.",
          400
        );
      }

      updateData.manualProgress = data.manualProgress;
    }

    if (data.startDate !== undefined) {
      const startDate = parseOptionalDate(data.startDate);

      if (startDate === undefined) {
        return errorResponse("Invalid start date.", 400);
      }

      updateData.startDate = startDate;
    }

    if (data.dueDate !== undefined) {
      const dueDate = parseOptionalDate(data.dueDate);

      if (dueDate === undefined) {
        return errorResponse("Invalid due date.", 400);
      }

      updateData.dueDate = dueDate;
    }

    const finalStartDate =
      updateData.startDate !== undefined
        ? updateData.startDate
        : existingGoal.startDate;

    const finalDueDate =
      updateData.dueDate !== undefined
        ? updateData.dueDate
        : existingGoal.dueDate;

    if (
      finalStartDate &&
      finalDueDate &&
      finalDueDate < finalStartDate
    ) {
      return errorResponse(
        "Due date cannot be earlier than the start date.",
        400
      );
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update.", 400);
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    return Response.json({
      message: "Goal updated successfully.",
      goal,
    });
  } catch (error) {
    console.error("Update goal failed:", error);
    return errorResponse("Failed to update goal.", 500);
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

    const result = await prisma.goal.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return errorResponse("Goal not found.", 404);
    }

    return Response.json({
      message: "Goal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete goal failed:", error);
    return errorResponse("Failed to delete goal.", 500);
  }
}
