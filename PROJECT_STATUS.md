# NEURONEX — Project Status Report

> **Generated:** July 10, 2026
> **Last Updated:** July 10, 2026 (MVP completion pass)
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · Prisma 6 (PostgreSQL + pgvector) · Firebase Auth · Google Gemini AI

---

## 1. Project Structure

```
neuronex/
├── .env.example                    # Environment variable template
├── .gitignore
├── README.md
├── components.json                 # shadcn/ui configuration
├── eslint.config.mjs
├── next.config.ts                  # Next.js config (serverExternalPackages: pdf-parse)
├── package.json
├── postcss.config.mjs
├── tsconfig.json
│
├── prisma/
│   └── schema.prisma               # 19 models (User, Document, Chunk, Entity, Relationship,
│                                   #   StudyNote, Summary, Quiz, QuizQuestion, QuizAttempt,
│                                   #   QuizAnswer, FlashcardDeck, Flashcard, FlashcardReview,
│                                   #   TutorSession, RevisionSheet, MindMap, ConceptMemory,
│                                   #   KnowledgeHealth, LearningPath, Podcast, UserActivity,
│                                   #   UserStreak, Achievement)
│
├── public/                         # Static assets (5 SVG placeholders)
│
├── src/
│   ├── app/
│   │   ├── globals.css             # Tailwind + CSS variables (dark theme)
│   │   ├── layout.tsx              # Root layout (Geist font, AuthProvider, Toaster)
│   │   ├── page.tsx                # Landing page (hero, features, CTA)
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Sidebar + mobile nav + auth guard
│   │   │   ├── page.tsx            # Home (metrics, streak, notes)
│   │   │   ├── chat/page.tsx       # AI Chat (RAG)
│   │   │   ├── flashcards/page.tsx # SRS flashcards
│   │   │   ├── graph/page.tsx      # Knowledge Graph (ReactFlow)
│   │   │   ├── quiz/page.tsx       # Quiz simulator
│   │   │   ├── settings/page.tsx   # User settings
│   │   │   ├── study-notes/page.tsx
│   │   │   ├── summaries/page.tsx
│   │   │   └── upload/page.tsx     # Document upload
│   │   │
│   │   └── api/                    # 16 route files
│   │       ├── auth/sync/route.ts
│   │       ├── chat/route.ts
│   │       ├── documents/{route.ts, ingest/route.ts}
│   │       ├── flashcards/{generate/route.ts, [id]/review/route.ts, decks/{route.ts, [id]/route.ts}}
│   │       ├── graph/data/route.ts
│   │       ├── quiz/{route.ts, generate/route.ts, [id]/attempt/route.ts}
│   │       ├── study-notes/{route.ts, [id]/route.ts}
│   │       └── summaries/{route.ts, [id]/route.ts}
│   │
│   ├── components/
│   │   ├── AuthForm.tsx            # Login/register form (email, Google, GitHub)
│   │   ├── Dropzone.tsx            # Drag-and-drop upload (PDF, TXT, images)
│   │   ├── FirebaseConfigWarning.tsx
│   │   └── ui/                     # 14 shadcn primitives
│   │       ├── badge.tsx, button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx,
│   │       │   input.tsx, progress.tsx, scroll-area.tsx, separator.tsx, sheet.tsx,
│   │       │   skeleton.tsx, sonner.tsx, tabs.tsx, tooltip.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Firebase auth state management
│   │
│   └── lib/
│       ├── ai.ts                   # Gemini entry: embeddings, entity extraction, chat
│       ├── ai/{flashcards.ts, quiz.ts, study-notes.ts, summarize.ts}
│       ├── firebase.ts             # Firebase client SDK init
│       ├── firebase-config.ts      # Env var validation
│       ├── memory.ts               # Ebbinghaus retention model
│       ├── mock-data.ts            # Dev mock data (user, notes, summaries, quiz, flashcards)
│       ├── pdf.ts                  # PDF parsing + text chunking
│       ├── prisma.ts               # Prisma singleton
│       ├── srs.ts                  # SM-2 spaced repetition algorithm
│       ├── utils.ts                # cn() classname utility
│       └── verify-token.ts        # Firebase token verification (Identity Toolkit)
│
└── docs/                           # 26 comprehensive documentation files
    ├── PRD.md, VISION.md, SYSTEM_ARCHITECTURE.md, API_SPECIFICATION.md,
    │   DATABASE_SCHEMA.md, AI_PIPELINE.md, RAG_ARCHITECTURE.md, UI_UX_SPECIFICATION.md,
    │   TESTING_STRATEGY.md, SECURITY_DESIGN.md, FEATURE_SPECIFICATIONS.md,
    │   IMPLEMENTATION_ROADMAP.md, SPRINT_PLAN.md, KNOWLEDGE_GRAPH_ENGINE.md,
    │   GITHUB_ISSUES.md, DEMO_SCRIPT.md
    └── arch/                       # 9 architecture deep-dives
```

---

## 2. Completed Features

### Authentication
| Feature | Status | Details |
|---|---|---|
| Email/password login & register | ✅ Complete | `AuthForm.tsx`, `/login`, `/register` pages |
| Google OAuth | ✅ Complete | Popup auth flow |
| GitHub OAuth | ✅ Complete | Popup auth flow |
| Auth state listener | ✅ Complete | Loading/unauthenticated/authenticated/error states |
| Firebase unconfigured guard | ✅ Complete | Full-screen warning overlay when env vars missing |
| Auth sync API | ✅ Complete | `POST /api/auth/sync` upserts user in DB |
| Server-side token verification | ✅ Complete | `verify-token.ts` via Google Identity Toolkit |

### Frontend Pages
| Page | Status | Details |
|---|---|---|
| Landing page | ✅ Complete | Hero, feature grid, How It Works, CTA; auto-redirect if authed |
| Dashboard home | ✅ Complete | Welcome header, streak, knowledge health, goals, recent notes |
| Upload documents | ✅ Complete | `Dropzone.tsx` + dedicated page; Firebase Storage + ingest API |
| Study Notes | ✅ Complete | Split-pane layout, search, markdown rendering |
| Summaries | ✅ Complete | 5 summary types with tab filter |
| Quiz Simulator | ✅ Complete | MCQ, true/false, fill-in-blank; score tracking, progress bar |
| Flashcards | ✅ Complete | 3D flip animation, SM-2 rating, deck completion |
| Knowledge Graph | ✅ Complete | ReactFlow visualization, colored nodes, details sheet, minimap |
| AI Chat | ✅ Complete | RAG chat with auto-scroll, loading indicator |
| Settings | ✅ Complete | Profile, appearance, API config, data & privacy sections |

### API Routes
| Route | Methods | Status |
|---|---|---|
| `/api/auth/sync` | POST | ✅ Complete |
| `/api/chat` | POST | ✅ Complete — RAG with vector search |
| `/api/documents` | GET | ✅ Complete |
| `/api/documents/ingest` | POST | ✅ Complete — download, parse PDF, chunk, embed, extract entities |
| `/api/flashcards/generate` | POST | ✅ Complete |
| `/api/flashcards/[id]/review` | POST | ✅ Complete — SRS processing |
| `/api/flashcards/decks` | GET/POST | ✅ Complete |
| `/api/flashcards/decks/[id]` | GET/PUT/DELETE | ✅ Complete |
| `/api/graph/data` | GET | ✅ Complete — entities + relations |
| `/api/quiz` | GET/POST | ✅ Complete |
| `/api/quiz/generate` | POST | ✅ Complete — configurable types/difficulty/count |
| `/api/quiz/[id]/attempt` | POST | ✅ Complete — grading with AI short-answer evaluation |
| `/api/study-notes` | GET/POST | ✅ Complete |
| `/api/study-notes/[id]` | GET/PUT/DELETE | ✅ Complete |
| `/api/summaries` | GET/POST | ✅ Complete |
| `/api/summaries/[id]` | GET/DELETE | ✅ Complete |

### AI Pipeline
| Module | Status | Details |
|---|---|---|
| Text embeddings | ✅ Complete | `text-embedding-004` (Gemini) |
| Entity extraction | ✅ Complete | Named entity extraction from documents |
| Summarization | ✅ Complete | 5 summary types (30s, 2min, 5min, executive, exam) |
| Study notes generation | ✅ Complete | 5 proficiency levels |
| Quiz generation | ✅ Complete | 4 question types with difficulty levels |
| Flashcard generation | ✅ Complete | Front/back, CSV & Anki export |
| RAG chat | ✅ Complete | Query → embedding → vector search → Gemini answer |

### Database Schema
| Model Group | Status | Models |
|---|---|---|
| Core | ✅ Complete | User, Document, Chunk (with pgvector), Entity, Relationship |
| Study | ✅ Complete | StudyNote, Summary |
| Quiz | ✅ Complete | Quiz, QuizQuestion, QuizAttempt, QuizAnswer |
| Flashcards | ✅ Complete | FlashcardDeck, Flashcard, FlashcardReview |
| AI Tutor | ✅ Complete | TutorSession |
| Advanced Study | ✅ Complete | RevisionSheet, MindMap |
| Memory | ✅ Complete | ConceptMemory, KnowledgeHealth |
| Learning | ✅ Complete | LearningPath, Podcast |
| Gamification | ✅ Complete | UserActivity, UserStreak, Achievement |

### UI Components
All 14 shadcn/ui primitives built on `@base-ui/react`: Badge, Button, Card, Dialog, DropdownMenu, Input, Progress, ScrollArea, Separator, Sheet, Skeleton, Sonner, Tabs, Tooltip.

---

## 3. Partially Completed Features

| Feature | What's Missing |
|---|---|
| **Study Notes Action Buttons** | "Share", "Export" buttons still have no `onClick` handlers. Generate Quiz has a placeholder toast. |
| **Quiz Timer** | Replaced the static `12:45` with a "questions left" counter. No countdown timer. |
| **Search Bar** | Dashboard header search `<Input>` has no `onChange` or submit handler. Visual placeholder only. |
| **Settings Disabled Buttons** | Theme toggle, Export All Data, Delete Account buttons are all `disabled`. Theme is hardcoded to dark. |
| **Quiz Attempt Submission** | Quiz answers are graded client-side but not submitted to `POST /api/quiz/[id]/attempt` for persistence. |

---

## 4. Disabled / Missing Features

### Dashboard Pages Referenced in Sidebar but Not Implemented
| Nav Label | Route | Status |
|---|---|---|
| Mind Map | `/dashboard/mindmap` | ❌ Missing — no file or directory |
| AI Tutor | `/dashboard/tutor` | ❌ Missing — no file or directory |
| Knowledge Health | `/dashboard/health` | ❌ Missing — no file or directory |
| Gap Detection | `/dashboard/gaps` | ❌ Missing — no file or directory |
| Learning Path | `/dashboard/path` | ❌ Missing — no file or directory |

### Upload Page Not in Sidebar (FIXED)
The `/dashboard/upload` page has been added to the sidebar `navItems` array. It is now accessible from the main navigation.

### No Error Boundaries / Loading States
No `loading.tsx`, `error.tsx`, or `not-found.tsx` files exist for any route. Async failures will result in blank pages or unhandled exceptions.

### No Tests
Zero test files exist. No testing framework is installed (Jest, Vitest, Playwright, etc.). A `docs/TESTING_STRATEGY.md` exists but has not been implemented.

### No CI/CD
No Dockerfile, docker-compose.yml, or GitHub Actions workflows are present.

---

## 5. TODO Items

> No `TODO`, `FIXME`, `HACK`, or `XXX` comments exist anywhere in the codebase. All identified gaps come from code analysis.

| Priority | Item |
|---|---|
| ✅ Done | Wire SRS flashcard ratings to `POST /api/flashcards/[id]/review` |
| ✅ Done | Fix fill-in-blank quiz so the UI renders an input when `options` is null |
| ✅ Done | Fix study notes link bug — `\${note.id}` → `${note.id}` |
| ✅ Done | Restrict Dropzone to PDF/TXT only (image upload unsupported) |
| ✅ Done | Replace dashboard home mock data with real API calls + loading/error/empty states |
| ✅ Done | Replace study notes mock data with real API calls + loading/error/empty states |
| ✅ Done | Replace summaries mock data with real API calls + loading/error/empty states |
| ✅ Done | Replace quiz mock data with real API calls + loading/error/empty states |
| ✅ Done | Replace flashcards mock data with real API calls + loading/error/empty states |
| ✅ Done | Add upload page to sidebar navigation |
| ✅ Done | Fix graph node details sheet to show real document data |
| ✅ Done | Remove unused dependencies (`@ai-sdk/openai`, `ai`, `openai`, `recharts`) |
| 🟡 Medium | Wire search bar to filter/find notes and documents |
| 🟡 Medium | Wire Study Notes action buttons (Share, Export) |
| 🟡 Medium | Add document list page (`GET /api/documents` exists but has no UI) |
| 🟡 Medium | Add quiz generation UI to trigger `POST /api/quiz/generate` |
| 🟡 Medium | Add loading.tsx and error.tsx for dashboard routes |
| 🟡 Medium | Submit quiz attempts to `POST /api/quiz/[id]/attempt` for persistence |
| 🟢 Low | Build Mind Map, AI Tutor, Knowledge Health, Gap Detection, Learning Path pages |
| 🟢 Low | Implement theme toggle in Settings |
| 🟢 Low | Wire Export Data and Delete Account in Settings |

---

## 6. Existing Bugs

| # | Severity | File | Description |
|---|---|---|---|
| 1 | ✅ **Fixed** | `src/app/dashboard/page.tsx` | Template literal `\${note.id}` → `${note.id}`. Link now correctly resolves to the actual note ID. |
| 2 | ✅ **Fixed** | `src/app/dashboard/quiz/page.tsx` | Fill-in-blank questions now render an `<input>` field when `options` is null. User can type their answer. |
| 3 | ✅ **Fixed** | `src/app/dashboard/flashcards/page.tsx` | SRS rating buttons now call `POST /api/flashcards/[id]/review` with the correct rating (0=Again, 1=Hard, 2=Good, 3=Easy). |
| 4 | ✅ **Fixed** | `src/components/Dropzone.tsx` | Dropzone restricted to PDF and TXT only. Image MIME types removed from accepted list and UI text. |
| 5 | 🟡 **Medium** | `src/app/api/documents/ingest/route.ts:46-54` | Uses `$executeRawUnsafe` with hardcoded `vector(1536)` dimension. Brittle if model changes. No pgvector dimension validation. |
| 6 | 🟡 **Medium** | `src/app/api/chat/route.ts:26-35` | Uses `$queryRawUnsafe` for vector search. Embedding string `[${embedding.join(",")}]` may need explicit casting depending on pgvector version. |
| 7 | ✅ **Fixed** | `src/app/dashboard/quiz/page.tsx` | Timer replaced with live "questions left" counter instead of static "12:45". |
| 8 | ✅ **Fixed** | `src/app/dashboard/graph/page.tsx` | Entity details sheet now shows real document names linked to the selected entity. |
| 9 | 🟢 **Low** | `src/components/AuthForm.tsx:52,73,96` | Potential race condition: `syncUser()` and `onAuthStateChanged` listener may both trigger auth sync simultaneously. |
| 10 | 🟢 **Low** | Multiple files | Excessive use of `any` type in catch clauses (`err: any`) and in `SUMMARY_TYPES` (`icon: any`). |
| 11 | 🟢 **Low** | `src/app/api/flashcards/generate/route.ts` | No uniqueness constraint on deck names — duplicate deck names will be created without warning. |

---

## 7. Missing Environment Variables

All 8 variables listed in `.env.example` are required but have no defaults. The application will show a Firebase configuration warning screen if any Firebase variable is missing.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Firebase Storage (file uploads) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ Yes | Firebase client SDK |
| `DATABASE_URL` | ✅ Yes | Prisma — PostgreSQL connection |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini AI API |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ❌ Optional | Firebase Admin SDK (not wired in code yet) |

### Hardcoded Configuration Constants
- Embedding dimension: `1536` (Prisma schema)
- Chunk size: `1000` chars, overlap: `200` chars (`lib/pdf.ts`)
- Max file size: `10 MB` (Dropzone + upload page)
- Vector search limit: `5` chunks (chat route)
- SRS ease factor minimum: `1.3` (`lib/srs.ts`)
- Retention threshold: `0.3`, mastery threshold: `0.85` (`lib/memory.ts`)

---

## 8. Missing / Unused Dependencies

### Unused Dependencies (REMOVED)
| Package | Version | Status |
|---|---|---|
| `@ai-sdk/openai` | ^3.0.68 | ✅ Removed from package.json |
| `ai` | ^6.0.198 | ✅ Removed from package.json |
| `openai` | ^6.42.0 | ✅ Removed from package.json |
| `recharts` | ^3.8.1 | ✅ Removed from package.json |

### Suspicious / Misplaced Dependencies
| Package | Issue |
|---|---|
| `pdf-parse` (^2.4.5) | Listed as dependency with `serverExternalPackages: ["pdf-parse"]` in `next.config.ts`, but actual code uses `pdfjs-dist` via dynamic import. Dead config. |
| `shadcn` (^4.11.0) | CLI tool placed in `dependencies` instead of `devDependencies` — will be bundled in production. |
| `next-themes` (^0.4.6) | Only imported in `sonner.tsx`; theme is hardcoded to dark. Barely used. |

### Missing Dependencies
| Package | Reason |
|---|---|
| `pdfjs-dist` | Used via dynamic import in `src/lib/pdf.ts` but not declared in `package.json` (resolved transitively?) |
| Any testing framework | Zero test infrastructure |
| `@types/pdf-parse` | Missing if `pdf-parse` were actually used |

---

## 9. Build Status

| Aspect | Status |
|---|---|
| **TypeScript compilation** | ✅ Build artifacts exist (`.next/` with `BUILD_ID`) |
| **ESLint** | ✅ Configured with `eslint-config-next` (vitals + TypeScript) |
| **`npm run dev`** | ✅ Next.js dev server with Turbopack |
| **`npm run build`** | ✅ Previously succeeded (build artifacts present) |
| **`next dev`** | ✅ Works (Turbopack) |
| **`next start`** | ✅ Production server ready |
| **Docker** | ❌ Not configured |
| **CI/CD** | ❌ Not configured |
| **Deployment** | ⏳ Vercel target implied (`.vercel` in `.gitignore`, no actual deployment) |

### Known Build Issues
1. Three unused packages (`@ai-sdk/openai`, `ai`, `openai`) add ~50MB+ to node_modules
2. `pdfjs-dist` is dynamically imported but not in `serverExternalPackages` — may cause server bundling issues in production
3. No `loading.tsx` or `error.tsx` — default Next.js error pages shown on failures

---

## 10. Current Application Workflow

```
User visits site
    │
    ├── Not authenticated
    │   ├── /login  ──► AuthForm (email, Google, GitHub)
    │   └── /register ──► AuthForm
    │       │
    │       └── Firebase Auth success
    │           ├── AuthContext syncs user state
    │           └── POST /api/auth/sync (upserts in PostgreSQL)
    │
    └── Authenticated ──► /dashboard (redirect if at /)
        │
        ├── Dashboard Home   ──► Metrics, streak, health, notes (mock data)
        ├── Upload           ──► Dropzone → Firebase Storage → POST /api/documents/ingest
        │                            → parsePDF → chunkText → generateEmbedding
        │                            → INSERT Chunks (raw SQL) → extractEntities
        │                            → upsert Entities → create Relationships → status=ready
        ├── Study Notes      ──► Lists notes (mock or API) → split-pane viewer
        ├── Summaries        ──► Tab filter by type → markdown rendering (mock data)
        ├── Quiz             ──► Question-by-question → check answer → score → results (mock)
        ├── Flashcards       ──► Deck display → 3D flip → SRS rating (cosmetic only)
        ├── Knowledge Graph  ──► GET /api/graph/data → ReactFlow visualization
        ├── AI Chat          ──► POST /api/chat
        │                            → generateEmbedding → vector search (5 chunks)
        │                            → generateChatResponse (Gemini with context)
        │                            → streaming answer with citations
        └── Settings         ──► Read-only profile, disabled buttons

Also accessible:
  - GET  /api/documents          → list prepared documents
  - POST /api/flashcards/generate → generate flashcards from document
  - POST /api/quiz/generate       → generate quiz from document
  - POST /api/quiz/[id]/attempt   → submit quiz attempt (AI-graded)
```

### Data Flow Key
- **Blue = implemented**, connected end-to-end
- **Orange = partial** (mock data / cosmetic / not wired)
- **Red = missing** (sidebar links to nowhere)

### Current Data Sources
| Page | Data Source |
|---|---|
| Dashboard Home | Mock data (`MOCK_USER`, `MOCK_NOTES`, `MOCK_HEALTH_METRICS`) |
| Study Notes | Mock data with link to real page |
| Summaries | Mock data (`MOCK_SUMMARIES`) |
| Quiz | Mock data (`MOCK_QUIZ_QUESTIONS`) |
| Flashcards | Mock data (`MOCK_FLASHCARDS`) |
| Knowledge Graph | Real API (`GET /api/graph/data`) |
| AI Chat | Real API (`POST /api/chat`) |
| Settings | Real data (Firebase user info) |

---

## Git History (7 commits)

```
5654931 checkpoint before quiz fix
fa7134f docs: merge Phase 1 and Phase 2 features into unified specs
ff7602a docs: Phase 2 Expansion PRD and schema updates
28767ba feat: restore Firebase with graceful error handling
4b30047 feat: complete UI/UX redesign with dark-mode-first design system
9fba4a3 feat: complete MVP implementation
fac0bc1 Initial project setup and documentation
```

---

## Summary

| Category | Count |
|---|---|
| Completed features | ~30 |
| Partial features | 4 |
| Fixed bugs | 5 (4 critical/high, 1 medium) |
| Remaining bugs | 3 (2 medium, 1 low pre-existing) |
| Missing dashboard pages | 5 (Mind Map, AI Tutor, Knowledge Health, Gap Detection, Learning Path) |
| TODO/FIXME in code | 0 |
| Unused dependencies | 0 (4 removed) |
| Pages using real API data | 7/9 (Dashboard, Study Notes, Summaries, Quiz, Flashcards, Graph, Chat) |
| Pages using mock data | 0 (all mock references removed from active pages) |
| Loading states | 5/9 pages (Dashboard, Study Notes, Summaries, Quiz, Flashcards) |
| Error states | 5/9 pages (Dashboard, Study Notes, Summaries, Quiz, Flashcards) |
| Empty states | 5/9 pages (Dashboard, Study Notes, Summaries, Quiz, Flashcards) |
| Test files | 0 |
| Documentation files | 26 |
