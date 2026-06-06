# RAG Architecture (Retrieval-Augmented Generation)

## 1. Overview
The RAG pipeline enables the AI Conversational Assistant to answer user queries based *only* on the ingested knowledge graph and documents. It ensures source grounding and prevents AI hallucinations.

## 2. Architecture Flow

1.  **User Query Input:** The user types a question into the chat UI (e.g., "What did Dr. Smith say about neural networks?").
2.  **Query Embedding:** The backend calls `gemini-text-embedding-004` to convert the string query into a dense vector (e.g., 768 dimensions).
3.  **Vector Search (pgvector):**
    *   The backend performs a Cosine Similarity search against the `chunks.embedding` column in PostgreSQL.
    *   **Filter:** Strictly filter by the authenticated user's `user_id` to prevent data leakage.
    *   **Retrieval:** Fetch the top `K` (e.g., 5) most similar chunks.
    ```sql
    SELECT id, content, document_id, page_number
    FROM chunks
    WHERE document_id IN (SELECT id FROM documents WHERE user_id = ?)
    ORDER BY embedding <=> ? -- Cosine distance operator in pgvector
    LIMIT 5;
    ```
4.  **Context Assembly:** The retrieved chunks are formatted into a single context string, appending citation metadata.
    ```text
    Context 1: [DocID: 123, Page: 4] "Neural networks are..."
    Context 2: [DocID: 456, Page: 1] "Smith's findings show..."
    ```
5.  **LLM Generation:** The system prompt and context are sent to `gemini-1.5-pro` (or flash).
    *   **System Prompt:** "You are NEURONEX, a helpful knowledge assistant. Answer the user's question using ONLY the provided context. If the answer is not in the context, say 'I cannot find the answer in your documents.' Always append citations in the format [DocID, Page] when stating a fact."
6.  **Streaming Output:** The response is streamed back to the Next.js client using Vercel AI SDK.

## 3. Advanced Implementation Details

### Hybrid Search (Keyword + Vector)
Standard vector search can fail on exact keyword matches (e.g., searching for a specific ID number).
*   **Solution:** Combine `pgvector` similarity with PostgreSQL Full-Text Search (`to_tsvector`). Use Reciprocal Rank Fusion (RRF) to merge the results before passing them to the LLM. (V2 feature).

### Graph-Augmented RAG (GraphRAG)
Instead of just fetching text chunks, we also fetch the immediate neighbor nodes from the knowledge graph related to the entities detected in the user's query.
*   **Flow:** Query -> Extract Entities -> Fetch Graph Neighbors -> Inject Neighbor metadata into the context window -> LLM Generation. This gives the LLM structural context (e.g., "A is connected to B").

## 4. Edge Cases
*   **Large Context Windows:** If the top 5 chunks exceed the LLM's token limit, truncate the context dynamically based on a token-counting library (e.g., `tiktoken` equivalent for Gemini) before sending.
