import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { generateSummary, type SummaryType } from "@/lib/ai/summarize";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, type } = await req.json();
  if (!documentId || !type) {
    return NextResponse.json({ error: "Missing documentId or type" }, { status: 400 });
  }

  const validTypes: SummaryType[] = ["30sec", "2min", "5min", "executive", "exam"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid summary type" }, { status: 400 });
  }

  try {
    const existing = await prisma.summary.findUnique({
      where: { documentId_type: { documentId, type } },
    });
    if (existing) return NextResponse.json({ summary: existing });

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: uid },
      include: { chunks: { select: { content: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fullText = document.chunks.map((c) => c.content).join("\n\n");
    if (!fullText.trim()) return NextResponse.json({ error: "Document has no content" }, { status: 400 });

    const content = await generateSummary(fullText, document.title, type as SummaryType);

    const summary = await prisma.summary.create({
      data: { userId: uid, documentId, type, content },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summaries = await prisma.summary.findMany({
    where: { userId: uid },
    include: { document: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ summaries });
}
