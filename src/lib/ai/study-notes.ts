import { getChatModel, withRetry, withTimeout } from "@/lib/ai/client";

const LEVEL_PROMPTS: Record<string, string> = {
  beginner: `Generate BEGINNER-level study notes. Use simple language, define all technical terms, and include helpful analogies. Structure with clear headings and bullet points.`,
  intermediate: `Generate INTERMEDIATE-level study notes. Assume basic knowledge. Include more technical depth, examples, and connections between concepts.`,
  advanced: `Generate ADVANCED-level study notes. Use full technical terminology. Include edge cases, nuances, trade-offs, and academic-level detail.`,
  exam: `Generate EXAM-focused study notes. Focus on testable facts, definitions, formulas, and key concepts. Format with Q&A pairs, mnemonics, and "remember this" callouts.`,
  research: `Generate RESEARCH-level notes. Emphasize methodology, findings, limitations, future work, and connections to related research. Include critical analysis.`,
};

export type NoteLevel = keyof typeof LEVEL_PROMPTS;

export async function generateStudyNotes(
  documentText: string,
  documentTitle: string,
  level: NoteLevel
): Promise<{ title: string; content: string }> {
  const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.beginner;

  const prompt = `You are NEURONEX, an AI study notes generator. ${levelPrompt}

Document Title: "${documentTitle}"

Document Content:
${documentText.slice(0, 30000)}

Generate comprehensive, well-structured study notes in Markdown format.
Include:
- A descriptive title
- Clear section headings (## and ###)
- Bullet points for key concepts
- Bold key terms
- Code blocks if relevant
- A "Key Takeaways" section at the end

Output the notes directly in Markdown. Do NOT wrap in code blocks.`;

  const result = await withRetry(
    () => withTimeout(getChatModel().generateContent(prompt), "generateStudyNotes"),
    "generateStudyNotes"
  );
  const content = result.response.text();

  const titleMatch = content.match(/^#\s+(.+)/m);
  const title = titleMatch
    ? titleMatch[1].trim()
    : `${level.charAt(0).toUpperCase() + level.slice(1)} Notes: ${documentTitle}`;

  return { title, content };
}
