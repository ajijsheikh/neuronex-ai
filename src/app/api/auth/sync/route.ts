import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string; name?: string; picture?: string } | null> {
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
    const user = data.users?.[0];
    if (!user) return null;
    return {
      uid: user.localId,
      email: user.email,
      name: user.displayName,
      picture: user.photoUrl,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const firebaseUser = await verifyFirebaseToken(token);
  if (!firebaseUser) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { id: firebaseUser.uid },
    update: { email: firebaseUser.email, name: firebaseUser.name, image: firebaseUser.picture },
    create: {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      image: firebaseUser.picture,
    },
  });

  return NextResponse.json({ user });
}
