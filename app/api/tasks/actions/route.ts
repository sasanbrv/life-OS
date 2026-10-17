
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action } = body;

    if (
      typeof taskId !== "string" ||
      typeof action !== "string" ||
      !["complete", "delete"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid taskId or action" },
        { status: 400 },
      );
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (action === "complete") {
      if (task.isCompleted) {
        return NextResponse.json({ task });
      }

      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { isCompleted: true, completedAt: new Date() },
      });

      return NextResponse.json({ task: updatedTask });
    }

    await prisma.task.delete({ where: { id: task.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/tasks/actions:", error);
    return NextResponse.json(
      { error: "Failed to process task action" },
      { status: 500 },
    );
  }
}
