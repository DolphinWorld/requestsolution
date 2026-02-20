import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anonId = await getAnonId();

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json(
      { error: { message: "Idea not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const existing = await prisma.vote.findUnique({
    where: { ideaId_anonId: { ideaId: id, anonId } },
  });

  if (existing) {
    return NextResponse.json(
      { error: { message: "Already upvoted", code: "ALREADY_EXISTS" } },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.vote.create({
      data: { ideaId: id, anonId },
    }),
    prisma.idea.update({
      where: { id },
      data: { upvotesCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ data: { voted: true } }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anonId = await getAnonId();

  const existing = await prisma.vote.findUnique({
    where: { ideaId_anonId: { ideaId: id, anonId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { message: "Not voted", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.vote.delete({
      where: { ideaId_anonId: { ideaId: id, anonId } },
    }),
    prisma.idea.update({
      where: { id },
      data: { upvotesCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ data: { voted: false } });
}
