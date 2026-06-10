import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { generateQuiz, type QuestionType, type DifficultyLevel } from "@/lib/ai/quiz";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, questionTypes, difficulty, count } = await req.json();
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

    const types: QuestionType[] = questionTypes || ["mcq", "true_false", "fill_blank", "short_answer"];
    const diff: DifficultyLevel = difficulty || "medium";
    const questionCount = Math.min(Math.max(count || 10, 1), 30);

    const result = await generateQuiz(fullText, document.title, types, diff, questionCount);

    const quiz = await prisma.quiz.create({
      data: {
        userId: uid,
        documentId,
        title: result.title,
        difficulty: diff,
        questionCount: result.questions.length,
        questions: {
          create: result.questions.map((q) => ({
            type: q.type,
            question: q.question,
            options: q.options ? q.options : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            conceptTag: q.conceptTag,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
