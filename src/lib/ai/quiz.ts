import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer";
export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options: string[] | null; // For MCQ only
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  conceptTag: string;
}

export interface QuizGenerationResult {
  title: string;
  questions: GeneratedQuestion[];
}

const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
  easy: "Generate simple questions testing basic recall and definitions. Suitable for beginners.",
  medium: "Generate questions requiring understanding and application of concepts. Include some 'why' questions.",
  hard: "Generate challenging questions requiring analysis, synthesis, and deep understanding. Include scenario-based questions.",
  expert: "Generate expert-level questions testing edge cases, nuances, comparisons, and critical evaluation. Suitable for exams.",
};

export async function generateQuiz(
  documentText: string,
  documentTitle: string,
  questionTypes: QuestionType[],
  difficulty: DifficultyLevel,
  count: number = 10
): Promise<QuizGenerationResult> {
  const typesStr = questionTypes.join(", ");

  const prompt = `You are NEURONEX, an AI quiz generator. Generate exactly ${count} quiz questions from the following document.

Document Title: "${documentTitle}"

Document Content:
${documentText.slice(0, 25000)}

Requirements:
- Question types to include: ${typesStr}
- Difficulty: ${DIFFICULTY_PROMPTS[difficulty]}
- Distribute question types evenly across the requested types
- For MCQ: provide exactly 4 options labeled A, B, C, D
- For true_false: correctAnswer must be "True" or "False"
- For fill_blank: write the question with _____ for the blank
- For short_answer: expect 1-3 sentence answers
- Each question must have a clear, unambiguous correct answer
- Tag each question with the specific concept it tests

Output strictly as JSON matching this schema:
{
  "title": "Quiz: [Document Title]",
  "questions": [
    {
      "type": "mcq" | "true_false" | "fill_blank" | "short_answer",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."] | null,
      "correctAnswer": "...",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "${difficulty}",
      "conceptTag": "specific-concept-tested"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as QuizGenerationResult;
  } catch {
    // Fallback: try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as QuizGenerationResult;
    }
    throw new Error("Failed to parse quiz generation response");
  }
}

/**
 * Grade a short answer question using AI comparison.
 */
export async function gradeShortAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string; score: number }> {
  const gradingModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are grading a student's short answer. Compare their answer to the correct answer.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Grade strictly but fairly. A partially correct answer should get partial credit.
Output strictly as JSON:
{
  "isCorrect": true/false (true if substantially correct),
  "score": 0-100 (percentage correctness),
  "feedback": "Brief constructive feedback explaining what was right/wrong"
}`;

  const result = await gradingModel.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}
