import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    where: { userId: uid },
    include: {
      document: { select: { title: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await req.json();
  if (!quizId) return NextResponse.json({ error: "Missing quizId" }, { status: 400 });

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId: uid },
    include: { questions: true },
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ quiz });
}
