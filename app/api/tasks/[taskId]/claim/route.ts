import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";

export async function POST(
  _request: NextRequest,
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

  if (task.status !== "open") {
    return NextResponse.json(
      { error: { message: "Task is already claimed", code: "ALREADY_EXISTS" } },
      { status: 409 }
    );
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      claimedByAnonId: anonId,
      claimedAt: new Date(),
      status: "in_progress",
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
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

  if (task.claimedByAnonId !== anonId) {
    return NextResponse.json(
      { error: { message: "Not the claimant", code: "FORBIDDEN" } },
      { status: 403 }
    );
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      claimedByAnonId: null,
      claimedAt: null,
      status: "open",
    },
  });

  return NextResponse.json({ data: updated });
}
