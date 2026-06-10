import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { processReview } from "@/lib/srs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating } = await req.json();
  // rating: 0=Again, 1=Hard, 2=Good, 3=Easy

  if (rating === undefined || rating < 0 || rating > 3) {
    return NextResponse.json({ error: "Invalid rating (0-3)" }, { status: 400 });
  }

  try {
    const card = await prisma.flashcard.findFirst({
      where: { id, userId: uid },
    });
    if (!card) return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });

    const result = processReview(rating, card.easeFactor, card.interval, card.repetitions);

    const updatedCard = await prisma.flashcard.update({
      where: { id },
      data: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        lastReviewAt: new Date(),
      },
    });

    await prisma.flashcardReview.create({
      data: {
        flashcardId: id,
        userId: uid,
        rating,
      },
    });

    return NextResponse.json({ flashcard: updatedCard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
