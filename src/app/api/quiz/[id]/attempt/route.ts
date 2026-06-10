import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyFirebaseToken } from "@/lib/verify-token";
import { gradeShortAnswer } from "@/lib/ai/quiz";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyFirebaseToken(token);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await req.json();
  // answers: [{ questionId: string, userAnswer: string }]

  if (!answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing answers array" }, { status: 400 });
  }

  try {
    const quiz = await prisma.quiz.findFirst({
      where: { id, userId: uid },
      include: { questions: true },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    let totalPoints = 0;
    let correctPoints = 0;
    const gradedAnswers: {
      questionId: string;
      userAnswer: string;
      isCorrect: boolean;
      aiFeedback: string | null;
    }[] = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let feedback: string | null = null;
      const points = 1;
      totalPoints += points;

      if (question.type === "short_answer") {
        const grade = await gradeShortAnswer(question.question, question.correctAnswer, answer.userAnswer);
        isCorrect = grade.isCorrect;
        feedback = grade.feedback;
        totalPoints += 0;
        correctPoints += grade.score / 100;
      } else if (question.type === "true_false") {
        isCorrect = answer.userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        if (isCorrect) correctPoints += points;
      } else if (question.type === "fill_blank") {
        isCorrect = answer.userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        if (isCorrect) correctPoints += points;
      } else {
        isCorrect = answer.userAnswer.trim() === question.correctAnswer.trim();
        if (isCorrect) correctPoints += points;
      }

      gradedAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        aiFeedback: feedback,
      });
    }

    const score = totalPoints > 0 ? (correctPoints / totalPoints) * 100 : 0;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        userId: uid,
        score: Math.round(score * 100) / 100,
        totalPoints,
        timeTaken: null,
        answers: {
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
            aiFeedback: a.aiFeedback,
          })),
        },
      },
      include: {
        answers: {
          include: { question: { select: { correctAnswer: true, explanation: true, type: true } } },
        },
      },
    });

    return NextResponse.json({ attempt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grading failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
