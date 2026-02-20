import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const anonId = await getAnonId();

  const link = await prisma.taskLink.findUnique({ where: { id: linkId } });
  if (!link) {
    return NextResponse.json(
      { error: { message: "Link not found", code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  if (link.createdByAnonId !== anonId) {
    return NextResponse.json(
      { error: { message: "Not the creator", code: "FORBIDDEN" } },
      { status: 403 }
    );
  }

  await prisma.taskLink.delete({ where: { id: linkId } });

  return NextResponse.json({ data: { deleted: true } });
}
