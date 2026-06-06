# Sprint Plan (4-Week Hackathon Blueprint)

## Week 1: Foundation & Identity
*Goal: Setup infrastructure, database, and auth.*
*   **Day 1-2: Initialization**
    *   Initialize Next.js App Router project with TypeScript.
    *   Configure Tailwind CSS and install Shadcn UI components.
    *   Set up Firebase project (Auth & Storage).
*   **Day 3-4: Database & Schema**
    *   Provision PostgreSQL database (Supabase/Neon).
    *   Enable `pgvector` extension.
    *   Write and push Prisma schema (`users`, `documents`, `chunks`, `entities`, `relationships`).
*   **Day 5: Authentication**
    *   Build Login/Signup UI.
    *   Implement Firebase Context and Next.js Route Guards.
    *   Build the `/api/auth/sync` endpoint.

## Week 2: Ingestion & The AI Brain
*Goal: Upload files and generate graph data via LLM.*
*   **Day 1-2: Upload Pipeline**
    *   Build Drag & Drop UI.
    *   Implement upload to Firebase Storage and trigger Next.js API.
*   **Day 3-4: LangChain & Chunks**
    *   Implement `PDFLoader` and `RecursiveCharacterTextSplitter`.
    *   Generate embeddings using Gemini and insert into `chunks` table.
*   **Day 5: Entity Extraction**
    *   Write the system prompt for graph extraction.
    *   Parse LLM output and populate `entities` and `relationships` tables, handling deduplication.

## Week 3: Visualization (The Web)
*Goal: Render the graph interactively.*
*   **Day 1-2: React Flow Integration**
    *   Build the `GET /api/graph` endpoint.
    *   Install React Flow and map API data to nodes/edges.
*   **Day 3-4: Graph UX**
    *   Implement force-directed layout (e.g., elkjs or d3-force) so nodes organize beautifully.
    *   Add click handlers to nodes to open the Right Sidebar (Shadcn Sheet).
*   **Day 5: The Details Panel**
    *   Populate the Right Sidebar with entity metadata and links to source documents.

## Week 4: RAG Chat & Polish
*Goal: Converse with the graph and prepare for demo.*
*   **Day 1-2: Conversational UI**
    *   Build the chat interface using Vercel AI SDK.
*   **Day 3: Vector Search (pgvector)**
    *   Implement Cosine Similarity search in the `/api/chat` endpoint to retrieve context chunks.
    *   Inject context into the Gemini generation prompt.
*   **Day 4: Polish & Error Handling**
    *   Add loading skeletons, Shadcn toasts for errors, and empty states (e.g., "Upload your first document").
*   **Day 5: Demo Prep**
    *   Deploy to Vercel.
    *   Run end-to-end tests with the actual pitch data.
    *   Record fallback demo video.
