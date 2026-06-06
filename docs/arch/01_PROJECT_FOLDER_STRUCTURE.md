# Project Folder Structure

```
neuronex/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test on PR
│       └── deploy.yml                # Vercel deploy on main
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Authenticated layout (sidebar + graph)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── graph/
│   │   │   │   └── page.tsx
│   │   │   └── documents/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── sync/
│   │   │   │       └── route.ts      # POST - Sync Firebase user to DB
│   │   │   ├── documents/
│   │   │   │   ├── route.ts          # GET (list), POST (ingest)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET, DELETE
│   │   │   │       └── chunks/
│   │   │   │           └── route.ts  # GET chunks for a document
│   │   │   ├── graph/
│   │   │   │   └── route.ts          # GET - Fetch nodes + edges
│   │   │   ├── entities/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET - Entity detail + related docs
│   │   │   └── chat/
│   │   │       └── route.ts          # POST - Streaming RAG response
│   │   │
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── page.tsx                  # Landing / redirect
│   │   └── globals.css               # Tailwind entry + theme vars
│   │
│   ├── components/
│   │   ├── ui/                       # Shadcn UI primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── auth-form.tsx          # Login / Register card
│   │   │   └── auth-guard.tsx         # Redirect unauthenticated users
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard-layout.tsx   # Main 3-panel layout wrapper
│   │   │   ├── left-sidebar.tsx       # Document list + upload dropzone
│   │   │   └── right-sidebar.tsx      # Chat or Entity detail panel
│   │   │
│   │   ├── documents/
│   │   │   ├── dropzone.tsx           # Drag-and-drop file upload
│   │   │   ├── document-list.tsx      # Recent documents sidebar list
│   │   │   ├── document-item.tsx      # Single document row
│   │   │   └── processing-queue.tsx   # Progress indicators for pending docs
│   │   │
│   │   ├── graph/
│   │   │   ├── graph-viewer.tsx       # React Flow canvas wrapper
│   │   │   ├── custom-node.tsx        # Styled entity node (Shadcn badge)
│   │   │   ├── custom-edge.tsx        # Styled edge with label
│   │   │   ├── node-sidebar.tsx       # Entity detail panel (inside Sheet)
│   │   │   ├── graph-filters.tsx      # Density slider, type filters
│   │   │   ├── graph-toolbar.tsx      # Zoom, fit, 2D/3D toggle
│   │   │   └── three-scene.tsx        # R3F canvas (future)
│   │   │
│   │   ├── chat/
│   │   │   ├── chat-window.tsx        # Full chat container
│   │   │   ├── message-bubble.tsx     # Single message (user or AI)
│   │   │   ├── chat-input.tsx         # Text input + send button
│   │   │   ├── citation-pill.tsx      # Clickable citation badge
│   │   │   └── source-preview.tsx     # Modal showing source chunk
│   │   │
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       ├── empty-state.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts               # Firebase auth state hook
│   │   ├── use-graph.ts              # Fetch & cache graph data
│   │   ├── use-chat.ts               # Chat message submission + streaming
│   │   ├── use-upload.ts             # File upload + processing status
│   │   ├── use-debounce.ts
│   │   └── use-intersection-observer.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client singleton
│   │   │   ├── schema.ts             # All Drizzle table definitions
│   │   │   └── queries/
│   │   │       ├── documents.ts       # Document CRUD queries
│   │   │       ├── graph.ts           # Graph node/edge queries
│   │   │       ├── chat.ts            # Vector search queries
│   │   │       └── entities.ts        # Entity queries
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts             # Gemini client singleton
│   │   │   ├── embeddings.ts         # Embedding generation
│   │   │   ├── entity-extraction.ts  # LLM prompt + parsing for graph
│   │   │   ├── rag-pipeline.ts       # Context retrieval + generation
│   │   │   ├── chunking.ts           # LangChain text splitting
│   │   │   └── prompts.ts            # All system prompts
│   │   │
│   │   ├── firebase/
│   │   │   ├── admin.ts              # Firebase Admin SDK (server)
│   │   │   ├── client.ts             # Firebase client SDK (browser)
│   │   │   └── storage.ts            # Upload/download helpers
│   │   │
│   │   ├── auth.ts                   # API route auth middleware
│   │   ├── rate-limit.ts             # Upstash rate limiter
│   │   └── utils.ts                  # Shared helpers (cn, etc.)
│   │
│   ├── stores/
│   │   ├── graph-store.ts            # Zustand: selected node, filters, viewport
│   │   ├── chat-store.ts             # Zustand: messages, streaming state
│   │   └── ui-store.ts              # Zustand: sidebar states, theme
│   │
│   ├── providers/
│   │   ├── auth-provider.tsx          # Firebase auth context provider
│   │   ├── query-provider.tsx         # TanStack Query provider
│   │   └── theme-provider.tsx         # next-themes provider
│   │
│   ├── config/
│   │   ├── site.ts                   # Site metadata, nav items
│   │   └── constants.ts              # App-wide constants (chunk sizes, limits)
│   │
│   └── types/
│       ├── document.ts
│       ├── graph.ts                  # Node, Edge, Entity, Relationship
│       ├── chat.ts                   # Message, Citation
│       └── api.ts                    # API request/response shapes
│
├── drizzle/
│   ├── migrations/                   # Auto-generated SQL migrations
│   └── schema.ts                     # Drizzle Kit schema snapshot
│
├── scripts/
│   ├── seed.ts                       # Seed test data
│   └── eval-golden.ts                # AI pipeline evaluation script
│
├── tests/
│   ├── unit/
│   │   ├── ai/
│   │   │   ├── entity-extraction.test.ts
│   │   │   └── chunking.test.ts
│   │   ├── lib/
│   │   │   └── graph.test.ts
│   │   └── middleware/
│   │       └── auth.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── documents.test.ts
│   │   │   ├── graph.test.ts
│   │   │   └── chat.test.ts
│   │   └── rls.test.ts
│   └── e2e/
│       ├── auth.spec.ts
│       ├── upload.spec.ts
│       └── chat.spec.ts
│
├── .env.local                        # Local dev secrets (gitignored)
├── .env.example                      # Documented env template
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── components.json                   # Shadcn config
├── package.json
└── README.md
```
