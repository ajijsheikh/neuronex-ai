import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, generateChatResponse } from "@/lib/ai";
import { verifyFirebaseToken, extractBearerToken } from "@/lib/verify-token";

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const embedding = await generateEmbedding(query);
    const embeddingStr = `[${embedding.join(",")}]`;

    const chunks = await prisma.$queryRawUnsafe<{ id: string; content: string; documentId: string }[]>(
      `SELECT c.id, c.content, c."documentId"
       FROM "Chunk" c
       JOIN "Document" d ON d.id = c."documentId"
       WHERE d."userId" = $1 AND d.status = 'ready'
       ORDER BY c.embedding <=> $2::vector
       LIMIT 5`,
      uid,
      embeddingStr
    );

    const chunkDetails = await Promise.all(
      chunks.map(async (chunk) => {
        const doc = await prisma.document.findUnique({
          where: { id: chunk.documentId },
          select: { title: true },
        });
        return {
          content: chunk.content,
          documentTitle: doc?.title || "Unknown",
          chunkId: chunk.id,
        };
      })
    );

    if (chunkDetails.length === 0) {
      return NextResponse.json({
        answer: "I cannot find an answer based on your documents. Try uploading some documents first.",
      });
    }

    const answer = await generateChatResponse(query, chunkDetails);
    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
