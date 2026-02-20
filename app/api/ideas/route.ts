import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { rateLimit } from "@/lib/rate-limit";
import { submitIdeaSchema, specSchema } from "@/lib/validators";
import { llm, LLM_MODEL } from "@/lib/llm";
import { IDEA_TO_SPEC_SYSTEM_PROMPT, buildIdeaPrompt } from "@/lib/prompts";
import { generateEmbedding } from "@/lib/embedding";
import { hotScore } from "@/lib/hot-score";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "hot";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { problemStatement: { contains: search } },
        ],
      }
    : {};

  if (sort === "new") {
    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tasks: { select: { id: true, status: true } },
        },
      }),
      prisma.idea.count({ where }),
    ]);

    return NextResponse.json({
      ideas: ideas.map(serializeIdea),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  // Hot sort: fetch all, compute score, sort in JS
  const ideas = await prisma.idea.findMany({
    where,
    include: {
      tasks: { select: { id: true, status: true } },
    },
  });

  const scored = ideas
    .map((idea) => ({
      ...idea,
      _hotScore: hotScore(idea.upvotesCount, idea.createdAt),
    }))
    .sort((a, b) => b._hotScore - a._hotScore);

  const total = scored.length;
  const paginated = scored.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    ideas: paginated.map(serializeIdea),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const anonId = await getAnonId();

  // Rate limit by anon_id
  const rl = rateLimit(`idea:${anonId}`, 5);
  if (!rl.success) {
    return NextResponse.json(
      { error: { message: "Rate limited. Max 5 ideas per hour.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

  // Also rate limit by IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rlIp = rateLimit(`idea:ip:${ip}`, 10);
  if (!rlIp.success) {
    return NextResponse.json(
      { error: { message: "Rate limited by IP.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = submitIdeaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { rawInputText, targetUsers, platform, constraints } = parsed.data;
  const userPrompt = buildIdeaPrompt(rawInputText, targetUsers, platform, constraints);

  // Generate spec via LLM
  let spec;
  try {
    spec = await generateSpec(userPrompt);
  } catch (error) {
    console.error("LLM spec generation failed:", error);
    return NextResponse.json(
      { error: { message: "Failed to generate specification. Please try again.", code: "LLM_ERROR" } },
      { status: 502 }
    );
  }

  // Generate embedding (non-blocking failure)
  const embedding = await generateEmbedding(rawInputText);

  // Create idea + tasks in a transaction
  const idea = await prisma.$transaction(async (tx) => {
    const idea = await tx.idea.create({
      data: {
        createdByAnonId: anonId,
        rawInputText,
        title: spec.title,
        problemStatement: spec.problemStatement,
        tags: JSON.stringify(spec.tags),
        features: JSON.stringify(spec.features),
        openQuestions: JSON.stringify(spec.openQuestions),
        embedding: embedding ? JSON.stringify(embedding) : null,
      },
    });

    if (spec.tasks.length > 0) {
      await tx.task.createMany({
        data: spec.tasks.map((t) => ({
          ideaId: idea.id,
          title: t.title,
          description: t.description,
          acceptanceCriteria: t.acceptanceCriteria,
          effort: t.effort,
        })),
      });
    }

    return idea;
  });

  const created = await prisma.idea.findUnique({
    where: { id: idea.id },
    include: { tasks: true },
  });

  return NextResponse.json({ data: serializeIdea(created!) }, { status: 201 });
}

async function generateSpec(userPrompt: string, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const completion = await llm.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: IDEA_TO_SPEC_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty LLM response");

    try {
      // Strip markdown fences if present
      const cleaned = content.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
      const parsed = JSON.parse(cleaned);
      return specSchema.parse(parsed);
    } catch (err) {
      if (attempt === retries) throw err;
      // Retry with a fix prompt
      console.warn("Invalid spec JSON, retrying...", err);
    }
  }
  throw new Error("Failed to generate valid spec");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeIdea(idea: any) {
  return {
    id: idea.id,
    createdAt: idea.createdAt,
    title: idea.title,
    problemStatement: idea.problemStatement,
    tags: JSON.parse(idea.tags || "[]"),
    features: JSON.parse(idea.features || "[]"),
    openQuestions: JSON.parse(idea.openQuestions || "[]"),
    upvotesCount: idea.upvotesCount,
    commentsCount: idea.commentsCount,
    tasks: idea.tasks || [],
  };
}
