import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export type SummaryType = "30sec" | "2min" | "5min" | "executive" | "exam";

const SUMMARY_CONFIG: Record<SummaryType, { maxTokens: number; instruction: string }> = {
  "30sec": {
    maxTokens: 120,
    instruction: "Write an ultra-concise 2-3 sentence summary capturing the single most important idea.",
  },
  "2min": {
    maxTokens: 400,
    instruction: "Write a brief summary (1-2 paragraphs) covering the main ideas and key points.",
  },
  "5min": {
    maxTokens: 1000,
    instruction: "Write a detailed summary covering all major topics, arguments, and conclusions. Use headings if helpful.",
  },
  executive: {
    maxTokens: 600,
    instruction: "Write a professional executive summary with: Background, Key Findings, Implications, and Recommendations. Use bullet points for clarity.",
  },
  exam: {
    maxTokens: 350,
    instruction: "Write an exam-night summary: only the absolutely critical facts, formulas, definitions, and concepts. Use bullet points. Bold the most important terms.",
  },
};

export async function generateSummary(
  documentText: string,
  documentTitle: string,
  type: SummaryType
): Promise<string> {
  const config = SUMMARY_CONFIG[type];

  const prompt = `You are NEURONEX, an AI summarization engine.

Document Title: "${documentTitle}"

Document Content:
${documentText.slice(0, 30000)}

${config.instruction}

Output the summary directly in Markdown. Do NOT wrap in code blocks.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
    },
  });

  return result.response.text();
}
