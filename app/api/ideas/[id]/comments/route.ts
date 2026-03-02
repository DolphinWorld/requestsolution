import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { rateLimit } from "@/lib/rate-limit";
import { commentSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { ideaId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anonId = await getAnonId();

  const rl = rateLimit(`comment:${anonId}`, 10);
  if (!rl.success) {
    console.warn("[SECURITY] Rate limit exceeded", { anonId, endpoint: "POST /api/ideas/[id]/comments" });
    return NextResponse.json(
      { error: { message: "Rate limited. Max 10 comments per hour.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json(
      { error: { message: "Idea not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  // Look up nickname
  const anonUser = await prisma.anonUser.findUnique({
    where: { id: anonId },
  });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        ideaId: id,
        body: parsed.data.body,
        createdByAnonId: anonId,
        nickname: anonUser?.nickname || null,
      },
    }),
    prisma.idea.update({
      where: { id },
      data: { commentsCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ data: comment }, { status: 201 });
}
