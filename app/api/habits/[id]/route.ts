
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
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

    const { id } = await context.params;

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

    const existingHabit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existingHabit) {
      return errorResponse("Habit not found.", 404);
    }

    const updateData: {
      title?: string;
      description?: string | null;
      isActive?: boolean;
      recurrence?: object;
    } = {};

    if (data.title !== undefined) {
      if (
        typeof data.title !== "string" ||
        !data.title.trim() ||
        data.title.trim().length > 150
      ) {
        return errorResponse("Invalid habit title.", 400);
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

    if (data.isActive !== undefined) {
      if (typeof data.isActive !== "boolean") {
        return errorResponse("isActive must be a boolean.", 400);
      }

      updateData.isActive = data.isActive;
    }

    if (data.recurrence !== undefined) {
      if (
        typeof data.recurrence !== "object" ||
        data.recurrence === null ||
        Array.isArray(data.recurrence)
      ) {
        return errorResponse("Invalid recurrence.", 400);
      }

      const recurrence = data.recurrence as Record<string, unknown>;

      const validDaily = recurrence.frequency === "DAILY";

      const validWeekly =
        recurrence.frequency === "WEEKLY" &&
        Array.isArray(recurrence.daysOfWeek) &&
        recurrence.daysOfWeek.length > 0 &&
        recurrence.daysOfWeek.every(
          (day) =>
            typeof day === "number" &&
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        ) &&
        new Set(recurrence.daysOfWeek).size ===
          recurrence.daysOfWeek.length;

      if (!validDaily && !validWeekly) {
        return errorResponse("Invalid recurrence settings.", 400);
      }

      updateData.recurrence = recurrence;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update.", 400);
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: updateData,
      include: { entries: true },
    });

    return Response.json({
      message: "Habit updated successfully.",
      habit,
    });
  } catch (error) {
    console.error("Update habit failed:", error);
    return errorResponse("Failed to update habit.", 500);
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

    const result = await prisma.habit.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return errorResponse("Habit not found.", 404);
    }

    return Response.json({
      message: "Habit deleted successfully.",
    });
  } catch (error) {
    console.error("Delete habit failed:", error);
    return errorResponse("Failed to delete habit.", 500);
  }
}
