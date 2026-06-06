# GitHub Issues (Ready to Import)

*Copy and paste these directly into GitHub Issues.*

---

### [Setup] Initialize Next.js, Tailwind, & Shadcn UI
**Description:**
Set up the base repository.
**Tasks:**
- [ ] Run `npx create-next-app@latest`.
- [ ] Initialize Tailwind CSS.
- [ ] Initialize Shadcn UI (`npx shadcn-ui@latest init`).
- [ ] Add basic layout wrapper (Navbar, Main Content Area).
**Labels:** `infrastructure`, `frontend`

---

### [Database] Provision PostgreSQL & Prisma Schema
**Description:**
Set up the remote database and ORM.
**Tasks:**
- [ ] Create Supabase/Neon project.
- [ ] Enable `pgvector` extension in DB.
- [ ] Initialize Prisma (`npx prisma init`).
- [ ] Write schema models for User, Document, Chunk, Entity, Relationship.
- [ ] Run first migration.
**Labels:** `infrastructure`, `backend`

---

### [Auth] Firebase Authentication Flow
**Description:**
Implement user login and route protection.
**Tasks:**
- [ ] Set up Firebase project & add web credentials.
- [ ] Build Login/Signup Page with Shadcn UI components.
- [ ] Implement Google OAuth provider.
- [ ] Create Next.js Middleware to protect `/dashboard`.
- [ ] Create `/api/auth/sync` to ensure Firebase UID exists in Postgres `users` table.
**Labels:** `auth`, `frontend`, `backend`

---

### [Ingestion] PDF Upload & Storage
**Description:**
Allow users to drag-and-drop files to Firebase Storage.
**Tasks:**
- [ ] Build React Dropzone component on Dashboard.
- [ ] Implement Firebase Storage upload logic.
- [ ] Call Next.js API route `/api/documents/ingest` with the resulting file URL.
**Labels:** `feature`, `frontend`

---

### [AI] LangChain Document Splitting & Embeddings
**Description:**
Process the uploaded file into searchable vectors.
**Tasks:**
- [ ] In `/api/documents/ingest`, fetch file from Firebase.
- [ ] Use LangChain `PDFLoader` and `RecursiveCharacterTextSplitter`.
- [ ] Generate embeddings using Gemini API.
- [ ] Save chunks and embeddings to Postgres `chunks` table.
**Labels:** `feature`, `ai`, `backend`

---

### [AI] Knowledge Graph Entity Extraction
**Description:**
Use LLM to pull nodes and edges from text chunks.
**Tasks:**
- [ ] Write Gemini system prompt for JSON entity/relationship extraction.
- [ ] Pass chunks through the LLM.
- [ ] Implement deduplication logic (check if entity exists before inserting).
- [ ] Save to `entities` and `relationships` tables.
**Labels:** `feature`, `ai`, `backend`

---

### [UI] React Flow 2D Canvas
**Description:**
Render the graph interactively on the frontend.
**Tasks:**
- [ ] Build `/api/graph` to return node/edge JSON.
- [ ] Install `reactflow`.
- [ ] Map API data to React Flow elements.
- [ ] Implement Elk.js or d3-force for automated layout (no overlapping nodes).
- [ ] Style custom nodes with Tailwind.
**Labels:** `feature`, `frontend`

---

### [AI] Conversational RAG Chat
**Description:**
Allow users to chat with their documents.
**Tasks:**
- [ ] Build chat UI sidebar using Vercel AI SDK.
- [ ] Create `/api/chat` streaming endpoint.
- [ ] Implement vector similarity search (Cosine distance) using pgvector.
- [ ] Format retrieved chunks into context for the Gemini prompt.
- [ ] Return streaming text with citation markers.
**Labels:** `feature`, `ai`, `frontend`, `backend`
