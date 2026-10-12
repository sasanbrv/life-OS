
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function parseOptionalDate(value: unknown): Date | null | undefined {
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const status = request.nextUrl.searchParams.get("status");

    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
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

    return Response.json({ goals });
  } catch (error) {
    console.error("Get goals failed:", error);
    return errorResponse("Failed to retrieve goals.", 500);
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
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.trim().length > 200
    ) {
      return errorResponse(
        "Title is required and must be at most 200 characters.",
        400
      );
    }

    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string"
    ) {
      return errorResponse("Description must be a string.", 400);
    }

    const startDate = parseOptionalDate(data.startDate);
    const dueDate = parseOptionalDate(data.dueDate);

    if (startDate === undefined || dueDate === undefined) {
      return errorResponse("Dates must use YYYY-MM-DD format.", 400);
    }

    if (startDate && dueDate && dueDate < startDate) {
      return errorResponse(
        "Due date cannot be earlier than the start date.",
        400
      );
    }

    const manualProgress = data.manualProgress ?? 0;

    if (
      typeof manualProgress !== "number" ||
      !Number.isInteger(manualProgress) ||
      manualProgress < 0 ||
      manualProgress > 100
    ) {
      return errorResponse(
        "Manual progress must be an integer from 0 to 100.",
        400
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title: data.title.trim(),
        description:
          typeof data.description === "string"
            ? data.description.trim() || null
            : null,
        startDate: startDate ?? null,
        dueDate: dueDate ?? null,
        manualProgress,
        userId: user.id,
      },
      include: {
        tasks: true,
      },
    });

    return Response.json(
      { message: "Goal created successfully.", goal },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create goal failed:", error);
    return errorResponse("Failed to create goal.", 500);
  }
}
