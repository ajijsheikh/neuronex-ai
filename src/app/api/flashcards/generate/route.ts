import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { generateFlashcards } from "@/lib/ai/flashcards";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, deckName, count } = await req.json();
  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  try {
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: uid },
      include: { chunks: { select: { content: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fullText = document.chunks.map((c) => c.content).join("\n\n");
    if (!fullText.trim()) return NextResponse.json({ error: "Document has no content" }, { status: 400 });

    const cardCount = Math.min(Math.max(count || 20, 1), 50);
    const flashcards = await generateFlashcards(fullText, document.title, cardCount);

    const deck = await prisma.flashcardDeck.create({
      data: {
        userId: uid,
        name: deckName || `${document.title} - Flashcards`,
        flashcards: {
          create: flashcards.map((card) => ({
            userId: uid,
            documentId,
            front: card.front,
            back: card.back,
            conceptTag: card.conceptTag,
          })),
        },
      },
      include: { flashcards: true },
    });

    return NextResponse.json({ deck });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
