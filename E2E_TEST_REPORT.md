# E2E Pipeline Verification Report

> **Date:** July 10, 2026
> **Scope:** End-to-end trace of all data pipelines from authentication through knowledge graph visualization
> **Method:** Static code analysis tracing every data flow step, input/output validation, error path, and edge case

---

## 1. Authentication Pipeline

### Flow

```
User → /login or /register → AuthForm → Firebase Auth SDK
    → onAuthStateChanged → AuthContext (client state)
    → syncUser() → POST /api/auth/sync → verifyFirebaseToken
    → Google Identity Toolkit API lookup
    → Prisma User.upsert → PostgreSQL
    → redirect /dashboard
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| Email/password auth | `AuthForm.tsx:46-50` | ✅ | `signInWithEmailAndPassword` / `createUserWithEmailAndPassword` |
| Google OAuth | `AuthForm.tsx:66-72` | ✅ | `signInWithPopup` + `GoogleAuthProvider` |
| GitHub OAuth | `AuthForm.tsx:89-95` | ✅ | `signInWithPopup` + `GithubAuthProvider` |
| Auth state listener | `AuthContext.tsx:49-66` | ✅ | `onAuthStateChanged` with loading/auth/unauthenticated/error |
| Firebase unconfigured guard | `FirebaseConfigWarning.tsx` | ✅ | Full-screen overlay when env vars missing |
| Token extraction | `verify-token.ts:39-41` | ✅ | Extracts Bearer token from Authorization header |
| Token verification | `verify-token.ts:1-37` | ✅ | Google Identity Toolkit `accounts:lookup` API |
| Auth sync API | `auth/sync/route.ts:16-20` | ✅ | `Prisma.user.upsert` with Firebase UID |
| Route protection | `dashboard/layout.tsx:73-75` | ✅ | Redirects to `/login` if unauthenticated |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟡 Medium | `syncUser()` is called in AuthForm but `onAuthStateChanged` also fires simultaneously. Token may not be available yet when `syncUser` calls `getIdToken()`. Both paths call the sync endpoint, potentially causing double upserts. | `AuthForm.tsx:107-118`, `AuthContext.tsx:49-66` |
| 2 | 🟢 Low | Auth sync does not propagate display name, email, or photo from Firebase. The User model stores only `id`, `email`, `name`, `image` — the sync route never writes email/name/image from the Firebase token. | `auth/sync/route.ts:16-20` |
| 3 | 🟢 Low | `AuthForm.tsx` catches errors with `err: any` — loses type safety. | `AuthForm.tsx:54,75,98` |

---

## 2. Document Upload → Firebase Storage Pipeline

### Flow

```
User drops file → UploadPage/Dropzone → File type & size validation
    → Firebase Storage (uploadBytesResumable)
    → progress tracking
    → getDownloadURL → downloadUrl
    → POST /api/documents/ingest
        → Create Document (status: "processing")
        → Fetch source from Firebase Storage URL
        → Parse PDF or read TXT
        → Chunk text
        → Generate embeddings (per chunk)
        → INSERT chunks (raw SQL with pgvector)
        → Extract entities via AI
        → Upsert entities in DB
        → Create relationships
        → Update Document (status: "ready")
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| File type validation | `upload/page.tsx:33-36` | ✅ | PDF and TXT only; 10MB max |
| Firebase Storage upload | `upload/page.tsx:41-42` | ✅ | `uploadBytesResumable` with progress |
| Storage URL retrieval | `upload/page.tsx:55` | ✅ | `getDownloadURL` after upload completes |
| Auth token for ingest | `upload/page.tsx:58` | ✅ | `user.getIdToken()` before API call |
| Ingest API entry | `ingest/route.ts:7-16` | ✅ | Token extraction + verification |
| Document DB creation | `ingest/route.ts:23-25` | ✅ | Prisma create with "processing" status |
| Source fetch (data: URL) | `ingest/route.ts:30-33` | ✅ | Base64 data URL support |
| Source fetch (HTTP) | `ingest/route.ts:35-39` | ✅ | HTTP fetch from Firebase Storage |
| PDF parsing | `lib/pdf.ts:1-11` | ✅ | `pdfjs-dist` dynamic import, text extraction |
| Text chunking | `lib/pdf.ts:13-22` | ✅ | 1000-char chunks, 200-char overlap |
| Embedding generation | `ingest/route.ts:45` | ✅ | `generateEmbedding(content)` per chunk |
| Raw SQL chunk insert | `ingest/route.ts:46-54` | ✅ | `$executeRawUnsafe` with `vector(1536)` cast |
| Entity extraction | `ingest/route.ts:57` | ✅ | `extractEntities(text)` via Gemini |
| Entity upsert | `ingest/route.ts:59-65` | ✅ | `Prisma.entity.upsert` with userId+name unique |
| Relationship creation | `ingest/route.ts:67-83` | ✅ | Entity lookup + Prisma create |
| Status update | `ingest/route.ts:86-89` | ✅ | "processing" → "ready" on success |
| Error handling | `ingest/route.ts:92-98` | ✅ | "processing" → "failed" on error |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🔴 **Critical** | `crypto.randomUUID()` in `ingest/route.ts:49` — This works in Node.js 19+ but Next.js 16 may run on Node 18+. If the global `crypto.randomUUID` is unavailable, chunk insertion will crash silently. Should use `crypto.randomUUID()` with explicit import or `cuid()` like other models. | `ingest/route.ts:49` |
| 2 | 🔴 **Critical** | `pdfjs-dist` is loaded via dynamic `await import("pdfjs-dist")` in `lib/pdf.ts:2` but is **not listed in `package.json`** as a dependency. This will fail at runtime if `pdfjs-dist` is not installed. It is also **not in `serverExternalPackages`** in `next.config.ts`, which means Next.js will try to bundle it with the server bundle, potentially causing failures. | `lib/pdf.ts:2`, `package.json`, `next.config.ts` |
| 3 | 🟡 **Medium** | Entity fetching in relationship creation loop: for each relation, two DB queries are executed (`findFirst` for source and target). With many relationships (>50), this creates O(2n) sequential DB queries with no batching. | `ingest/route.ts:68-73` |
| 4 | 🟡 **Medium** | No database transaction wrapping. If the process fails after some chunks are inserted but before entities/relations are created, the document will be marked "failed" but orphaned chunks will remain in the DB. | `ingest/route.ts:43-90` |
| 5 | 🟡 **Medium** | Chunk embedding is sequential (for loop with `await`). For a 100-page document producing ~200 chunks, this means 200 sequential API calls to Gemini with no parallelism. | `ingest/route.ts:43-55` |
| 6 | 🟢 **Low** | Text truncation for entity extraction: `text.slice(0, 8000)` limits extraction to first 8K chars. For long documents, entities in later sections will be missed. | `lib/ai.ts:23` |

---

## 3. PDF Parsing → Chunk Generation → Embeddings

### Flow

```
PDF Buffer → pdfjs-dist.getDocument → page iteration → getTextContent
    → text extraction (item.str join)
    → chunkText(text, 1000, 200)
    → for each chunk: generateEmbedding(content)
        → Gemini text-embedding-004 → embedding vector (1536 dims)
    → raw SQL INSERT INTO "Chunk" (id, documentId, content, embedding::vector)
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| PDF document load | `lib/pdf.ts:2-3` | ✅ | `getDocument({ data: Uint8Array })` |
| Page iteration | `lib/pdf.ts:5-6` | ✅ | `numPages` loop |
| Text content extraction | `lib/pdf.ts:7-8` | ✅ | `getTextContent()` → `item.str` join |
| Chunking logic | `lib/pdf.ts:13-22` | ✅ | Sliding window with overlap |
| Embedding model init | `lib/ai.ts:5` | ✅ | `text-embedding-004` |
| Embedding call | `lib/ai.ts:8-11` | ✅ | `embedContent(text)` → `values` |
| DB insert with vector | `ingest/route.ts:46-54` | ✅ | `$executeRawUnsafe` with `::vector` cast |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🔴 **Critical** | `pdfjs-dist` is **not declared in package.json**. This dependency is loaded at runtime via dynamic import. If not present in `node_modules`, it will throw MODULE_NOT_FOUND. Additionally, it's not in `serverExternalPackages`, so Next.js SWC/Turbopack bundler may try to bundle it, which can fail with native modules. | `lib/pdf.ts:2` |
| 2 | 🟡 **Medium** | Chunk boundary is naive (simple character count with no sentence/paragraph awareness). The overlap may split in the middle of a word. | `lib/pdf.ts:13-22` |
| 3 | 🟡 **Medium** | Embedding dimension `1536` is hardcoded in the Prisma schema (`vector(1536)`) and assumed throughout. If `text-embedding-004` changes its output dimension, the entire DB schema breaks. | `prisma/schema.prisma:81` |
| 4 | 🟢 **Low** | No PDF page number tracking — the `pageNumber` field in the chunk insert is always `null`. | `ingest/route.ts:53` |

---

## 4. Entity Extraction → Relationship Creation → PostgreSQL

### Flow

```
Document text (first 8K chars) → Gemini chat model
    → JSON { entities: [{name, type}], relations: [{source, target, type}] }
    → For each entity: Prisma.entity.upsert (unique: userId + name)
    → For each relation:
        → findFirst source entity (userId + name)
        → findFirst target entity (userId + name)
        → Prisma.relationship.create
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| Extraction prompt | `lib/ai.ts:16-23` | ✅ | Structured JSON output |
| Response parsing | `lib/ai.ts:26-28` | ✅ | Markdown code block stripping + JSON.parse |
| Entity upsert | `ingest/route.ts:59-65` | ✅ | Unique constraint `[userId, name]` |
| Source entity lookup | `ingest/route.ts:68-70` | ✅ | `findFirst` by userId + name |
| Target entity lookup | `ingest/route.ts:71-73` | ✅ | `findFirst` by userId + name |
| Relationship create | `ingest/route.ts:74-82` | ✅ | Only if both entities exist |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟡 **Medium** | Entity extraction is limited to first 8,000 characters of text. For documents >8K chars, entities and relationships in later sections are completely ignored. | `lib/ai.ts:23` |
| 2 | 🟡 **Medium** | If Gemini returns malformed JSON (e.g., trailing comma, unescaped quotes), `JSON.parse(cleaned)` on line 28 will throw. There is no fallback retry or repair logic. | `lib/ai.ts:28` |
| 3 | 🟢 **Low** | Relationship creation uses `findFirst` (sequential) rather than `findMany` (batched). For 50+ relations, this is 100 sequential DB queries. | `ingest/route.ts:68-73` |

---

## 5. Vector Search → RAG Pipeline → AI Chat

### Flow

```
User query → POST /api/chat → generateEmbedding(query)
    → $queryRawUnsafe: SELECT chunks ORDER BY embedding <=> $1::vector LIMIT 5
    → For each chunk: fetch document title
    → Assemble context with [Source N: docTitle] citations
    → generateChatResponse(query, contextChunks)
        → Gemini prompt: "Answer based on context, cite sources"
    → Return { answer: response }
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| Query embedding | `chat/route.ts:23` | ✅ | `generateEmbedding(query)` |
| Vector search SQL | `chat/route.ts:26-35` | ✅ | `$queryRawUnsafe` with `<=>` cosine distance |
| Document title fetch | `chat/route.ts:37-49` | ✅ | Per-chunk `findUnique` for title |
| Empty context handling | `chat/route.ts:51-55` | ✅ | "Cannot find an answer" fallback |
| Context assembly | `lib/ai.ts:35-37` | ✅ | `[Source N: docTitle]\ncontent` format |
| Chat prompt | `lib/ai.ts:39-46` | ✅ | Source citation instruction |
| Gemini call | `lib/ai.ts:48-49` | ✅ | `generateContent(prompt)` |
| Error handling | `chat/route.ts:59-62` | ✅ | Returns 500 with error message |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟡 **Medium** | `$queryRawUnsafe` embedding parameter `[${embedding.join(",")}]` is a raw string interpolated into SQL. While the `::vector` cast prevents injection, the string format could cause pgvector parsing errors if embedding contains NaN or Infinity values (unlikely but possible). | `chat/route.ts:24,31` |
| 2 | 🟡 **Medium** | The chat response assembles context with [Source N] notation, but the **chat page UI** (`chat/page.tsx`) does not parse/render source citations. The raw text including `[Source 1: Some Doc]` is displayed verbatim. Users see citation markers without any interactive source linking. | `chat/page.tsx:81` |
| 3 | 🟡 **Medium** | Per-chunk document title fetch creates N+1 queries. For 5 chunks, this adds 5 extra round-trips to PostgreSQL. A single JOIN in the initial query would be more efficient. | `chat/route.ts:37-49` |
| 4 | 🟢 **Low** | No query input sanitization or length limit. Large queries will be embedded and searched as-is, consuming Gemini API tokens. | `chat/route.ts:17-20` |

---

## 6. Knowledge Graph Generation

### Flow

```
GET /api/graph/data → Prisma.entity.findMany (userId)
    → Prisma.relationship.findMany (via source/target entity userId)
    → Returns { entities, relations, documentCount }

UI → ReactFlow renders nodes (colored by type) + edges (animated, labeled)
    → Node click → Sheet with type, connections, related documents
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| Entity query | `graph/data/route.ts:16-19` | ✅ | All entities for user |
| Relationship query | `graph/data/route.ts:21-44` | ✅ | Includes source/target entity + document data |
| Document count | `graph/data/route.ts:46-48` | ✅ | `count` where status = "ready" |
| Node rendering | `graph/page.tsx:50-61` | ✅ | Colored by type, positioned in circle |
| Edge rendering | `graph/page.tsx:63-73` | ✅ | Animated smoothstep with arrow markers |
| Details sheet | `graph/page.tsx:139-166` | ✅ | Type, connections count, linked documents |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟢 **Low** | Node positions are computed deterministically using `sin/cos` with fixed scaling. For large graphs (50+ nodes), nodes will overlap and cluster tightly. No force-directed layout or collision avoidance. | `graph/page.tsx:53` |
| 2 | 🟢 **Low** | Relationship query double-filters by `sourceEntity.userId` AND `targetEntity.userId`. This is redundant if both entities belong to the same user (which they always do since both are filtered). Redundant WHERE clause slightly reduces query performance. | `graph/data/route.ts:23-27` |

---

## 7. AI Module Pipeline (Summaries, Study Notes, Quiz, Flashcards)

### Flow

```
POST /api/summaries|study-notes|quiz/generate|flashcards/generate
    → Verify token → Find document → Read chunks
    → Join chunk text → Send to Gemini with type-specific prompt
    → Parse response → Store in DB → Return result
```

### Verification

| Module | File | Status | Notes |
|---|---|---|---|
| Summarization | `summarize.ts:31-57` | ✅ | 5 types with token limits |
| Study Notes | `study-notes.ts:16-51` | ✅ | 5 levels, title extraction |
| Quiz Generation | `quiz.ts:36-92` | ✅ | 4 types, difficulty, JSON response with fallback |
| Flashcard Generation | `flashcards.ts:17-62` | ✅ | Count-controlled, JSON with fallback |
| Auth verification | All route files | ✅ | All 4 generate routes verify tokens |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🔴 **Critical** | **All 5 AI module files** use `process.env.GEMINI_API_KEY!` at the module top level. If `GEMINI_API_KEY` is undefined, `new GoogleGenerativeAI(undefined)` will throw an error when the module is first imported, crashing any API route that imports it. This should have a runtime guard. | `lib/ai.ts:3`, `summarize.ts:3`, `study-notes.ts:3`, `quiz.ts:3`, `flashcards.ts:3` |
| 2 | 🟡 **Medium** | No AI API timeout. If Gemini is slow or hangs, the request will wait indefinitely (until Vercel's 10s/60s function timeout). | All AI module files |
| 3 | 🟡 **Medium** | No retry logic for Gemini API failures. A transient 429 (rate limit) or 500 from Gemini will propagate as an unhandled error. | All AI module files |
| 4 | 🟡 **Medium** | Text truncation limits vary: 30K chars (summarize, study-notes), 25K chars (quiz, flashcards), 8K chars (entity extraction). Documents exceeding these limits will have incomplete AI output. | All prompt files |
| 5 | 🟢 **Low** | Quiz generation JSON parsing has a fallback regex, but if the response contains multiple `{}` objects, the regex may match the wrong one. | `quiz.ts:86` |

---

## 8. SRS (Spaced Repetition) Pipeline

### Flow

```
User rates card (0-3) → POST /api/flashcards/[id]/review
    → processReview(rating, easeFactor, interval, repetitions)
    → SM-2 algorithm → new easeFactor, interval, repetitions, nextReviewAt
    → Prisma.flashcard.update + FlashcardReview.create
    → Return updated card
```

### Verification

| Step | File | Status | Notes |
|---|---|---|---|
| Rating validation | `review/route.ts:17-19` | ✅ | Must be 0-3 |
| SRS processing | `srs.ts:38-100` | ✅ | SM-2 algorithm with quality mapping |
| DB update | `review/route.ts:29-38` | ✅ | Flashcard updated with new SRS params |
| Review history | `review/route.ts:40-46` | ✅ | FlashcardReview record created |
| Deck stats | `srs.ts:138-168` | ✅ | Total, new, learning, review, mastered, dueToday |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟢 **Low** | The "Again" rating (0) maps to SM-2 quality 1. Cards rated "Again" get `interval = 0`, which sets `nextReviewAt` to 10 minutes from now. These cards will immediately reappear in the due queue, potentially causing infinite review loops for difficult cards. | `srs.ts:87-89` |

---

## 9. Database Schema Integrity

### Verification

| Model | File | Status | Notes |
|---|---|---|---|
| User | `schema.prisma:14-50` | ✅ | 14 relation fields, all with onDelete |
| Document | `schema.prisma:52-75` | ✅ | Chunks, entities, relationships cascade |
| Chunk | `schema.prisma:77-86` | ✅ | `vector(1536)` extension field |
| Entity | `schema.prisma:88-101` | ✅ | Unique constraint `[userId, name]` |
| Relationship | `schema.prisma:103-114` | ✅ | Self-referential FK to Entity |
| pgvector extension | `schema.prisma:9` | ✅ | Declared in datasource |
| Database URL | `schema.prisma:8` | ✅ | From `DATABASE_URL` env var |

### Issues Found

| # | Severity | Description | File |
|---|---|---|---|
| 1 | 🟡 **Medium** | No `@@index` on `Chunk.embedding` for vector search. The `<=>` operator in `chat/route.ts` will perform a full table scan on large datasets. pgvector requires an IVFFlat or HNSW index for performance. | `prisma/schema.prisma:77-86` |
| 2 | 🟢 **Low** | `Chunk.pageNumber` defaults to `null` and is never populated. The page number is lost during PDF parsing. | `ingest/route.ts:53` |

---

## Summary of Broken Links

| # | Severity | Component | Issue | Impact |
|---|---|---|---|---|
| 1 | 🔴 **Critical** | PDF Parsing | `pdfjs-dist` not in `package.json` or `serverExternalPackages` | PDF uploads will crash at runtime |
| 2 | 🔴 **Critical** | AI Modules | `GEMINI_API_KEY!` non-null assertion in 5 files | All AI features crash if env var is missing |
| 3 | 🟡 **High** | Chunk Insert | `crypto.randomUUID()` may not be available in older Node | Chunk insertion fails silently |
| 4 | 🟡 **Medium** | Vector Search | No pgvector index on `Chunk.embedding` | Performance degrades with data growth |
| 5 | 🟡 **Medium** | Entity Extraction | Limited to first 8K chars of text | Nodes/edges missing for long documents |
| 6 | 🟡 **Medium** | Chat UI | Source citations not rendered interactively | Users see raw [Source N] markers |
| 7 | 🟡 **Medium** | Ingest Pipeline | No transaction wrapping | Orphaned chunks on partial failures |
| 8 | 🟡 **Medium** | Chunk Embedding | Sequential per-chunk API calls | Slow ingest for large documents |
| 9 | 🟡 **Medium** | AI API Calls | No timeout or retry logic | Transient errors crash features |

### Pipeline Integrity Score: **6/9** (2 critical, 7 medium/low issues found)

| Pipeline Segment | Status |
|---|---|
| Authentication | ✅ Clean (1 minor race condition) |
| Upload → Storage | ✅ Clean |
| PDF Parsing → Chunks | ❌ **Broken** — `pdfjs-dist` missing from dependencies |
| Embedding Generation | ⚠️ Functional — fragile without env var guard |
| Entity Extraction | ⚠️ Functional — limited to 8K chars |
| PostgreSQL Storage | ✅ Clean |
| Vector Search | ⚠️ Functional — requires pgvector index for scale |
| RAG Chat | ✅ Clean (citation UX is cosmetic) |
| Knowledge Graph | ✅ Clean |
