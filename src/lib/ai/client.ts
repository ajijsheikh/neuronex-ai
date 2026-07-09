import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/env";

const AI_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

let _genAI: GoogleGenerativeAI | null = null;
let _embeddingModel: GenerativeModel | null = null;
let _chatModel: GenerativeModel | null = null;
let _jsonModel: GenerativeModel | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return _genAI;
}

export function getEmbeddingModel(): GenerativeModel {
  if (!_embeddingModel) {
    _embeddingModel = getClient().getGenerativeModel({ model: "text-embedding-004" });
  }
  return _embeddingModel;
}

export function getChatModel(): GenerativeModel {
  if (!_chatModel) {
    _chatModel = getClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return _chatModel;
}

export function getJsonModel(): GenerativeModel {
  if (!_jsonModel) {
    _jsonModel = getClient().getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
  }
  return _jsonModel;
}

export async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${AI_TIMEOUT}ms`)),
      AI_TIMEOUT
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} retries`);
}
