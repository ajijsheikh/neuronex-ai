export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env file or deployment settings.`
    );
  }
  return value;
}

export function getGeminiApiKey(): string {
  return requireEnv("GEMINI_API_KEY");
}

export function getDatabaseUrl(): string {
  return requireEnv("DATABASE_URL");
}
