
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("You must be logged in.", 401);
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error("Get categories failed:", error);
    return errorResponse("Failed to retrieve categories.", 500);
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

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return errorResponse("Category name is required.", 400);
    }

    if (name.length > 60) {
      return errorResponse(
        "Category name must not exceed 60 characters.",
        400
      );
    }

    let color = "#64748b";

    if (body.color !== undefined) {
      if (
        typeof body.color !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(body.color)
      ) {
        return errorResponse(
          "Color must be a valid hex color, such as #64748b.",
          400
        );
      }

      color = body.color;
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      return errorResponse(
        "A category with this name already exists.",
        409
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        userId: user.id,
      },
    });

    return Response.json(
      {
        message: "Category created successfully.",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category failed:", error);
    return errorResponse("Failed to create category.", 500);
  }
}
