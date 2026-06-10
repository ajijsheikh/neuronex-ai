import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const summary = await prisma.summary.findFirst({
    where: { id, userId: uid },
    include: { document: { select: { title: true } } },
  });
  if (!summary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ summary });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const summary = await prisma.summary.findFirst({ where: { id, userId: uid } });
  if (!summary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.summary.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
