import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseToken, extractBearerToken } from "@/lib/verify-token";

export async function GET(req: Request) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entities = await prisma.entity.findMany({
    where: { userId: uid },
    select: { id: true, name: true, type: true },
  });

  const relations = await prisma.relationship.findMany({
    where: {
      sourceEntity: { userId: uid },
      targetEntity: { userId: uid },
    },
    select: {
      id: true,
      sourceEntityId: true,
      targetEntityId: true,
      relationshipType: true,
      documentId: true,
      sourceEntity: { select: { id: true, name: true, type: true } },
      targetEntity: { select: { id: true, name: true, type: true } },
      document: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const documentCount = await prisma.document.count({
    where: { userId: uid, status: "ready" },
  });

  return NextResponse.json({ entities, relations, documentCount });
}
