# Deployment Architecture

---

## 1. Architecture Overview

```
                         ┌──────────────────┐
                         │   Cloudflare DNS  │
                         │  neuronex.app     │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │   Vercel (Edge)   │
                         │                   │
                         │  ┌─────────────┐  │
                         │  │ Next.js App  │  │
                         │  │ (App Router) │  │
                         │  │              │  │
                         │  │ Pages (SSR)  │  │
                         │  │ API (Edge/   │  │
                         │  │  Serverless) │  │
                         │  │ Middleware   │  │
                         │  └─────────────┘  │
                         └─────┬──────┬──────┘
                               │      │
              ┌────────────────┤      ├─────────────────────┐
              │                │      │                     │
              ▼                ▼      ▼                     ▼
     ┌────────────────┐  ┌──────────────┐  ┌──────────────────────┐
     │   Supabase /    │  │   Firebase    │  │   Google Gemini API   │
     │   Neon (DB)     │  │   Auth +      │  │   (External Service)  │
     │                 │  │   Storage     │  │                       │
     │  PostgreSQL     │  │               │  │  Embeddings           │
     │  + pgvector     │  │  JWT Issuer   │  │  Chat Completions     │
     │                 │  │  File Storage │  │  Entity Extraction    │
     │  User Data      │  │  CDN          │  │                       │
     │  Documents      │  └──────────────┘  └──────────────────────┘
     │  Chunks         │
     │  Entities       │
     │  Relationships  │
     └────────────────┘
```

---

## 2. Hosting Decisions

| Service | Platform | Rationale |
|---|---|---|
| **Frontend + API** | Vercel (Pro) | Native Next.js support, ISR, Edge Functions, zero DevOps |
| **Database** | Neon (Serverless) or Supabase | pgvector pre-installed, serverless (scale-to-zero), branching for dev |
| **Auth** | Firebase Auth | Social login, JWT out of box, 10k MAU free tier |
| **File Storage** | Firebase Storage | CDN-backed, integrated with Firebase Auth rules, generous free tier |
| **AI** | Google Gemini API | Pay-as-you-go, no GPU management |
| **Rate Limiting** | Upstash Redis | Serverless Redis, REST API (no persistent connection needed) |
| **CI/CD** | GitHub Actions | Free for public repos, tight Vercel integration |

---

## 3. Vercel Configuration

### 3.1 `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/chat/route.ts": {
      "maxDuration": 60,
      "memory": 512
    },
    "src/app/api/documents/ingest/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

**Key settings:**
- **Region:** `iad1` (US East) — closest to typical Supabase/Neon region
- **Chat route:** 60s timeout (Gemini streaming can be slow), 512MB memory
- **Ingest route:** 60s timeout, 1024MB memory (PDF parsing + AI calls)
- **Other API routes:** Default 10s / 128MB

### 3.2 Environment Variables (Vercel Dashboard)

Set via Vercel UI or `vercel env pull`. See [08_ENVIRONMENT_VARIABLES.md](./08_ENVIRONMENT_VARIABLES.md) for full list.

---

## 4. Database Hosting

### Option A: Neon (Recommended for Serverless)

```
DATABASE_URL=postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neuronex?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neuronex?sslmode=require
```

**Pros:** True serverless (scale-to-zero), pgvector pre-installed, branching for preview deployments.

**Neon-specific setup:**
```sql
-- Enable pgvector (pre-installed on Neon)
CREATE EXTENSION IF NOT EXISTS vector;
```

### Option B: Supabase

```
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
DATABASE_URL_UNPOOLED=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Pros:** Built-in auth RLS, dashboard, row-level security integration.
**Note:** Use port 6543 (pooler) for serverless; port 5432 (direct) for migrations.

**Supabase-specific setup:**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Row-Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies (example for documents)
CREATE POLICY "Users can only see their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 5. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci
      - run: npm run typecheck     # tsc --noEmit
      - run: npm run lint          # eslint
      - run: npm run test:unit     # vitest

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: neuronex
          POSTGRES_PASSWORD: neuronex
          POSTGRES_DB: neuronex_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://neuronex:neuronex@localhost:5432/neuronex_test
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [quality, integration]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

---

## 6. Database Migrations Strategy

```bash
# Local development
npm run db:generate    # Drizzle Kit: generate SQL from schema changes
npm run db:migrate     # Drizzle Kit: apply migrations to local DB
npm run db:push        # Drizzle Kit: push schema directly (fast iteration)

# Production (via CI)
npm run db:migrate     # Run as a Vercel post-deploy hook or GitHub Actions step

# Preview deployments
npm run db:branch      # Neon: creates a DB branch matching the PR branch
```

**Drizzle config (`drizzle.config.ts`):**
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
} satisfies Config;
```

---

## 7. Scalability Considerations

| Concern | Limit | Mitigation |
|---|---|---|
| **Vercel serverless timeout** | 60s (Pro), 10s (Hobby) | Keep files <10MB; process synchronously for MVP; add QStash queue in V2 |
| **pgvector query speed** | Degrades past 1M vectors | HNSW index handles 1M+ vectors at <100ms; partition by `user_id` if needed |
| **Concurrent uploads** | Gemini rate limits | Queue uploads on client; exponential backoff in pipeline |
| **Graph rendering** | React Flow lags past 1000 nodes | Implement culling, min-connection filtering, clustering |
| **Cold starts** | Vercel cold start ~1-5s | Use Vercel's "Serverless Functions with Keep-Alive" or Cron Jobs to warm |
| **Firebase Storage** | 5GB free, then $0.026/GB | Compress PDFs; limit file size to 10MB |

---

## 8. Monitoring & Observability

| Tool | Purpose | Implementation |
|---|---|---|
| **Vercel Analytics** | Page views, web vitals | Built-in (toggle in Vercel Dashboard) |
| **Vercel Logs** | API errors, 500s | Built-in (Logs tab) |
| **Sentry** | Error tracking | `@sentry/nextjs` — capture API handler + client errors |
| **Postgres Logs** | Slow queries, deadlocks | Neon/Supabase Dashboard |
| **Custom Analytics** | Feature usage events | PostHog or custom `POST /api/analytics` endpoint |

---

## 9. Deployment Checklist

- [ ] Firebase project created with Auth + Storage enabled
- [ ] Neon or Supabase project created with pgvector enabled
- [ ] Vercel project linked to GitHub repo
- [ ] All environment variables set in Vercel Dashboard
- [ ] Firebase Storage rules deployed (UID-scoped access)
- [ ] Database migrations run against production DB
- [ ] Google Gemini API key generated and enabled
- [ ] Custom domain configured (if applicable)
- [ ] SSL/TLS enabled (Vercel handles automatically)
- [ ] Rate limiting configured (Upstash Redis if applicable)
