# API Specification

Base URL: `/api`
Authentication: Bearer Token (Firebase JWT) passed in `Authorization` header.

## 1. Authentication

### `POST /api/auth/sync`
Syncs the Firebase user to the PostgreSQL database.
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:** None (User details extracted from JWT).
*   **Response (200):** `{ "message": "User synced", "user": { "id", "email" } }`

## 2. Documents

### `POST /api/documents/ingest`
Triggers the AI processing pipeline for an uploaded document.
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "fileUrl": "gs://bucket/path/to/file.pdf",
      "fileName": "Research_Paper_2025.pdf",
      "fileType": "application/pdf"
    }
    ```
*   **Response (202 Accepted):** `{ "message": "Processing started", "documentId": "uuid" }`
*   *Implementation Note:* The actual processing may take longer than a serverless timeout. Consider returning 202 and allowing the client to poll status.

### `GET /api/documents`
Lists all documents for the authenticated user.
*   **Response (200):** `{ "documents": [ { "id", "title", "createdAt" } ] }`

### `DELETE /api/documents/:id`
Deletes a document, its chunks, and associated orphan entities/relationships.
*   **Response (200):** `{ "message": "Deleted" }`

## 3. Knowledge Graph

### `GET /api/graph`
Retrieves nodes and edges for rendering the React Flow graph.
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `?limit=500` (optional)
*   **Response (200):**
    ```json
    {
      "nodes": [
        { "id": "uuid", "data": { "label": "Alan Turing", "type": "Person" } }
      ],
      "edges": [
        { "id": "uuid", "source": "node_uuid_1", "target": "node_uuid_2", "label": "invented" }
      ]
    }
    ```

## 4. Chat (RAG)

### `POST /api/chat`
Streams the LLM response based on user query and vector search.
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "messages": [
        { "role": "user", "content": "What did Turing invent?" }
      ]
    }
    ```
*   **Response (200 Stream):** Server-Sent Events (SSE) streaming text chunks, compatible with Vercel AI SDK `StreamingTextResponse`.
*   *Implementation Note:* The response must include custom headers or appended metadata containing the citations (document IDs and page numbers).
