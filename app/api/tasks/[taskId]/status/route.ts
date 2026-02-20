import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { taskStatusSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const anonId = await getAnonId();

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json(
      { error: { message: "Task not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = taskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // If setting to open, unclaim the task
  if (status === "open") {
    if (task.claimedByAnonId && task.claimedByAnonId !== anonId) {
      return NextResponse.json(
        { error: { message: "Not the claimant", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: "open", claimedByAnonId: null, claimedAt: null },
    });
    return NextResponse.json({ data: updated });
  }

  // For other statuses, only the claimant can change
  if (task.claimedByAnonId !== anonId) {
    return NextResponse.json(
      { error: { message: "Only the claimant can change task status", code: "FORBIDDEN" } },
      { status: 403 }
    );
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  return NextResponse.json({ data: updated });
}
