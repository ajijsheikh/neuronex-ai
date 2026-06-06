# Product Requirements Document: NEURONEX

## Part 1: Critical Analysis & Strategy (The "Why")

### 1.1 Executive Strategic Review
*Perspectives from a Senior PM, Principal Architect, AI Engineer, and Hackathon Judge.*

**The Pitch:** An AI-powered Personal Knowledge Operating System that automatically turns scattered files into an interconnected knowledge graph.

**The Flaws & Overengineering (What we are cutting):**
1. **Blockchain Layer (Stellar):** For a *personal* knowledge base, a distributed ledger solves a problem that doesn't exist. Users don't need cryptographic proof of their own notes unless they are acting as a notary or issuing credentials. **Verdict:** Removed from MVP and core vision. It adds friction, infrastructure overhead, and zero user value for the core persona.
2. **Dual Backend Complexity:** Proposing both Next.js and NestJS alongside PostgreSQL and Neo4j for a 1-3 month hackathon is a recipe for integration hell. **Verdict:** We are dropping NestJS. Next.js App Router will serve as the full-stack framework to accelerate development.
3. **Dual Database Overhead:** Using both Postgres (with pgvector) and Neo4j is too heavy for a small team. **Verdict:** We will consolidate. We will use **PostgreSQL with pgvector**. While Neo4j is great for graphs, Postgres can handle lightweight graph relations, vector embeddings, and relational user data in one managed service (e.g., Supabase or Neon), massively reducing DevOps overhead.
4. **3D Knowledge Universe (Three.js):** While visually stunning, 3D graphs are notoriously hard to navigate and provide poor UX for actual text reading. **Verdict:** Moved to "Future Vision" / Hackathon "Wow Factor" (if time permits). We will prioritize a highly polished, functional 2D graph using React Flow for the MVP.
5. **Knowledge Gap Detection:** Automatically detecting what a user *doesn't* know requires a pre-existing universal ontology, which is highly complex. **Verdict:** Pushed to V2.

### 1.2 Competitor Comparison & UVP
| Competitor | Focus | Weakness for our Persona | NEURONEX Advantage |
| :--- | :--- | :--- | :--- |
| **Notion** | All-in-one workspace | Requires high manual effort to build structures; rigid databases. | **Zero-friction ingestion.** AI automatically structures and links data without manual tagging. |
| **Obsidian** | Local-first, manual graph | Steep learning curve; relies on user manually creating [[links]]. | **Auto-linking.** The knowledge graph builds itself via AI entity extraction. |
| **NotebookLM** | Source-grounded AI | Isolated notebooks; no global interconnected knowledge base. | **Global Context.** A continuous, evolving brain where everything connects. |

**Unique Value Proposition (UVP):** 
*NEURONEX is the zero-friction Second Brain. You don't organize it; it organizes itself. Upload anything, and let AI build an interactive, conversational web of your mind.*

---

## Part 2: Product Requirements Document (The "What" & "How")

### 2.1 Executive Summary
**Project Name:** NEURONEX  
**Tagline:** Transform Scattered Information into Connected Intelligence  
**Vision:** Build an AI-powered second brain that understands, remembers, connects, and automatically evolves with the user’s knowledge, eliminating the friction of manual organization.

### 2.2 Problem Statement
Modern information is fragmented across PDFs, screenshots, bookmarks, and notes. Existing tools require manual filing, tagging, and linking. Users lose valuable insights because they forget where they saved things or fail to see the connections between disparate pieces of information.

### 2.3 User Personas
1. **The Researcher (Primary):** Overwhelmed with academic papers and PDFs. Needs to find connections between authors, theories, and data points across hundreds of documents.
2. **The Lifelong Learner:** Consumes podcasts, articles, and books. Wants a searchable "external brain" to recall concepts and synthesize ideas over time.
3. **The Developer:** Saves snippets, documentation, and architecture diagrams. Needs quick retrieval based on semantic meaning, not just exact keyword matches.

### 2.4 Feature Prioritization (Roadmap)

#### Phase 1: MVP (Hackathon Scope - 1-2 Months)
*Goal: Prove the core concept of automated graph generation and RAG chat.*
* **Authentication:** Firebase Auth (Google, GitHub, Email).
* **Ingestion Engine:** Upload PDFs and TXT files.
* **AI Pipeline (Gemini API):** Extract text, summarize, identify entities/topics, and generate vector embeddings.
* **2D Knowledge Graph:** Interactive visual map of entities and documents using React Flow.
* **Conversational AI:** Chat interface to query the knowledge base (RAG - Retrieval Augmented Generation) with citations to original documents.

#### Phase 2: Version 2 (Post-Hackathon)
* **Expanded Ingestion:** Image OCR, Web Clipper extension, Audio transcription.
* **Recommendation Engine:** Proactively suggest related documents when viewing a specific node.
* **Knowledge Timeline:** A chronological view of when concepts were added and how the graph grew.
* **Advanced Graph Analytics:** Identify clusters, orphans, and central nodes.

#### Phase 3: Future Vision
* **3D Knowledge Universe:** Immersive Three.js visualization.
* **Knowledge Gap Detection:** AI suggests reading material based on what is missing from a topic cluster.
* **Blockchain Verification (Enterprise Pivot only):** Stellar-based document hashing for tamper-proof institutional research.

### 2.5 Technical Architecture

#### Technology Stack (Optimized for Speed & Simplicity)
* **Frontend/Backend:** Next.js (App Router, TypeScript)
* **Styling:** Tailwind CSS, Shadcn/UI
* **Graph Visualization:** React Flow
* **Database & Vector Store:** PostgreSQL (via Supabase or Neon) with `pgvector` for embeddings.
* **AI & LLM:** Google Gemini API (for summarization, entity extraction, and chat generation).
* **AI Orchestration:** LangChain JS (document splitting, pipeline management).
* **Auth & Blob Storage:** Firebase Auth & Firebase Storage (for raw PDFs/Images).

#### System Flow
1. **Upload:** User drops PDF -> Saved to Firebase Storage.
2. **Processing:** Next.js API route triggered -> LangChain loads PDF -> Chunks text.
3. **Extraction:** Gemini API extracts Entities (Nodes) and Relationships (Edges). Gemini creates Vector Embeddings for chunks.
4. **Storage:** Nodes, Edges, and Embeddings saved to PostgreSQL.
5. **Visualization:** React Flow queries Postgres to render the interconnected graph.
6. **Retrieval (Chat):** User asks a question -> Question embedded -> Semantic search via pgvector -> Relevant chunks passed to Gemini -> AI answers with citations.

### 2.6 Database Design (PostgreSQL)
*Relational schema handling both graph nodes and vectors.*

* **Users Table:** `id`, `email`, `created_at`
* **Documents Table:** `id`, `user_id`, `title`, `source_url`, `type`, `created_at`
* **Chunks Table:** `id`, `document_id`, `content`, `embedding` (vector), `page_number`
* **Entities (Nodes) Table:** `id`, `user_id`, `name`, `type` (e.g., Person, Concept, Technology)
* **Relationships (Edges) Table:** `id`, `source_entity_id`, `target_entity_id`, `relationship_type` (e.g., "created", "is related to", "depends on"), `document_id` (source of truth)

### 2.7 AI Pipeline Design
* **Chunking Strategy:** Recursive character splitting (approx 1000 tokens with 200 overlap) to preserve context.
* **Entity Extraction Prompting:** One-shot prompting with Gemini API: *"Extract key entities and their relationships from the following text. Output strictly as JSON: { entities: [{name, type}], relations: [{source, target, type}] }."*
* **RAG Architecture:** Hybrid search combining keyword matching and vector similarity (pgvector cosine distance) for highest accuracy during chat.

### 2.8 UI/UX Flow
1. **Dashboard:** Global view of the Knowledge Graph + recent documents.
2. **Ingestion Zone:** Drag-and-drop interface for files. Real-time processing status indicators.
3. **Graph Explorer:** Full-screen React Flow canvas. Click a node to open a side panel showing the entity summary and linked documents.
4. **AI Assistant:** Persistent chat window on the right side. Responses include clickable reference pills (e.g., `[Doc 1]`) that open the source document.

### 2.9 API Design (Next.js API Routes)
* `POST /api/documents/upload` - Handles file upload, triggers AI pipeline.
* `GET /api/graph` - Returns JSON of nodes and edges for the current user.
* `POST /api/chat` - Receives query, performs vector search, streams LLM response.
* `GET /api/documents/:id` - Retrieves document metadata and extracted summaries.

### 2.10 Sprint Roadmap (Hackathon: 4 Weeks)

* **Sprint 1: Foundation & Ingestion**
  * Set up Next.js, Firebase Auth, PostgreSQL + pgvector.
  * Build upload UI and Firebase Storage integration.
* **Sprint 2: The AI Brain**
  * Implement LangChain PDF parsing.
  * Integrate Gemini API for entity extraction and embeddings.
  * Save nodes/edges to the database.
* **Sprint 3: The Web of Knowledge**
  * Integrate React Flow.
  * Build the interactive Graph Explorer UI.
  * Connect graph to database.
* **Sprint 4: Chat & Polish**
  * Implement the RAG chat interface.
  * Refine Shadcn/UI styling (Dark mode, glassmorphism).
  * Prepare hackathon pitch and demo script.

### 2.11 Risks & Mitigations
| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **LLM Hallucinations in Graph Extraction** | High (Messy Graph) | Use strict JSON schemas in Gemini API calls. Implement a confidence threshold before creating an edge. |
| **Graph Clutter (Too many nodes)** | Medium | Implement graph filtering in the UI (e.g., "Show only topics", filter by date). Allow manual deletion of bad nodes. |
| **High API Costs** | Medium | Cache Gemini responses. Process documents asynchronously. Limit upload sizes for the MVP. |

### 2.12 Hackathon Demo Strategy
* **The "Aha!" Moment:** Start with a completely empty screen. Drag in 3 disparate PDFs (e.g., a paper on Neural Networks, a biography of Alan Turing, a hardware spec sheet). 
* **The Magic:** Show the graph assembling itself live. The nodes for "Computing", "AI", and "Turing" automatically connect.
* **The Proof:** Ask the chat assistant a complex question that requires synthesizing information across all three documents. Show the AI answering correctly with citations.
* **Conclusion:** "This is NEURONEX. Your knowledge, instantly connected."
