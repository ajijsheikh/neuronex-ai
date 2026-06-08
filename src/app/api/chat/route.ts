import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, generateChatResponse } from "@/lib/ai";

async function verifyFirebaseToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0]?.localId || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(authHeader.slice(7));
  if (!uid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { query } = await req.json();

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
}
