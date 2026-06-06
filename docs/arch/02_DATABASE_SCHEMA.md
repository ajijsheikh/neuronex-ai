# PostgreSQL Database Schema

**Engine:** PostgreSQL 16+ with `pgvector` 0.7+ extension.
**ORM:** Drizzle ORM (chosen over Prisma for first-class `pgvector` support, lower bundle size, and SQL-like control).
**Hosting:** Supabase or Neon (serverless Postgres with pgvector pre-installed).

---

## 1. Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

---

## 2. Tables

### 2.1 `users`

Synced from Firebase Auth on first login.

```sql
CREATE TABLE users (
  id            VARCHAR(128) PRIMARY KEY,   -- Firebase UID
  email         VARCHAR(320) NOT NULL UNIQUE,
  display_name  VARCHAR(256),
  avatar_url    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 `documents`

Metadata for each uploaded file.

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(512) NOT NULL,
  file_url        TEXT NOT NULL,             -- Firebase Storage URL
  file_type       VARCHAR(64) NOT NULL,      -- "application/pdf", "text/plain"
  file_size       INTEGER,                   -- bytes
  page_count      INTEGER,
  processing_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    -- enum: pending | processing | completed | failed
  error_message   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
```

### 2.3 `chunks`

Text segments with vector embeddings for RAG.

```sql
CREATE TABLE chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  embedding     VECTOR(768),                -- Gemini text-embedding-004
  page_number   INTEGER,
  chunk_index   INTEGER NOT NULL,           -- order within document
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON chunks(document_id);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```

### 2.4 `entities` (Knowledge Graph Nodes)

Concepts, people, technologies extracted by the AI.

```sql
CREATE TABLE entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(512) NOT NULL,
  type          VARCHAR(64) NOT NULL,
    -- enum: Person | Technology | Concept | Organization | Location | Event
  description   TEXT,                       -- LLM-generated summary (populated on merge)
  mention_count INTEGER DEFAULT 1,          -- how many chunks reference this entity
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, name)                    -- case-insensitive unique per user
);

CREATE INDEX idx_entities_user_id ON entities(user_id);
CREATE INDEX idx_entities_type ON entities(user_id, type);
```

### 2.5 `relationships` (Knowledge Graph Edges)

Directed edges connecting entities, grounded in source documents.

```sql
CREATE TABLE relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relation_type     VARCHAR(128) NOT NULL,
    -- e.g., "invented", "is part of", "uses", "developed by", "related to"
  weight            REAL DEFAULT 1.0,        -- confidence / frequency
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(source_entity_id, target_entity_id, relation_type, document_id)
);

CREATE INDEX idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX idx_relationships_document ON relationships(document_id);
```

---

## 3. Drizzle ORM Schema (`src/lib/db/schema.ts`)

```typescript
import { pgTable, uuid, varchar, text, integer, real, timestamp, vector, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("display_name", { length: 256 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 512 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 64 }).notNull(),
  fileSize: integer("file_size"),
  pageCount: integer("page_count"),
  processingStatus: varchar("processing_status", { length: 32 }).notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_documents_user_id").on(table.userId),
  statusIdx: index("idx_documents_status").on(table.processingStatus),
}));

export const chunks = pgTable("chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  pageNumber: integer("page_number"),
  chunkIndex: integer("chunk_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentIdIdx: index("idx_chunks_document_id").on(table.documentId),
  embeddingIdx: index("idx_chunks_embedding").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const entities = pgTable("entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 512 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  description: text("description"),
  mentionCount: integer("mention_count").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_entities_user_id").on(table.userId),
  typeIdx: index("idx_entities_type").on(table.userId, table.type),
  uniqueNamePerUser: uniqueIndex("unq_entities_user_name").on(table.userId, table.name),
}));

export const relationships = pgTable("relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceEntityId: uuid("source_entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  targetEntityId: uuid("target_entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  relationType: varchar("relation_type", { length: 128 }).notNull(),
  weight: real("weight").default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  sourceIdx: index("idx_relationships_source").on(table.sourceEntityId),
  targetIdx: index("idx_relationships_target").on(table.targetEntityId),
  documentIdx: index("idx_relationships_document").on(table.documentId),
  uniqueRelation: uniqueIndex("unq_relationship").on(
    table.sourceEntityId, table.targetEntityId, table.relationType, table.documentId
  ),
}));
```

---

## 4. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Single Postgres DB** (no Neo4j) | pgvector handles embeddings + graph relations + auth in one managed service. Massive DevOps reduction. |
| **VARCHAR(128) for user ID** | Firebase UIDs are fixed-length strings. Avoids UUID join overhead vs `users`. |
| **HNSW vector index** | Faster than IVFFlat at high recall. Slightly more memory, but acceptable for <1M chunks at MVP scale. |
| **UNIQUE(user_id, name) on entities** | Automatic deduplication at the DB level. Case-insensitive via `citext` extension or app-level normalization. |
| **`processing_status` on documents** | Enables client-side polling and async processing without a queue system for MVP. |
| **`chunk_index` ordering** | Preserves original document order for citation accuracy and re-assembly. |
| **Soft cascade deletes** | Deleting a document cascades to chunks, but entities are preserved (orphan cleanup runs separately). |
