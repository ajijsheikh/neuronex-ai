# Environment Variable Structure

---

## 1. Environment Files

| File | Purpose | Git |
|---|---|---|
| `.env.local` | Local development secrets | Ignored |
| `.env.example` | Documented template for all env vars | Committed |
| Vercel Dashboard | Production secrets (via Vercel env vars) | N/A |

---

## 2. Complete Variable Reference

### 2.1 Firebase (Client-Side)

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD-...` | Firebase project API key (safe for client) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `neuronex.firebaseapp.com` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `neuronex-12345` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `neuronex-12345.appspot.com` | Storage bucket URL |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Sender ID for push (optional MVP) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789:web:abc123` | Firebase app ID |

*Prefix `NEXT_PUBLIC_` exposes these to browser code.*

### 2.2 Firebase (Server-Side)

| Variable | Example | Description |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type": "service_account", ...}` | Full JSON string of Firebase Admin service account key |

*⚠️ Never commit this. For local dev, store the JSON file path and read it. For Vercel, paste the full JSON string as an env var.*

### 2.3 Database

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/neuronex` | PostgreSQL connection string with pgvector |
| `DATABASE_URL_UNPOOLED` | `postgresql://user:pass@host:5432/neuronex` | Direct (non-pooled) URL for migrations |

*For Supabase: Use the connection pooler URL for runtime, the direct URL for migrations.*  
*For Neon: Use the pooled endpoint with `?pgbouncer=true` for serverless, the direct endpoint for Drizzle Kit.*

### 2.4 Gemini AI

| Variable | Example | Description |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSyB-...` | Google AI Studio API key for Gemini |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` | Embedding model name (default) |
| `GEMINI_CHAT_MODEL` | `gemini-1.5-flash` | Chat completion model (flash for speed/cost) |
| `GEMINI_EXTRACTION_MODEL` | `gemini-1.5-flash` | Entity extraction model (can use pro for accuracy) |

### 2.5 Rate Limiting (Optional for MVP)

| Variable | Example | Description |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://...` | Upstash Redis REST URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | `abc123...` | Upstash Redis REST token |

### 2.6 Application Config

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Canonical app URL (used for OAuth redirects) |
| `NEXT_PUBLIC_APP_NAME` | `NEURONEX` | App name displayed in UI |
| `MAX_FILE_SIZE` | `10485760` | Max upload size in bytes (10 MB) |
| `VECTOR_SEARCH_LIMIT` | `10` | Default top-K for vector search |
| `RAG_CHUNK_SIZE` | `1000` | Recursive splitter chunk size |
| `RAG_CHUNK_OVERLAP` | `200` | Chunk overlap |

---

## 3. `.env.example` Template

```bash
# ============================================
# NEURONEX - Environment Variables
# ============================================
# Copy this file to .env.local and fill in values.
# Never commit .env.local to version control.

# --- Firebase Client (Next.js public) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Firebase Admin (Server-side only) ---
# Full JSON string of the service account key.
# On local: cat service-account.json | pbcopy → paste here
# On Vercel: add as a secret environment variable
FIREBASE_SERVICE_ACCOUNT_KEY=

# --- PostgreSQL ---
# Connection string for Drizzle ORM and pgvector.
# Supabase example: postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres
# Neon example:     postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neuronex
DATABASE_URL=
# Direct connection for migrations (no pooler)
DATABASE_URL_UNPOOLED=

# --- Google Gemini ---
# Get your API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-1.5-flash
GEMINI_EXTRACTION_MODEL=gemini-1.5-flash

# --- Upstash Redis (Rate Limiting) ---
# Optional for MVP. Required for production rate limiting.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# --- App Config ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NEURONEX
MAX_FILE_SIZE=10485760
VECTOR_SEARCH_LIMIT=10
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
```

---

## 4. Validation at Startup

```typescript
// src/config/env.ts
// Validates required env vars at build time and prevents silent failures

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Firebase
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  // Server-side
  firebaseAdminKey: () => requireEnv("FIREBASE_SERVICE_ACCOUNT_KEY"),
  databaseUrl: () => requireEnv("DATABASE_URL"),
  geminiApiKey: () => requireEnv("GEMINI_API_KEY"),
} as const;
```

---

## 5. Platform-Specific Configuration

| Platform | Env Variable Location | Notes |
|---|---|---|
| **Local dev** | `.env.local` | `npm run dev` auto-loads via Next.js |
| **Vercel** | Vercel Dashboard → Project Settings → Environment Variables | Mark Firebase client vars as "Preview" + "Production", service account key as "Secret" |
| **CI (GitHub Actions)** | GitHub Secrets → mapped in `.github/workflows/ci.yml` | Only `DATABASE_URL` and `GEMINI_API_KEY` needed for integration tests |
