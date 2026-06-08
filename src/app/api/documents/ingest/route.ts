import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePDF, chunkText } from "@/lib/pdf";
import { generateEmbedding, extractEntities, summarizeDocument } from "@/lib/ai";

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

  const { fileName, sourceUrl, fileType } = await req.json();

  const document = await prisma.document.create({
    data: { userId: uid, title: fileName, type: fileType, sourceUrl, status: "processing" },
  });

  try {
    const res = await fetch(sourceUrl);
    const buffer = Buffer.from(await res.arrayBuffer());

    let text: string;
    if (fileType === "pdf") {
      text = await parsePDF(buffer);
    } else {
      text = buffer.toString("utf-8");
    }

    const summary = await summarizeDocument(text);
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const embedding = await generateEmbedding(content);

      await prisma.$executeRawUnsafe(
        `INSERT INTO "Chunk" (id, "documentId", content, embedding, "pageNumber", "createdAt")
         VALUES ($1, $2, $3, $4::vector, $5, NOW())`,
        crypto.randomUUID(),
        document.id,
        content,
        `[${embedding.join(",")}]`,
        null
      );
    }

    const extraction = await extractEntities(text);

    for (const entity of extraction.entities) {
      await prisma.entity.upsert({
        where: { userId_name: { userId: uid, name: entity.name } },
        update: { type: entity.type },
        create: { userId: uid, name: entity.name, type: entity.type },
      });
    }

    for (const rel of extraction.relations) {
      const sourceEntity = await prisma.entity.findFirst({
        where: { userId: uid, name: rel.source },
      });
      const targetEntity = await prisma.entity.findFirst({
        where: { userId: uid, name: rel.target },
      });

      if (sourceEntity && targetEntity) {
        await prisma.relationship.create({
          data: {
            sourceEntityId: sourceEntity.id,
            targetEntityId: targetEntity.id,
            relationshipType: rel.type,
            documentId: document.id,
          },
        });
      }
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "ready" },
    });

    return NextResponse.json({ success: true, documentId: document.id });
  } catch (error) {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
