
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
      include: {
        entries: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json(habit);
  } catch (error) {
    console.error("GET /api/habits/[id]:", error);

    return NextResponse.json(
      { error: "Failed to fetch habit" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const data: {
      title?: string;
      recurrence?: object;
      isActive?: boolean;
    } = {};

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > 120
      ) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 });
      }

      data.title = body.title.trim();
    }

    if (body.recurrence !== undefined) {
      if (
        !body.recurrence ||
        typeof body.recurrence !== "object" ||
        Array.isArray(body.recurrence)
      ) {
        return NextResponse.json(
          { error: "Invalid recurrence" },
          { status: 400 }
        );
      }

      data.recurrence = body.recurrence;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }

      data.isActive = body.isActive;
    }

    const habit = await prisma.habit.update({
      where: { id },
      data,
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("PATCH /api/habits/[id]:", error);

    return NextResponse.json(
      { error: "Failed to update habit" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.habit.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/habits/[id]:", error);

    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
  }
}
