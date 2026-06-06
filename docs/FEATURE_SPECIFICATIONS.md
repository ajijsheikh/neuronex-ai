# Feature Specifications

## Feature 1: Authentication & User Management

### 1. Purpose
To secure user data and ensure that personal knowledge graphs are completely isolated. Without authentication, we cannot provide a private "Second Brain."

### 2. User Problem Solved
Users need a secure, reliable way to access their private data across devices without worrying about unauthorized access.

### 3. User Stories
*   As a user, I want to sign up using my Google account so I don't have to remember a new password.
*   As a user, I want my data to be strictly separated from other users.

### 4. Acceptance Criteria
*   Users can sign up/log in via Google OAuth and Email/Password.
*   Upon signup, a user record is created in PostgreSQL.
*   Unauthenticated users are redirected to `/login`.

### 5. Frontend Requirements
*   **Pages:** `/login`, `/register`.
*   **Components:** `AuthForm` (Shadcn UI Card, Input, Button).
*   **State:** Firebase Auth state listener in a React Context (`AuthContext`).

### 6. Backend Requirements
*   Next.js Middleware to protect routes (`/dashboard`, `/graph`, `/chat`).

### 7. Database Requirements
*   `users` table in PostgreSQL mapped to Firebase UID.

### 8. API Endpoints
*   `POST /api/users/sync` - Syncs Firebase user to PostgreSQL on first login.

### 9. Edge Cases & Errors
*   **Edge Case:** User revokes Google access. **Handling:** Gracefully degrade, force re-login.
*   **Error State:** Network failure during login. Show Shadcn Toast error.

### 10. Analytics
*   `auth_signup`, `auth_login` (Method: Google/Email).

---

## Feature 2: Document Ingestion & Processing

### 1. Purpose
To get raw information into the system and transform it into structured graph data and vector embeddings.

### 2. User Problem Solved
Manually typing notes or extracting data from PDFs is tedious. Users need an automated way to digest large documents.

### 3. User Stories
*   As a researcher, I want to drag and drop multiple PDFs so they can be processed in bulk.
*   As a user, I want to see processing status so I know when my graph is updated.

### 4. Acceptance Criteria
*   Supports PDF and TXT up to 10MB.
*   Files are uploaded to Firebase Storage.
*   Document is chunked, embedded, and entities are extracted.

### 5. Frontend Requirements
*   **Components:** `Dropzone` (react-dropzone), `ProcessingQueue` (Shadcn Progress bar).
*   **UX Flow:** Drag file -> Uploading to Firebase -> Calling processing API -> Polling status -> Success/Graph Update.

### 6. Backend Requirements
*   API route must handle Firebase Storage triggers or direct client invocations.
*   LangChain PDF loader and recursive character text splitter.

### 7. Database Requirements
*   `documents` table, `chunks` table (with `pgvector` embedding column).

### 8. API Endpoints
*   `POST /api/documents/ingest` - Receives file metadata, starts pipeline.

### 9. AI Processing Flow
*   File -> LangChain -> Text Chunks -> Gemini (Embeddings) -> PostgreSQL.
*   Text Chunks -> Gemini (Entity Extraction Prompt) -> JSON -> PostgreSQL.

### 10. Edge Cases
*   **Edge Case:** Encrypted PDF. **Handling:** Reject immediately with error toast.
*   **Edge Case:** Vercel timeout. **Handling:** Offload processing to a background worker or chunk processing via client-orchestrated API calls.

### 11. Analytics
*   `doc_upload_started`, `doc_processing_success`, `doc_processing_failed`.

---

## Feature 3: Interactive Knowledge Graph (2D & 3D)

### 1. Purpose
To visualize the interconnected nature of the user's data, allowing for spatial navigation of knowledge.

### 2. User Problem Solved
Folders hide relationships. A visual graph shows how disparate concepts link together, sparking new insights.

### 3. User Stories
*   As a user, I want to see a web of topics generated from my documents.
*   As a user, I want to click a node to see all documents related to that topic.

### 4. Acceptance Criteria
*   2D graph renders using React Flow.
*   Nodes represent Entities; Edges represent Relationships.
*   3D view toggle using React Three Fiber.
*   Clicking a node opens a side panel with context.

### 5. Frontend Requirements
*   **Components:** `GraphViewer` (React Flow canvas), `ThreeScene` (R3F canvas), `NodeSidebar` (Shadcn Sheet).
*   **Interactions:** Zoom, Pan, Drag nodes, Click nodes.

### 6. Backend Requirements
*   Efficient querying of graph data from PostgreSQL.

### 7. Database Requirements
*   `entities` and `relationships` tables.

### 8. API Endpoints
*   `GET /api/graph/data` - Returns nodes and edges.

### 9. AI Processing Flow
*   Graph layout is determined by React Flow's force-directed layout algorithms (e.g., d3-force or elkjs).

### 10. Edge Cases
*   **Edge Case:** 10,000+ nodes crash the browser. **Handling:** Implement node clustering, pagination, or degree-based filtering (only show nodes with >2 connections).

### 11. Analytics
*   `graph_viewed`, `node_clicked`, `graph_3d_toggled`.

---

## Feature 4: AI Conversational Assistant (RAG)

### 1. Purpose
To allow users to retrieve specific information by "talking" to their documents, bypassing manual search.

### 2. User Problem Solved
Traditional keyword search fails when synonyms are used or context is needed.

### 3. User Stories
*   As a user, I want to ask a question and get an answer synthesized from my documents.
*   As a researcher, I want citations so I can verify the AI's claims.

### 4. Acceptance Criteria
*   Chat interface.
*   Answers are generated using Retrieval-Augmented Generation (RAG).
*   Sources are cited in the UI.

### 5. Frontend Requirements
*   **Components:** `ChatWindow`, `MessageBubble`, `CitationPill`.
*   Uses `ai` package (Vercel AI SDK) for streaming responses.

### 6. Backend Requirements
*   Vector similarity search using `pgvector`.
*   Prompt engineering to enforce citations.

### 7. Database Requirements
*   Querying the `chunks` table via cosine distance.

### 8. API Endpoints
*   `POST /api/chat` - Streaming endpoint.

### 9. AI Processing Flow
*   User Query -> Gemini (Embed Query) -> pgvector Search -> Top 5 chunks retrieved -> Gemini (Generate Answer with Context) -> Stream to Client.

### 10. Edge Cases
*   **Edge Case:** No relevant chunks found. **Handling:** AI responds "I cannot find an answer based on your documents."
*   **Edge Case:** Context window exceeded. **Handling:** Limit retrieved chunks to top K that fit within the 32k/128k Gemini token limit.

### 11. Analytics
*   `chat_query_sent`, `citation_clicked`.
