export async function verifyFirebaseToken(token: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[NEURONEX] Firebase API key not configured — auth verification disabled");
    }
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.text();
      if (process.env.NODE_ENV === "development") {
        console.warn("[NEURONEX] Token verification failed:", body);
      }
      return null;
    }

    const data = await res.json();
    return data.users?.[0]?.localId || null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[NEURONEX] Token verification error:", err);
    }
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
