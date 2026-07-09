import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    healthy = false;
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      checks.gemini = "ok";
    } else {
      checks.gemini = "missing";
      healthy = false;
    }
  } catch {
    checks.gemini = "error";
    healthy = false;
  }

  const firebaseVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ];
  const missing = firebaseVars.filter((v) => !process.env[v]);
  checks.firebase = missing.length === 0 ? "ok" : `missing: ${missing.join(", ")}`;
  if (missing.length > 0) healthy = false;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
