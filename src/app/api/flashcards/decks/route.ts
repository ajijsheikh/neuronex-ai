import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { calculateDeckStats } from "@/lib/srs";

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.flashcardDeck.findMany({
    where: { userId: uid },
    include: {
      flashcards: {
        select: { id: true, easeFactor: true, interval: true, repetitions: true, nextReviewAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const decksWithStats = decks.map(({ flashcards, ...rest }) => ({
    ...rest,
    stats: calculateDeckStats(flashcards),
  }));

  return NextResponse.json({ decks: decksWithStats });
}
