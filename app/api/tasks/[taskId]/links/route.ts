import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { taskLinkSchema } from "@/lib/validators";

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
