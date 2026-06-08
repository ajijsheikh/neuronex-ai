import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(authHeader.slice(7));
  if (!uid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const entities = await prisma.entity.findMany({
    where: { userId: uid },
    select: { id: true, name: true, type: true },
  });

  const relations = await prisma.relationship.findMany({
    where: {
      OR: [
        { sourceEntity: { userId: uid } },
        { targetEntity: { userId: uid } },
      ],
    },
    select: { id: true, sourceEntityId: true, targetEntityId: true, relationshipType: true },
  });

  const documentCount = await prisma.document.count({
    where: { userId: uid, status: "ready" },
  });

  return NextResponse.json({ entities, relations, documentCount });
}
