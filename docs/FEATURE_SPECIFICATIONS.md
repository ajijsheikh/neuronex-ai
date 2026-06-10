# Feature Specifications: Full Platform Evolution

This document details all the new features transforming NEURONEX into the ultimate AI-powered Learning Operating System and Personal Learning Companion.

---

## PART 1: CORE STUDY & LEARNING FEATURES (Phase 1 & 1.5)

### 1. AI Study Notes Generator
**Problem Solved**: Manually extracting notes from dense PDFs is time-consuming.
**Workflow**: Upload document -> Click "Generate Notes" -> Select level (Beginner → Advanced → Exam).
**Implementation**: Uses Gemini 2.0 to extract and structure notes with level-controlled prompting.

### 2. Smart Summarization
**Problem Solved**: Need quick overviews of long texts.
**Workflow**: Select length (30-sec, 2-min, 5-min, executive).
**Implementation**: Powered by Gemini with token-limit controlled prompting.

### 3. AI Quiz Generator
**Problem Solved**: Lack of self-assessment tools.
**Workflow**: Generate MCQ, T/F, or fill-in-blanks -> Select Easy to Expert difficulty -> Auto-grades.
**Implementation**: Gemini generates strict JSON arrays of questions. Short-answer responses are evaluated by an LLM prompt.

### 4. Flashcard + SRS Engine
**Problem Solved**: Rote memorization is inefficient without spaced repetition.
**Workflow**: Auto-generate flashcards from notes -> Review daily.
**Implementation**: SM-2 spaced repetition algorithm calculates `easeFactor` and `interval`. Exports to Anki, CSV, PDF.

### 5. AI Tutor Mode
**Problem Solved**: Students get stuck without guidance.
**Workflow**: Enter "Tutor Mode" chat -> AI uses Socratic method instead of giving direct answers.
**Implementation**: Custom system prompt instructing the LLM to ask leading questions and build intuition.

### 6. Explain at Different Levels
**Problem Solved**: Text is often too academic or too simplistic.
**Workflow**: Highlight text -> Click "Explain Like I'm 10" or "Explain like a Researcher".
**Implementation**: Re-prompting the highlighted chunk with target audience context.

### 7. Forgetting Curve Tracker
**Problem Solved**: Students forget when they need to review.
**Workflow**: Dashboard shows which topics are decaying.
**Implementation**: Ebbinghaus-based decay model per concept. Predicts which topics the user will forget tomorrow.

### 8. Knowledge Health Score
**Problem Solved**: No metric for overall mastery.
**Workflow**: Live dashboard score per subject domain.
**Implementation**: Formula combining Coverage + Retention + Depth + Consistency.

### 9. Mind Map + Dependency Graph
**Problem Solved**: Hard to see how concepts connect.
**Workflow**: Auto-generated interactive mind maps.
**Implementation**: React Flow rendering concept dependency trees (e.g., ML → Stats → Linear Algebra).

### 10. AI Podcast Generator
**Problem Solved**: Visual fatigue; need audio learning.
**Workflow**: Turn any PDF into a two-host podcast episode.
**Implementation**: Gemini generates a 2-person script -> HuggingFace TTS API synthesizes distinct voice personas.

### 11. Research Assistant
**Problem Solved**: Academic papers are dense and hard to parse.
**Workflow**: Upload paper -> Parses abstract, methodology, limitations, future work.
**Implementation**: Multi-agent RAG. Generates APA/MLA/IEEE citations.

### 12. Learning Path Generator
**Problem Solved**: Don't know what to study next.
**Workflow**: Input Goal -> personalized roadmap.
**Implementation**: AI generates sequential skills, topics, resources, and projects. Tracks live progress.

### 13. Infographic + PPT Generator
**Problem Solved**: Need visual study materials or presentation decks.
**Workflow**: Transform documents into visual summaries and downloadable PPTX.
**Implementation**: Gemini generates markdown tables/Mermaid, converted to PPTX via `pptxgenjs`.

### 14. Shared Knowledge Spaces
**Problem Solved**: Learning is currently isolated.
**Workflow**: Study groups with real-time collaborative mind maps and shared AI tutoring sessions.
**Implementation**: WebSockets (Socket.io) for real-time state synchronization.

### 15. Streaks + Achievement Cards
**Problem Solved**: Lack of daily motivation.
**Workflow**: Daily streak tracking, badge system.
**Implementation**: `UserActivity` and `UserStreak` models. Shareable knowledge cards for LinkedIn/X.

### 16. Persistent AI Mentor (Long-Term)
**Problem Solved**: Need a long-term academic/career guide.
**Workflow**: AI mentor tracks goals, strengths, and predicts next skills to learn.
**Implementation**: High-context RAG over user's entire historical `ConceptMemory`.

---

## PART 2: ACTIVE COMPANION EXPANSION (Phase 2)

### 17. Active Learning System
**Workflow**: AI generates a coding challenge, debugging exercise, or case study from notes.

### 18. AI Exam Simulator
**Workflow**: Configure exam (topics, duration, difficulty) -> Take timed exam -> Receive automatic grading and weakness analysis.

### 19. Knowledge to Project Generator
**Workflow**: Input "Machine Learning Notes" -> AI outputs 5 project ideas with milestones, architecture, and estimated time.

### 20. Concept Comparison Engine
**Workflow**: Type "Compare React vs Angular" -> AI generates side-by-side tables, pros/cons, and use cases.

### 21. AI Career Coach
**Workflow**: Upload a Job Description -> AI compares it to the user's Knowledge Graph -> Outputs a Readiness Score.

### 22. Knowledge DNA System
**Workflow**: System runs in background -> Updates profile (e.g., "Visual Learner, Strong in Algorithms").

### 23. Reverse Learning Engine
**Workflow**: Input goal ("AI Engineer") -> System finds prerequisites -> Maps to existing skills -> Generates delta roadmap.

### 24. AI Research Partner
**Workflow**: Upload 20 papers -> AI identifies contradictory findings, unexplored demographics, and thesis suggestions.

### 25. AI Whiteboard Teacher
**Workflow**: Ask AI to "Draw the system architecture" -> Outputs interactive Mermaid.js flowchart.

### 26. Memory Enhancement System
**Workflow**: Click "Help me remember" on a flashcard -> AI generates a mnemonic, story, or memory palace.

### 27. Daily AI Mentor
**Workflow**: Login -> View Daily Briefing (personalized study plan, revision schedule, motivational coaching).

### 28. Learning Analytics Platform
**Workflow**: Navigate to `/analytics` to view learning velocity, retention trends, and mastery progression.
