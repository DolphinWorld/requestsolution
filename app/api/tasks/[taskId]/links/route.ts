import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { rateLimit } from "@/lib/rate-limit";
import { taskLinkSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const anonId = await getAnonId();

  const rl = rateLimit(`link:${anonId}`, 20);
  if (!rl.success) {
    console.warn("[SECURITY] Rate limit exceeded", { anonId, endpoint: "POST /api/tasks/[taskId]/links" });
    return NextResponse.json(
      { error: { message: "Rate limited.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { idea: { select: { createdByAnonId: true } } },
  });
  if (!task) {
    return NextResponse.json(
      { error: { message: "Task not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const isClaimant = task.claimedByAnonId === anonId;
  const isIdeaOwner = task.idea.createdByAnonId === anonId;
  if (!isClaimant && !isIdeaOwner) {
    console.warn("[SECURITY] Unauthorized link add attempt", { anonId, taskId, endpoint: "POST /api/tasks/[taskId]/links" });
    return NextResponse.json(
      { error: { message: "Only the task claimant or idea owner can add links", code: "FORBIDDEN" } },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = taskLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const link = await prisma.taskLink.create({
    data: {
      taskId,
      url: parsed.data.url,
      label: parsed.data.label || "",
      createdByAnonId: anonId,
    },
  });

  return NextResponse.json({ data: link }, { status: 201 });
}
