# Production Readiness Report v2

> **Date:** July 10, 2026
> **Scope:** Security, error handling, configuration, deployment, monitoring, and operational readiness assessment

---

## 1. Environment & Configuration

### Required Environment Variables

| Variable | Type | Checked at Startup? | Missing Default? | Safe Default |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public (client) | ✅ `firebase-config.ts:31` | ⚠️ Only warns in dev | `undefined` → `null` config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | ✅ Same | ⚠️ Only warns in dev | `undefined` → `null` config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | ✅ Same | ⚠️ Only warns in dev | `undefined` → `null` config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | ✅ Same | ⚠️ Only warns in dev | `undefined` → `null` config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | ✅ Same | ⚠️ Only warns in dev | `undefined` → `null` config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | ✅ Same | ⚠️ Only warns in dev | `undefined` → `null` config |
| `DATABASE_URL` | Secret (server) | ❌ **Not checked** | 🔴 **No runtime validation** | Crashes Prisma with inscrutable error |
| `GEMINI_API_KEY` | Secret (server) | ❌ **Not checked** | 🔴 **No runtime validation** | Crashes with `!` assertion error |

**:warning: Critical: Two server-side secrets are not validated before use.** `DATABASE_URL` will cause Prisma to throw an unhelpful connection error. `GEMINI_API_KEY` will crash with `TypeError: Cannot read properties of undefined (reading 'length')` from the `!` non-null assertion in 5 files.

### .env.example Completeness

| Check | Status | Notes |
|---|---|---|
| All required vars documented | ✅ | 8 vars listed |
| Clear setup instructions | ✅ | Comments for Firebase, PostgreSQL, Gemini |
| Optional vars documented | ✅ | Firebase Service Account |
| Default values provided | ❌ | No defaults (acceptable for secrets) |

---

## 2. Security Audit

### Authentication & Authorization

| Check | Status | Details |
|---|---|---|
| Firebase token verified on every API route | ✅ | `verifyFirebaseToken` called in all 17 API routes |
| Token extracted from Authorization Bearer | ✅ | `extractBearerToken` in `verify-token.ts:39-42` |
| Firebase token properly validated via Google API | ✅ | HTTP POST to `identitytoolkit.googleapis.com/v1/accounts:lookup` |
| Route-level authorization checks | ✅ | All routes check `uid` before returning data |
| Data isolation by userId | ✅ | All Prisma queries filter by `userId: uid` |
| CORS headers | ❌ **Missing** | No CORS configuration anywhere |
| CSRF protection | ❌ **Missing** | No CSRF tokens or SameSite cookies |
| Rate limiting | ❌ **Missing** | No rate limiting on any endpoint |
| Input validation | 🟡 Partial | `rating` validated (0-3), query required, but no max length on queries or text inputs |

### Secrets Management

| Check | Status | Details |
|---|---|---|
| No secrets in client-side code | ✅ | Firebase config keys are `NEXT_PUBLIC_`, acceptable |
| No .env files in git | ✅ | `.env.example` only |
| No hardcoded secrets | ✅ | All values from env vars |
| `NODE_ENV`-dependent logging | ✅ | Console warnings in dev only |
| `!` non-null assertion on secrets | ❌ **5 occurrences** | `lib/ai.ts:3`, `summarize.ts:3`, `study-notes.ts:3`, `quiz.ts:3`, `flashcards.ts:3` |

### Input Validation & Injection

| Check | Status | Details |
|---|---|---|
| SQL injection (Prisma) | ✅ | Prisma ORM queries parameterized |
| SQL injection (`$queryRawUnsafe`) | ⚠️ **Needs review** | `chat/route.ts:24` — `embedding.join(",")` is safe (numbers only), but raw SQL still flagged |
| XSS (chat output) | 🟡 Partial | Chat responses rendered as text (no `dangerouslySetInnerHTML`), but no explicit sanitization |
| File upload validation | ✅ | Type + size checked client-side |
| Path traversal (file access) | ✅ | Firebase Storage handles access control |

---

## 3. Error Handling

### API Error Handling

| Pattern | Status | Files |
|---|---|---|
| Try/catch in API routes | ✅ | All 17 API routes have try/catch |
| HTTP status codes used correctly | ✅ | 400, 401, 404, 500 |
| Error messages exposed to client | 🟡 **Partial** | `error instanceof Error ? error.message : "..."` — leaks internal error messages |
| No stack traces exposed | ✅ | `error.message` only, no `error.stack` |
| Consistent error response shape | ✅ | All return `{ error: string }` |
| Graceful handling of missing env vars | ❌ **Missing** | `verify-token.ts` returns `null`, but `lib/ai.ts` crashes on `undefined` key |

### Client Error Handling

| Pattern | Status | Files |
|---|---|---|
| Loading states | 🟡 Partial | Some pages lack skeleton loaders |
| Error states | ✅ | All pages show error messages or toast errors |
| Empty states | 🟡 Partial | Some pages (study-notes, summaries) show empty lists without guidance |
| Network error handling | 🟡 Partial | `catch` blocks show generic messages |
| Retry logic | ❌ **None** | No retry buttons on failure |

### Global Error Boundaries

| Type | Status | File |
|---|---|---|
| `error.tsx` | ❌ **Missing** | No global error boundary for Next.js |
| `loading.tsx` | ❌ **Missing** | No global loading state |
| `not-found.tsx` | ❌ **Missing** | No custom 404 page |

---

## 4. Logging & Monitoring

### Current Logging

| Log Type | Location | Level | Production Impact |
|---|---|---|---|
| Firebase init success/failure | `firebase.ts:29,35` | `console.log`/`console.error` | ✅ Dev-only (`NODE_ENV` check) |
| Firebase config missing | `firebase-config.ts:34` | `console.warn` | ✅ Dev-only |
| Token verification failure | `verify-token.ts:24,33` | `console.warn`/`console.error` | ✅ Dev-only |
| **No structured logging** | — | — | 🔴 No log aggregation, no log levels, no request IDs |

### Missing Production Logging

| Gap | Risk |
|---|---|
| No structured logger (winston/pino) | Cannot filter/search logs in production |
| No request ID tracking | Cannot correlate API calls across services |
| No performance logging | No visibility into slow AI calls |
| No error alerting | Silent failures in production |
| No audit trail | Who accessed what, when? |

---

## 5. Monitoring & Observability

### Health Checks

| Check | Status | Notes |
|---|---|---|
| `GET /api/health` | ❌ **Missing** | No health endpoint for load balancers |
| Database connectivity check | ❌ **Missing** | Prisma connects lazily, first request may fail |
| AI API connectivity check | ❌ **Missing** | No Gemini key validation at startup |
| Firebase connectivity check | ❌ **Missing** | Client-side only, not checked server-side |

### Metrics

| Metric | Status | Notes |
|---|---|---|
| Request latency | ❌ **Not collected** | No instrumentation |
| Error rate | ❌ **Not collected** | No error tracking |
| AI API call count | ❌ **Not collected** | No usage tracking |
| Database query timing | ❌ **Not collected** | No Prisma middleware |
| Active users | ❌ **Not collected** | No analytics |

---

## 6. Deployment Configuration

### Build & Deploy

| Check | Status | Details |
|---|---|---|
| `docker-compose.yml` | ❌ **Missing** | No Docker compose for local PostgreSQL |
| Dockerfile | ❌ **Missing** | No containerization |
| CI/CD pipeline | ❌ **Missing** | No GitHub Actions or similar |
| `next.config.ts` | ✅ Present | TypeScript-based config |
| `serverExternalPackages` | ❌ **Missing** | `pdfjs-dist` not listed — will be bundled incorrectly |
| TypeScript strict mode | ✅ `tsconfig.json:7` | `"strict": true` |
| `npm build` success | 🟡 Unknown | Not tested in this session |

### Platform Compatibility

| Platform | Status | Notes |
|---|---|---|
| Vercel | 🟡 Partial | No `vercel.json`, no region config, no cron jobs |
| AWS / GCP | 🟡 Partial | No deployment artifacts |
| Self-hosted (Docker) | ❌ Not supported | No Dockerfile |

---

## 7. Database Readiness

### Migration & Schema

| Check | Status | Notes |
|---|---|---|
| Prisma migrations configured | ✅ | Standard Prisma setup |
| `prisma generate` on build | ❌ **Not verified** | Not confirmed in build pipeline |
| pgvector extension supported | ✅ | Declared in `schema.prisma:9` |
| Indexes for common queries | ❌ **Missing** | No vector index on `Chunk.embedding` |

### Data Safety

| Check | Status | Details |
|---|---|---|
| Cascading deletes configured | ✅ | All relations use `onDelete: Cascade` |
| Unique constraints for upserts | ✅ | Entity `[userId, name]`, Summary `[documentId, type]`, StudyNote `[documentId, level]` |
| Transaction wrapping | ❌ **Missing** | Ingestion can leave orphaned chunks/entities on failure |
| Connection pooling | 🟡 Default | Prisma defaults, no pool configuration |

---

## 8. Testing Coverage

### Test Infrastructure

| Check | Status | Notes |
|---|---|---|
| Unit tests | ❌ **Not found** | No test files discovered |
| Integration tests | ❌ **Not found** | No API route tests |
| E2E tests | ❌ **Not found** | No Playwright/Cypress setup |
| Test script in `package.json` | ❌ **Not verified** | — |

---

## 9. Error Recovery & Resilience

### Current State

| Scenario | Behavior | Acceptable? |
|---|---|---|
| Firebase API temporarily unavailable | Auth fails, all API routes return 401 | ✅ Acceptable (degraded) |
| Gemini API returns 429 (rate limit) | Unhandled error, returns 500 to user | ❌ No retry/backoff |
| PostgreSQL connection lost | Prisma throws, API returns 500 | ❌ No reconnection logic |
| PDF parsing fails (corrupt file) | Returns 500 with "processing failed" | ✅ Acceptable (user error) |
| File exceeds 10MB | Rejected client-side | ✅ Acceptable |
| Gemini API returns malformed JSON | Quiz/flashcard parse error | 🟡 Has fallback regex |
| Auth token expires mid-session | Next API call returns 401 | 🟡 No token refresh trigger |

### Missing Resilience Features

| Feature | Priority | Rationale |
|---|---|---|
| Gemini API retry with exponential backoff | **High** | Prevents transient failures from reaching users |
| Request timeout wrapper on AI calls | **High** | Prevents hung requests from consuming resources |
| Prisma connection retry | **Medium** | Handles brief DB outages |
| Ingestion transaction | **Medium** | Prevents orphaned data |
| Auth token refresh before API calls | **Medium** | Prevents mid-session 401 errors |
| Circuit breaker for external APIs | **Low** | Prevents cascading failures |

---

## 10. Operational Runbook

### Startup Sequence (Required)

1. Configure `.env` with all 8 environment variables
2. Run `npx prisma generate` to generate Prisma client
3. Run `npx prisma db push` or `npx prisma migrate deploy` to sync schema
4. Ensure PostgreSQL has `pgvector` extension installed
5. Run `npm run build` to verify production build
6. Deploy to Vercel or self-hosted Node.js

### First-Time User Flow

1. User opens app → Firebase init (client) → Check config → Show warning if missing
2. User registers → Firebase Auth → Token issued → `syncUser()` → User created in DB
3. User uploads document → Firebase Storage → Ingest API → PDF parse → Chunk → Embed → Store
4. User chats → Embedding → Vector search → AI response with sources

### Known Failure Modes

| Symptom | Likely Cause | Remediation |
|---|---|---|
| Firebase warning on login page | Missing `NEXT_PUBLIC_FIREBASE_*` env vars | Check `.env` file |
| "Failed to process document" during upload | Missing `pdfjs-dist` dependency | `npm install pdfjs-dist` + add to `serverExternalPackages` |
| AI features return empty/error | Missing `GEMINI_API_KEY` | Check `.env` file |
| Chat returns no results | Missing pgvector index or no documents processed | Verify document status in DB |
| Build fails with `Module not found` | `pdfjs-dist` not installed or incompatible Node version | Check Node >= 18 |

---

## 11. Production Readiness Score: **4/10**

| Category | Score | Justification |
|---|---|---|
| Configuration & Setup | 5/10 | Good `.env.example`, but no startup validation for `DATABASE_URL` or `GEMINI_API_KEY` |
| Security | 6/10 | Firebase auth solid, but no CORS, CSRF, rate limiting, or input sanitization |
| Error Handling | 4/10 | All API routes have try/catch, but no error boundaries, no `loading.tsx`, no `error.tsx` |
| Logging & Monitoring | 1/10 | Dev-only console logs, no structured logging, no metrics, no health endpoint |
| Deployment | 3/10 | No Docker, no CI/CD, no platform config files |
| Database | 4/10 | Good schema with cascades and unique constraints, but missing indexes and transactions |
| Testing | 0/10 | No test infrastructure whatsoever |
| Error Recovery | 3/10 | No retries, no timeouts, no circuit breakers |
| Documentation | 6/10 | Good `.env.example`, good code comments, no operational docs |

### Blocker Checklist for Production Deployment

- [ ] Add `pdfjs-dist` to `package.json` dependencies
- [ ] Add `pdfjs-dist` to `serverExternalPackages` in `next.config.ts`
- [ ] Wrap `process.env.GEMINI_API_KEY!` with runtime validation in all 5 AI module files
- [ ] Add pgvector index (`IVFFlat`) on `Chunk.embedding`
- [ ] Add `error.tsx`, `loading.tsx`, `not-found.tsx` global pages
- [ ] Add `GET /api/health` endpoint
- [ ] Add startup validation for `DATABASE_URL` and `GEMINI_API_KEY`
- [ ] Add AI API timeout wrapper (`Promise.race` with AbortController)
- [ ] Add structured logging (winston/pino) with request IDs
- [ ] Set up CI/CD pipeline with lint + build + deploy
