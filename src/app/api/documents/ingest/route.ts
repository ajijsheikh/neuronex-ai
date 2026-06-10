import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePDF, chunkText } from "@/lib/pdf";
import { generateEmbedding, extractEntities } from "@/lib/ai";
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

  const { fileName, sourceUrl, fileType } = await req.json();
  if (!fileName || !sourceUrl) {
    return NextResponse.json({ error: "Missing fileName or sourceUrl" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: { userId: uid, title: fileName, type: fileType || "pdf", sourceUrl, status: "processing" },
  });

  try {
    let text: string;

    if (sourceUrl.startsWith("data:")) {
      const base64 = sourceUrl.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      text = fileType === "pdf" ? await parsePDF(buffer) : buffer.toString("utf-8");
    } else {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`Failed to fetch source: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      text = fileType === "pdf" ? await parsePDF(buffer) : buffer.toString("utf-8");
    }

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
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
