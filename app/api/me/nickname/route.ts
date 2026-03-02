import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { rateLimit } from "@/lib/rate-limit";
import { nicknameSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const anonId = await getAnonId();

  const rl = rateLimit(`nickname:${anonId}`, 5);
  if (!rl.success) {
    console.warn("[SECURITY] Rate limit exceeded", { anonId, endpoint: "POST /api/me/nickname" });
    return NextResponse.json(
      { error: { message: "Rate limited. Max 5 nickname changes per hour.", code: "RATE_LIMITED" } },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = nicknameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const user = await prisma.anonUser.upsert({
    where: { id: anonId },
    create: { id: anonId, nickname: parsed.data.nickname },
    update: { nickname: parsed.data.nickname },
  });

  return NextResponse.json({ data: user });
}

export async function GET() {
  const anonId = await getAnonId();

  const user = await prisma.anonUser.findUnique({
    where: { id: anonId },
  });

  return NextResponse.json({
    data: { anonId, nickname: user?.nickname || null },
  });
}
