import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { rateLimit } from "@/lib/rate-limit";
import { taskStatusSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const anonId = await getAnonId();

  const rl = rateLimit(`status:${anonId}`, 30);
  if (!rl.success) {
    console.warn("[SECURITY] Rate limit exceeded", { anonId, endpoint: "POST /api/tasks/[taskId]/status" });
    return NextResponse.json(
      { error: { message: "Rate limited.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

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
      console.warn("[SECURITY] Unauthorized status change attempt", { anonId, taskId, endpoint: "POST /api/tasks/[taskId]/status" });
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
    console.warn("[SECURITY] Unauthorized status change attempt", { anonId, taskId, endpoint: "POST /api/tasks/[taskId]/status" });
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
