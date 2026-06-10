import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { isDue, getCardStatus } from "@/lib/srs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const deck = await prisma.flashcardDeck.findFirst({
    where: { id, userId: uid },
    include: {
      flashcards: {
        orderBy: { nextReviewAt: "asc" },
      },
    },
  });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cardsWithStatus = deck.flashcards.map((card) => ({
    ...card,
    isDue: isDue(card.nextReviewAt),
    status: getCardStatus(card.repetitions, card.easeFactor),
  }));

  return NextResponse.json({ ...deck, flashcards: cardsWithStatus });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId: uid } });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.flashcardDeck.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
