# API Route Structure

**Base:** `/api`  
**Auth:** Bearer JWT (Firebase) in `Authorization` header  
**Error Format:** `{ "error": { "code": string, "message": string } }`

---

## Route Table

```
POST   /api/auth/sync                 # Sync Firebase user to Postgres
GET    /api/documents                  # List user's documents
POST   /api/documents/ingest          # Trigger AI pipeline for uploaded file
GET    /api/documents/[id]            # Get document metadata + status
DELETE /api/documents/[id]            # Delete document + chunks + orphan entities
GET    /api/documents/[id]/chunks     # Get text chunks for a document
GET    /api/graph                     # Get nodes + edges for React Flow
GET    /api/graph/search?q=           # Search entities by name prefix
GET    /api/entities/[id]             # Get entity detail + connected docs
GET    /api/entities/[id]/relations   # Get entity's immediate neighbors
POST   /api/chat                      # Streaming RAG chat response
```

---

## 2. Route Specifications

### 2.1 `POST /api/auth/sync`

Called once on client-side login. Creates user row if not exists.

```
Request:  Authorization: Bearer <firebase-jwt>
          Body: (none — extracted from JWT)

Response 200:
{
  "user": { "id": "firebase-uid", "email": "user@example.com", "displayName": "Alice" }
}
```

### 2.2 `GET /api/documents`

Paginated list of user's documents, newest first.

```
Query:    ?page=1&limit=20&status=completed

Response 200:
{
  "documents": [
    {
      "id": "uuid",
      "title": "paper.pdf",
      "fileType": "application/pdf",
      "processingStatus": "completed",
      "pageCount": 12,
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 2.3 `POST /api/documents/ingest`

Client uploads file to Firebase Storage first, then calls this with the resulting URL.

```
Request:
{
  "fileUrl": "https://storage.googleapis.com/...",
  "fileName": "paper.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576
}

Response 202:
{
  "documentId": "uuid",
  "status": "pending"
}
```

**Processing flow (async, within request — for MVP with small files):**
1. Create `documents` row (status: `pending`)
2. Download file from Firebase Storage
3. Extract text via LangChain PDF loader
4. Chunk text (RecursiveCharacterTextSplitter, 1000 chars, 200 overlap)
5. Generate embeddings for each chunk (Gemini embedding model)
6. Extract entities + relationships (Gemini text model with structured output)
7. Insert chunks, entities, relationships in transaction
8. Update `documents` row (status: `completed` or `failed`)

**For files expected to exceed Vercel's 60s timeout**, the client polls `GET /api/documents/[id]` every 3s until status is `completed` or `failed`. In V2, a queue worker handles this.

### 2.4 `DELETE /api/documents/[id]`

Cascade-deletes chunks. Orphan entities (entities with no remaining relationships) are cleaned up in a background sweep.

```
Response 200:
{ "message": "Document deleted", "orphanEntitiesRemoved": 3 }
```

### 2.5 `GET /api/graph`

Returns nodes and edges for React Flow. Supports pagination and filtering to prevent browser overload.

```
Query:    ?limit=500&type=Person,Concept&minConnections=2

Response 200:
{
  "nodes": [
    { "id": "uuid", "position": { "x": 0, "y": 0 },
      "data": { "label": "Alan Turing", "type": "Person", "mentionCount": 5 } }
  ],
  "edges": [
    { "id": "uuid", "source": "uuid-1", "target": "uuid-2",
      "label": "invented", "animated": true }
  ]
}
```

Positions are computed client-side by React Flow's layout algorithm (d3-force). Server returns no positions.

### 2.6 `GET /api/entities/[id]`

```
Response 200:
{
  "entity": {
    "id": "uuid",
    "name": "Quantum Computing",
    "type": "Concept",
    "description": "A field of computing...",
    "mentionCount": 12,
    "createdAt": "..."
  },
  "relatedDocuments": [
    { "id": "uuid", "title": "QC Survey.pdf", "pageCount": 20 }
  ],
  "relatedEntities": [
    { "id": "uuid", "name": "Superposition", "type": "Concept", "relationType": "is part of" }
  ]
}
```

### 2.7 `POST /api/chat`

Streaming endpoint using Vercel AI SDK.

```
Request:
{
  "messages": [
    { "role": "user", "content": "What did Turing invent?" }
  ]
}

Response: Server-Sent Events (text/event-stream)
```

**Server flow:**
1. Embed user's last message via Gemini embedding model
2. Vector search: `SELECT ... ORDER BY embedding <=> $embedding LIMIT 5`
3. Enforce user isolation via `WHERE document_id IN (subquery scoped to user_id)`
4. Assemble context with citation metadata
5. Stream Gemini response via `StreamingTextResponse`

**Response includes citation metadata** appended as a final SSE data event:

```
data: {"citations": [{"docId": "uuid", "pageNumber": 4, "title": "paper.pdf"}]}
```

---

## 3. Middleware Stack (per route)

```
request
  ├── rateLimiter()          # Upstash Redis: 20 req/min for chat, 5/min for ingest
  ├── authenticate()         # Firebase Admin SDK: verify JWT → attach `userId` to request
  ├── validateBody()         # Zod schema validation
  ├── handler()              # Route logic
  └── errorHandler()         # Catch + format → { error: { code, message } }
```

## 4. Shared Utilities

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | `authenticate()` middleware, extracts `userId` from JWT |
| `src/lib/rate-limit.ts` | Sliding window rate limiter backed by Upstash Redis |
| `src/lib/db/queries/graph.ts` | `getNodesAndEdges(userId, filters)` |
| `src/lib/db/queries/chat.ts` | `vectorSearch(userId, embedding, limit)` |
| `src/lib/ai/rag-pipeline.ts` | `generateRagResponse(messages, userId)` — full orchestration |
