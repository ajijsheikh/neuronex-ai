# Product Requirements Document: NEURONEX Phase 2

## 1. Executive Strategic Review

**The Pitch:** An AI-powered Personal Learning Companion that actively improves knowledge, memory, problem-solving ability, career readiness, and long-term growth.

**The Evolution:** NEURONEX is moving beyond its MVP "Document-to-Graph" capability. The new Phase 2 architecture focuses on **Active Learning**. We are shifting from passive knowledge structuring (summaries, flashcards) to active skill acquisition (projects, career coaching, adaptive mentorship, reverse learning).

## 2. Feature Prioritization Matrix (The 12 Categories)

| Category | Description | Phase | Priority |
| :--- | :--- | :--- | :--- |
| **1. Concept Comparison** | Side-by-side comparison tables and pros/cons (e.g., React vs Angular). | MVP | High |
| **2. AI Whiteboard Teacher** | Generate flowcharts and architecture diagrams (Mermaid.js). | MVP | High |
| **3. Memory Enhancement** | Generate mnemonics, memory tricks, and memory palaces for flashcards. | MVP | High |
| **4. Active Learning System**| Generate coding challenges, debugging tasks, and case studies from notes. | V1 | High |
| **5. Daily AI Mentor** | Daily personalized study plans, revision schedules, and motivational coaching. | V1 | High |
| **6. AI Exam Simulator** | Full timed mock exams, university-style papers, and automatic grading. | V1 | High |
| **7. Knowledge to Project** | Auto-generate practical projects, milestones, and required skills. | V1 | High |
| **8. Learning Analytics** | Dashboards showing learning velocity, retention trends, and mastery. | V1 | Medium |
| **9. Reverse Learning Engine**| Input a goal ("Become an AI Engineer") -> Get prerequisite skill mapping. | V2 | High |
| **10. Knowledge DNA System** | Adaptive profiles (Visual/Audio learner, strengths, weaknesses). | V2 | High |
| **11. AI Career Coach** | Compare skills against Job Descriptions to generate readiness scores. | V2 | High |
| **12. AI Research Partner** | Identify open problems, literature gaps, and thesis suggestions. | V2 | High |

## 3. Technical Architecture Updates

### Technology Stack Additions
* **Frontend/Backend:** Next.js (App Router, TypeScript)
* **Styling/UI:** Tailwind CSS, Shadcn/UI
* **Graph/Diagrams:** React Flow (Knowledge Graph) + **Mermaid.js (Whiteboard Teacher)**
* **Database & Vector Store:** PostgreSQL with `pgvector`
* **AI & LLM:** Google Gemini 2.0 Flash (Core), **Gemini 2.0 Pro (Research/Career Analysis)**
* **Audio/TTS:** **Hugging Face Inference API (for Podcasts/Audio Revision)**
* **Background Jobs:** **Vercel Cron Jobs / Upstash QStash (for Daily Mentor & Analytics)**

### System Flow (Phase 2 Additions)
1. **Cron/Async Processing:** Nightly jobs aggregate `UserActivity` to update `KnowledgeDNA` and generate the `DailyMentorBriefing`.
2. **Reverse RAG:** Instead of querying documents with a user question, the system queries the user's mastered Knowledge Graph against external Job Descriptions (Career Coach).
3. **Multi-Agent RAG:** Research Partner uses one agent to summarize papers, and a synthesizer agent to cross-reference and find literature gaps.

## 4. Risk Analysis

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **LLM Hallucinations in Exams** | High | AI must explicitly quote the exact source text chunk in its hidden grading rubric to verify correctness. |
| **High API Compute Costs** | High | Use `gemini-2.0-flash` for generation. Reserve `pro` only for deep research. Implement usage quotas. |
| **UI Complexity / Clutter** | Medium | Use progressive disclosure. Dashboard starts simple. Advanced features are triggered conversationally. |

## 5. Monetization Strategy
* **Free Tier:** Core graph, chat, basic flashcards, Concept Comparison, Whiteboard Teacher.
* **Pro Tier ($15/mo):** Exam Simulator, Daily Mentor, Knowledge to Project, Active Learning.
* **Career/Research Tier ($30/mo):** Career Coach, Literature Gap Analysis, Unlimited High-Context Analysis.
