# Performance Analysis Report v2

> **Date:** July 10, 2026
> **Method:** Static code analysis of all latency-sensitive paths, database query patterns, API call chains, and resource usage

---

## 1. API Latency Budget (Estimated End-to-End)

### Fast Paths (< 500ms expected)

| Endpoint | Chain | Estimated Latency | Optimization Needed? |
|---|---|---|---|
| `GET /api/graph/data` | Token verify → 2 Prisma queries → JSON | **~150-300ms** | No |
| `GET /api/summaries` | Token verify → 1 Prisma query → JSON | **~100-200ms** | No |
| `GET /api/study-notes` | Token verify → 1 Prisma query → JSON | **~100-200ms** | No |
| `GET /api/quiz` | Token verify → 1 Prisma query → JSON | **~100-200ms** | No |
| `DELETE /api/summaries/[id]` | Token verify → 1 lookup → 1 delete | **~80-150ms** | No |

### Moderate Paths (500ms - 3s expected)

| Endpoint | Chain | Estimated Latency | Optimization Needed? |
|---|---|---|---|
| `POST /api/chat` | Embedding → Vector search (5) → 5 document lookups → Gemini chat | **~1.5-3s** | 🟡 Yes |
| `POST /api/flashcards/[id]/review` | Token verify → 1 DB lookup → SRS calc → 1 DB update → 1 create | **~150-300ms** | 🟢 No |

### Heavy Paths (5s - 120s expected)

| Endpoint | Chain | Estimated Latency | Optimization Needed? |
|---|---|---|---|
| `POST /api/documents/ingest` (PDF, 10 pages) | Token verify → DB create → PDF parse → 20 chunk embeddings → 20 DB inserts → Entity extraction → N entity upserts → N^2 relation lookups | **~30-60s** | 🔴 Yes |
| `POST /api/quiz/generate` | Token verify → 1 DB query → Gemini generate (all questions) → DB create | **~10-25s** | 🟡 Yes |
| `POST /api/flashcards/generate` | Token verify → 1 DB query → Gemini generate (all cards) → DB create | **~10-25s** | 🟡 Yes |
| `POST /api/summaries` | Token verify → 1 DB query → Gemini generate → DB create | **~5-15s** | 🟢 No |
| `POST /api/study-notes` | Token verify → 1 DB query → Gemini generate → DB create | **~5-15s** | 🟢 No |
| `POST /api/quiz/[id]/attempt` (grading short answers) | Token verify → 1 DB query → N sequential Gemini grading calls → DB create | **~3-30s** (10 short answers ~30s) | 🔴 Yes |

### Auth Path (per-request overhead)

| Operation | Chain | Estimated Latency | Notes |
|---|---|---|---|
| `verifyFirebaseToken` | HTTP POST to Google Identity Toolkit | **~200-500ms** | Network round-trip per request |
| `onAuthStateChanged` | Firebase SDK local callback | **~0-50ms** | No network hit for cached sessions |

---

## 2. Database Query Analysis

### Query Patterns

| Pattern | Files | Frequency | Impact |
|---|---|---|---|
| `$queryRawUnsafe` (vector search) | `chat/route.ts:26-35` | Per chat query | Risks injection on `embedding.join(",")` — OK since numbers are safe, but format matters |
| `$executeRawUnsafe` (chunk insert) | `ingest/route.ts:46-54` | Per chunk (20-200/doc) | Slow but unavoidable for pgvector |
| `findMany` (list entities/relations) | `graph/data/route.ts:16-44` | Per page load | Scales fine with indexes |
| `findFirst` (user + entity lookups) | `ingest/route.ts:68-73`, `chat/route.ts:39` | Per relation/chunk | **N+1 problem** — 5 extra queries per chat, 2N queries per ingest |
| `upsert` (entity + user) | `ingest/route.ts:59-65`, `auth/sync/route.ts:16-20` | Per ingest/auth | Correct pattern |
| `createMany` | Not used anywhere | — | **Missed optimization** — all batch creates use individual `create` |

### Missing Indexes

| Table | Query Pattern | Column(s) | Impact |
|---|---|---|---|
| `Chunk` | `ORDER BY embedding <=> $1::vector LIMIT 5` | `embedding` | **Full table scan on every chat query** once >10K rows |
| `Entity` | `findFirst WHERE userId = $1 AND name = $2` | `userId, name` | Partial — covered by unique constraint, but constraint-driven lookup may be slower than explicit index |
| `Relationship` | `findMany WHERE sourceEntity.userId = $1 AND targetEntity.userId = $2` | `sourceEntityId, targetEntityId` | Sequential scan for large graphs |

### N+1 Query Hotspots

| Location | Pattern | Cost |
|---|---|---|
| `chat/route.ts:37-49` | 1 vector search → 5 `findUnique` document lookups | **5 extra round-trips per chat** — solvable by JOIN in the `$queryRawUnsafe` |
| `ingest/route.ts:68-73` | For each relation: 2 `findFirst` entity lookups | **2N extra round-trips per document** — solvable by prefetching entities into a Map |
| `decks/route.ts:23-26` | Decks loaded with flashcards → `calculateDeckStats` iterates in memory | OK — in-memory iteration, sub-millisecond |

---

## 3. AI API Call Analysis

### Call Frequency

| Operation | Model | Approx Cost/Call | Frequency | Monthly Estimate (100 users, 10 doc/user) |
|---|---|---|---|---|
| `generateEmbedding` | `text-embedding-004` | ~$0.0001 | Per chunk (~30/doc) | **$30** |
| `generateContent` (chat) | `gemini-2.0-flash` | ~$0.00015 | Per query (~100/user) | **$1.50** |
| `generateContent` (summarize) | `gemini-2.0-flash` | ~$0.0005 | Per summary | **$0.50** |
| `generateContent` (quiz) | `gemini-2.0-flash` | ~$0.001 | Per quiz | **$1.00** |
| `generateContent` (flashcards) | `gemini-2.0-flash` | ~$0.0008 | Per flashcard set | **$0.80** |
| `generateContent` (entity extraction) | `gemini-2.0-flash` | ~$0.0003 | Per document | **$0.30** |
| `generateContent` (short-answer grading) | `gemini-2.0-flash` | ~$0.0001 | Per short answer | **Variable** |

### Latency Distribution (measured or estimated)

| Operation | P50 | P95 | P99 |
|---|---|---|---|
| Embedding (text-embedding-004) | ~500ms | ~2s | ~5s |
| Chat response (gemini-2.0-flash) | ~1.5s | ~4s | ~8s |
| Summarize generation | ~5s | ~12s | ~20s |
| Quiz generation (10 Qs) | ~12s | ~25s | ~40s |
| Flashcard generation (20 cards) | ~10s | ~20s | ~35s |
| Entity extraction | ~3s | ~8s | ~15s |
| Short answer grading | ~1s | ~3s | ~6s |

### Concurrency Issues

| File | Issue | Risk |
|---|---|---|
| `ingest/route.ts:43-55` | Chunk embeddings in `for...of` with sequential `await` | 20 chunks × 500ms = 10s for embedding alone |
| `quiz/[id]/attempt/route.ts:38-70` | Short answer grading in `for...of` with sequential `await` | 10 short answers × 1s = 10s |

---

## 4. Firestore / Firebase Storage Analysis

### Storage Operations

| Operation | Location | Frequency | Size Limits |
|---|---|---|---|
| Upload file to Firebase Storage | `upload/page.tsx:41-55` | Per document | 10MB (enforced) |
| Get download URL | `upload/page.tsx:55` | Per upload | N/A |
| Fetch file back from URL | `ingest/route.ts:35-39` | Per ingest | N/A |
| Firebase Auth token refresh | SDK handles automatically | ~hourly | N/A |

### Issues

| # | Issue | Impact | Suggestion |
|---|---|---|---|
| 1 | File is uploaded to Firebase Storage, then downloaded back to server | Double bandwidth cost for every file (~40MB for a 10MB file: 10 up + 10 down + overhead) | Consider direct server-to-Storage access (service account) or skip Firebase Storage entirely for server-side processing |
| 2 | No Firebase Storage lifecycle rules configured (out of scope) | Stale files accumulate forever | Set TTL rules |
| 3 | `verifyFirebaseToken` makes external HTTP call for every API request | ~200-500ms added to every single API call | Cache token verification results with a short TTL |

---

## 5. Client-Side Performance

### Bundle Size Estimates

| Page/Component | Estimated Size | Notes |
|---|---|---|
| Login/Register (`/login`) | **~150KB JS** | AuthForm + Firebase SDK |
| Upload (`/upload`) | **~200KB JS** | Firebase Storage SDK |
| Dashboard (`/dashboard`) | **~180KB JS** | Recharts + stats |
| Chat (`/chat`) | **~200KB JS** | Message components |
| Graph (`/graph`) | **~220KB JS** | ReactFlow (~100KB) + Sheet |
| Flashcards (`/flashcards`) | **~180KB JS** | Deck + card components |
| Study Notes (`/study-notes`) | **~160KB JS** | Markdown rendering |

### Rendering Issues

| Component | Issue | Impact |
|---|---|---|
| `graph/page.tsx:50-61` | All nodes rendered at once, no virtualization | 1000+ nodes would freeze browser |
| `chat/page.tsx` | Message list grows unbounded (no pagination) | Long chats cause DOM bloat |
| `digest/page.tsx` | All documents rendered in a flat list | 500+ documents = slow initial render |

---

## 6. Memory & Resource Analysis

### Server Memory Hotspots

| Operation | Memory Usage | Risk |
|---|---|---|
| PDF parsing (`parsePDF`) | Entire PDF in memory + TextExtract buffer | 50MB PDF → ~200MB memory during parsing |
| Text joining (chunks → fullText) | Full document text repeated (chunks + joined) | 100-page doc → ~2MB, fine |
| Embedding result arrays | 1536 floats per chunk, 20 chunks → ~240KB | Negligible |
| Entity extraction (first 8K chars) | Truncated text + AI response | Fine |

### Client Memory Hotspots

| Component | Memory Usage | Risk |
|---|---|---|
| Chat message list (no limit) | ~10KB per message | 1000 messages → 10MB DOM + JS |
| Graph with 100+ nodes | ReactFlow state + DOM nodes | ~50MB for 200 nodes |
| File upload (10MB file) | Blob in memory | Fine |

---

## 7. Summary of Performance Hotspots (Ranked)

| Rank | Severity | Location | Issue | Impact |
|---|---|---|---|---|
| 1 | 🔴 **Critical** | `ingest/route.ts:43-55` | Sequential per-chunk embedding (no parallelism) | 200-chunk doc = 100s+ of embedding time |
| 2 | 🔴 **Critical** | `prisma/schema.prisma:81` | No pgvector index on `Chunk.embedding` | Vector search degrades to full scan after ~10K chunks |
| 3 | 🔴 **Critical** | `quiz/attempt/route.ts:48` | Sequential per-short-answer AI grading | 10 short answers = 10s+ of sequential AI calls |
| 4 | 🟡 **High** | `chat/route.ts:37-49` | N+1 document title lookups | Adds 5 extra DB round-trips per query |
| 5 | 🟡 **High** | `verify-token.ts:11-18` | External HTTP call on every API request | Adds 200-500ms base latency to every route |
| 6 | 🟡 **High** | `ingest/route.ts:68-73` | N+1 entity lookups for relationships | 50 relations = 100 extra DB queries |
| 7 | 🟡 **Medium** | `ingest/route.ts:46-54` | Per-chunk `$executeRawUnsafe` | 200 chunks = 200 sequential DB writes |
| 8 | 🟡 **Medium** | Multiple files | No AI API timeout | Request may hang until Vercel 60s limit |
| 9 | 🟡 **Medium** | `ingest/route.ts` | File uploaded then re-downloaded | Bandwidth doubled for every file |
| 10 | 🟢 **Low** | `graph/page.tsx:50-61` | No graph virtualization | Browser freeze at 500+ nodes |

### Recommendations (by ROI)

1. **Add pgvector IVFFlat index** on `Chunk.embedding` — single SQL command, fixes vector scan for all data sizes
2. **Parallelize chunk embedding** with `Promise.all` (rate-limited to 5 concurrent) — cuts ingest time by 5-10x
3. **Replace N+1 document lookups in chat** with a JOIN in `$queryRawUnsafe` — removes 5 round-trips
4. **Cache `verifyFirebaseToken`** with a 5-minute TTL — removes 200-500ms from every API call
5. **Add AI timeout wrapper** with `Promise.race` — prevents hung requests
6. **Batch entity lookups** in ingest — `findMany` with all relation names, build `Map`
7. **Parallelize short-answer grading** with `Promise.all` (rate-limited) — halves quiz attempt latency
8. **Document title in chunk insert** — avoid the lookup entirely
