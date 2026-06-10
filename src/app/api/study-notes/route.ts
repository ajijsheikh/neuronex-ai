import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { generateStudyNotes, type NoteLevel } from "@/lib/ai/study-notes";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, level } = await req.json();
  if (!documentId || !level) {
    return NextResponse.json({ error: "Missing documentId or level" }, { status: 400 });
  }

  const validLevels: NoteLevel[] = ["beginner", "intermediate", "advanced", "exam", "research"];
  if (!validLevels.includes(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  try {
    const existing = await prisma.studyNote.findUnique({
      where: { documentId_level: { documentId, level } },
    });
    if (existing) return NextResponse.json({ studyNote: existing });

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: uid },
      include: { chunks: { select: { content: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fullText = document.chunks.map((c) => c.content).join("\n\n");
    if (!fullText.trim()) return NextResponse.json({ error: "Document has no content" }, { status: 400 });

    const result = await generateStudyNotes(fullText, document.title, level as NoteLevel);

    const studyNote = await prisma.studyNote.create({
      data: {
        userId: uid,
        documentId,
        level,
        title: result.title,
        content: result.content,
      },
    });

    return NextResponse.json({ studyNote });
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

  const notes = await prisma.studyNote.findMany({
    where: { userId: uid },
    include: { document: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ studyNotes: notes });
}
