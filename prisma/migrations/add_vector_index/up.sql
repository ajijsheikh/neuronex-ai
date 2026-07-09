CREATE INDEX IF NOT EXISTS idx_chunk_embedding ON "Chunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
