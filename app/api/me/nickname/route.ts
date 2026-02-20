import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { nicknameSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const anonId = await getAnonId();

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
