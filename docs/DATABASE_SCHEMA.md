# Database Schema

Database: **PostgreSQL** with **pgvector** extension.
ORM: **Prisma**.

## 1. Core Models (Phase 1)
*   **User**: `id`, `email`, `name`
*   **Document**: `id`, `userId`, `title`, `type`, `sourceUrl`
*   **Chunk**: `id`, `documentId`, `content`, `embedding (vector)`, `pageNumber`
*   **Entity** (Graph Node): `id`, `userId`, `name`, `type`
*   **Relationship** (Graph Edge): `id`, `sourceEntityId`, `targetEntityId`, `relationshipType`

## 2. Study & Memory Models (Phase 1.5)
*   **StudyNote** / **Summary**: AI-generated static content.
*   **Quiz** / **QuizQuestion** / **QuizAttempt** / **QuizAnswer**: Core testing framework.
*   **FlashcardDeck** / **Flashcard** / **FlashcardReview**: Spaced Repetition System (SM-2).
*   **ConceptMemory**: Ebbinghaus forgetting curve tracking (`stability`, `retention`, `confidenceLevel`).
*   **KnowledgeHealth**: Aggregated competency scores.

## 3. Active Learning & Expansion Models (Phase 2)

### Table: `ActiveExercise`
Tracks generated practical challenges.
*   `id`, `userId`, `documentId`
*   `type` (coding, debugging, numerical, case_study)
*   `problem` (TEXT), `solution` (TEXT)
*   `difficulty` (INT)

### Table: `ExamSimulation`
Tracks full mock exams.
*   `id`, `userId`, `title`, `durationMin`
*   `questions` (JSON), `score` (FLOAT), `report` (JSON)

### Table: `GeneratedProject`
Tracks theory-to-practice projects.
*   `id`, `userId`, `title`, `description`
*   `milestones` (JSON), `skillsUsed` (String[])

### Table: `KnowledgeDNA`
Tracks adaptive learning profiles.
*   `id`, `userId`
*   `preferredModality` (String), `optimalTimeOfDay` (String)
*   `strengths` (String[]), `weaknesses` (String[])

### Table: `CareerProfile`
Tracks AI Career Coach data.
*   `id`, `userId`
*   `targetRoles` (String[])
*   `readinessHistory` (JSON - tracks score over time)

### Table: `DailyMentorBriefing`
Tracks daily generated plans.
*   `id`, `userId`, `date`
*   `content` (TEXT), `tasks` (JSON), `isRead` (Boolean)
