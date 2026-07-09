import { getJsonModel, withRetry, withTimeout } from "@/lib/ai/client";

export interface GeneratedFlashcard {
  front: string;
  back: string;
  conceptTag: string;
}

export async function generateFlashcards(
  documentText: string,
  documentTitle: string,
  count: number = 20
): Promise<GeneratedFlashcard[]> {
  const prompt = `You are NEURONEX, an AI flashcard generator. Create ${count} high-quality flashcards from the following document.

Document Title: "${documentTitle}"

Document Content:
${documentText.slice(0, 25000)}

Rules:
- Front side: A clear, specific question or prompt
- Back side: A concise, accurate answer
- Cover the most important concepts, definitions, facts, and relationships
- Vary question types: "What is...", "Define...", "How does...", "Compare...", "What are the key differences between..."
- Each card should test ONE specific concept
- Tag each card with the concept it covers

Output strictly as JSON:
{
  "flashcards": [
    {
      "front": "Question or prompt text",
      "back": "Answer text",
      "conceptTag": "concept-name"
    }
  ]
}`;

  const result = await withRetry(
    () => withTimeout(getJsonModel().generateContent(prompt), "generateFlashcards"),
    "generateFlashcards"
  );
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    return parsed.flashcards || parsed;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.flashcards || parsed;
    }
    throw new Error("Failed to parse flashcard generation response");
  }
}

export function exportToCSV(
  flashcards: { front: string; back: string }[]
): string {
  const header = "Front,Back\n";
  const rows = flashcards
    .map(
      (card) =>
        `"${card.front.replace(/"/g, '""')}","${card.back.replace(/"/g, '""')}"`
    )
    .join("\n");
  return header + rows;
}

export function exportToAnki(
  flashcards: { front: string; back: string }[]
): string {
  return flashcards
    .map((card) => `${card.front}\t${card.back}`)
    .join("\n");
}
