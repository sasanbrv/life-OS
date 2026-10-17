
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const dateString = request.nextUrl.searchParams.get("date");
    const date = parseDate(dateString);

    if (!date) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const note = await prisma.dailyNote.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      select: {
        id: true,
        date: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      note: note
        ? {
            ...note,
            date: note.date.toISOString().slice(0, 10),
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/daily-notes:", error);

    return NextResponse.json(
      { error: "Failed to fetch daily note." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.date !== "string" ||
      typeof body.content !== "string"
    ) {
      return NextResponse.json(
        { error: "A valid date and note content are required." },
        { status: 400 },
      );
    }

    const date = parseDate(body.date);

    if (!date) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (body.content.length > 20000) {
      return NextResponse.json(
        { error: "Note must be 20,000 characters or fewer." },
        { status: 400 },
      );
    }

    const content = body.content;

    if (content.trim() === "") {
      await prisma.dailyNote.deleteMany({
        where: {
          userId: user.id,
          date,
        },
      });

      return NextResponse.json({ note: null });
    }

    const note = await prisma.dailyNote.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      create: {
        userId: user.id,
        date,
        content,
      },
      update: {
        content,
      },
      select: {
        id: true,
        date: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      note: {
        ...note,
        date: note.date.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    console.error("PUT /api/daily-notes:", error);

    return NextResponse.json(
      { error: "Failed to save daily note." },
      { status: 500 },
    );
  }
}
