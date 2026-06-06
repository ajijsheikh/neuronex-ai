# AI Pipeline

## 1. Pipeline Overview
The AI Pipeline is responsible for converting unstructured files (PDFs, TXT) into structured graph data (Entities/Relationships) and searchable vectors (Chunks/Embeddings). It relies on **LangChain JS** and the **Google Gemini API**.

## 2. Step-by-Step Flow

### Phase 1: Text Extraction & Chunking
1.  **Load:** Use LangChain's `WebPDFLoader` or `PDFLoader` to extract raw text and page numbers from the file URL in Firebase Storage.
2.  **Clean:** Remove excessive whitespace, non-printable characters.
3.  **Split:** Use LangChain's `RecursiveCharacterTextSplitter`.
    *   `chunkSize`: 1000 characters.
    *   `chunkOverlap`: 200 characters (ensures context isn't lost between boundaries).

### Phase 2: Embedding Generation
1.  Map over the generated chunks.
2.  Call Gemini Embedding Model (e.g., `text-embedding-004`).
3.  Store the chunk text, page number, document ID, and the generated vector array in the PostgreSQL `chunks` table using Prisma.

### Phase 3: Graph Extraction (Entity & Relationship Mining)
*This is the most critical and complex part of the AI pipeline.*
1.  For each chunk (or batches of chunks to save tokens), prompt the Gemini Text Model (e.g., `gemini-1.5-flash` for speed/cost).
2.  **System Prompt:**
    ```text
    You are an expert data extractor. Given the following text, extract key entities and their relationships to build a knowledge graph.
    Only extract highly relevant nouns, concepts, technologies, and people.
    Return the result STRICTLY as a JSON object matching this schema:
    {
      "entities": [ {"name": "String", "type": "Person | Technology | Concept | Organization | Location"} ],
      "relationships": [ {"source": "EntityName", "target": "EntityName", "relation": "String (e.g., 'created', 'uses', 'is part of')"} ]
    }
    Do not include markdown blocks. Only output raw JSON.
    ```
3.  **Parsing:** Parse the JSON response.
4.  **Deduplication (Crucial step):** Before inserting into PostgreSQL, check if the entity `name` (case-insensitive) already exists for this `user_id`.
    *   If Yes -> Get existing Entity ID.
    *   If No -> Insert new Entity, get new ID.
5.  **Linking:** Insert relationships into the `relationships` table using the resolved Entity IDs.

## 3. Error Handling & Edge Cases
*   **JSON Parsing Failure:** Gemini might output malformed JSON.
    *   *Mitigation:* Use LangChain's `StructuredOutputParser` or Gemini's strict JSON response mime-type feature. Wrap in a try-catch and retry up to 2 times.
*   **Rate Limits:** High volume of chunks will trigger 429 Too Many Requests.
    *   *Mitigation:* Use an exponential backoff utility (e.g., `p-retry`) around API calls. Implement batching (processing 5 chunks at a time).

## 4. Future Improvements (V2)
*   **Coreference Resolution:** AI currently might extract "Turing" in one chunk and "Alan Turing" in another. Implement an LLM pass to merge similar nodes.
*   **Incremental Updates:** If a document is modified, only re-process the changed chunks.
