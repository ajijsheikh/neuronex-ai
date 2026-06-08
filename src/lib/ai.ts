import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function extractEntities(
  text: string
): Promise<{ entities: { name: string; type: string }[]; relations: { source: string; target: string; type: string }[] }> {
  const prompt = `Extract key entities and their relationships from the following text. Output strictly as JSON with no markdown formatting or code blocks:
{
  "entities": [{ "name": "...", "type": "Person|Concept|Technology|Organization|Location" }],
  "relations": [{ "source": "...", "target": "...", "type": "..." }]
}

Text:
${text.slice(0, 8000)}`;

  const result = await chatModel.generateContent(prompt);
  const response = result.response.text();
  const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateChatResponse(
  query: string,
  contextChunks: { content: string; documentTitle: string; chunkId: string }[]
): Promise<string> {
  const context = contextChunks
    .map((c, i) => `[Source ${i + 1}: ${c.documentTitle}]\n${c.content}`)
    .join("\n\n");

  const prompt = `You are NEURONEX, an AI knowledge assistant. Answer the user's question based solely on the provided context. Cite your sources using [Source N] notation. If the context doesn't contain enough information, say "I cannot find an answer based on your documents."

Context:
${context}

User Question: ${query}

Answer:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}

export async function summarizeDocument(text: string): Promise<string> {
  const prompt = `Summarize the following document in 2-3 sentences:\n\n${text.slice(0, 10000)}`;
  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}
