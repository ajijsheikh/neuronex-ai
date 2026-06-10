# AI Pipeline Architecture

The NEURONEX AI Pipeline handles ingestion, extraction, retrieval, and the advanced generative features of Phase 2.

## 1. Core Ingestion Pipeline (Phase 1)
1.  **Extract & Chunk**: LangChain PDFLoader + RecursiveCharacterTextSplitter.
2.  **Embed**: Gemini `text-embedding-004` -> Store in `chunks` table (pgvector).
3.  **Graph Extraction**: Gemini `gemini-2.0-flash` with strict JSON schema extracts Entities and Relationships.

## 2. Advanced RAG Patterns (Phase 2)

### Multi-Agent RAG (AI Research Partner)
Used for identifying literature gaps across 20+ papers.
1.  **Summarizer Agent**: Processes individual document chunks to create localized summaries.
2.  **Synthesizer Agent (Gemini 2.0 Pro)**: Receives the localized summaries, cross-references findings, and identifies contradictions, unexplored demographics, or open problems.

### Reverse RAG (AI Career Coach)
Used to match user knowledge against external requirements.
1.  **Input**: User uploads a Job Description (e.g., Senior React Developer).
2.  **Extraction**: Extract required skills/entities from the Job Description.
3.  **Reverse Query**: Query the user's `ConceptMemory` and `Entity` graph to find overlapping mastered concepts.
4.  **Delta Generation**: AI calculates the readiness score and generates a roadmap for missing skills.

### Structured Generative Output
Features like the **Knowledge to Project Generator** and **AI Exam Simulator** rely heavily on strict JSON schemas.
*   Gemini `responseSchema` is strictly defined to ensure UI components can render Kanban boards (for projects) or timed test interfaces (for exams) without parsing errors.

## 3. Audio / TTS Integration (Hugging Face)
*   **Podcast Generation / Audio Revision**: 
    1. Gemini generates conversational scripts.
    2. Hugging Face Inference API (`facebook/mms-tts-eng` or `suno/bark`) synthesizes the text into audio streams.

## 4. Background Processing
*   **Daily Mentor & Knowledge DNA**: Nightly Cron Jobs trigger Vercel API routes. These routes aggregate `UserActivity`, compute `KnowledgeHealth`, and prompt Gemini to generate the morning's `DailyMentorBriefing`.
