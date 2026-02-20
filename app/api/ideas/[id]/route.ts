import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { findSimilarIdeas } from "@/lib/embedding";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anonId = await getAnonId();

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { links: true },
        orderBy: { updatedAt: "asc" },
      },
      comments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!idea) {
    return NextResponse.json(
      { error: { message: "Idea not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Check if current user has voted
  const vote = await prisma.vote.findUnique({
    where: { ideaId_anonId: { ideaId: id, anonId } },
  });

  // Find similar ideas
  let similarIdeas: { id: string; title: string; similarity: number }[] = [];
  if (idea.embedding) {
    const allIdeas = await prisma.idea.findMany({
      select: { id: true, title: true, embedding: true },
    });
    const targetEmbedding = JSON.parse(idea.embedding) as number[];
    similarIdeas = findSimilarIdeas(targetEmbedding, allIdeas, id);
  }

  return NextResponse.json({
    data: {
      id: idea.id,
      createdAt: idea.createdAt,
      createdByAnonId: idea.createdByAnonId,
      rawInputText: idea.rawInputText,
      title: idea.title,
      problemStatement: idea.problemStatement,
      tags: JSON.parse(idea.tags || "[]"),
      features: JSON.parse(idea.features || "[]"),
      openQuestions: JSON.parse(idea.openQuestions || "[]"),
      upvotesCount: idea.upvotesCount,
      commentsCount: idea.commentsCount,
      tasks: idea.tasks,
      comments: idea.comments,
      hasVoted: !!vote,
      similarIdeas,
      isOwner: idea.createdByAnonId === anonId,
    },
  });
}
