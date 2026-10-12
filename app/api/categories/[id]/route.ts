
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
    const updateData: { name?: string; color?: string } = {};

    if ("name" in data) {
      if (typeof data.name !== "string") {
        return errorResponse("Category name must be a string.", 400);
      }

      const name = data.name.trim();

      if (!name || name.length > 60) {
        return errorResponse(
          "Category name must be between 1 and 60 characters.",
          400
        );
      }

      const duplicate = await prisma.category.findFirst({
        where: {
          userId: user.id,
          id: { not: id },
          name: { equals: name, mode: "insensitive" },
        },
        select: { id: true },
      });

      if (duplicate) {
        return errorResponse(
          "A category with this name already exists.",
          409
        );
      }

      updateData.name = name;
    }

    if ("color" in data) {
      if (
        typeof data.color !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(data.color)
      ) {
        return errorResponse("Invalid category color.", 400);
      }

      updateData.color = data.color;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields provided.", 400);
    }

    const result = await prisma.category.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return errorResponse("Category not found.", 404);
    }

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    return Response.json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update category failed:", error);
    return errorResponse("Failed to update category.", 500);
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

    const result = await prisma.category.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return errorResponse("Category not found.", 404);
    }

    return Response.json({
      message: "Category deleted successfully. Tasks remain uncategorized.",
    });
  } catch (error) {
    console.error("Delete category failed:", error);
    return errorResponse("Failed to delete category.", 500);
  }
}
