import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseToken, extractBearerToken } from "@/lib/verify-token";

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized — missing token" }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized — invalid token" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { id: uid },
    update: {},
    create: { id: uid },
  });

  return NextResponse.json({ user });
}
