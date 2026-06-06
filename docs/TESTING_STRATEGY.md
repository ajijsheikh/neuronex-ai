# Testing Strategy

## 1. Overview
Given the fast-paced nature of a 1-3 month build (or hackathon), testing must focus on the most critical, high-risk paths: the AI pipeline and Data Privacy.

## 2. Unit Testing (Vitest)
Unit tests will focus on pure functions and deterministic logic.
*   **Tools:** Vitest (faster alternative to Jest).
*   **Target Areas:**
    *   **LLM JSON Parsers:** Ensure the system can handle slightly malformed JSON returned by Gemini during entity extraction.
    *   **Graph Data Transformers:** Ensure PostgreSQL rows are correctly mapped into React Flow `nodes` and `edges` arrays.
    *   **Auth Middleware:** Mock Firebase Admin to ensure missing/invalid tokens throw `401`.

## 3. Integration Testing
Integration tests ensure that the database, ORM, and API endpoints play nicely together.
*   **Tools:** Vitest + Supertest, using a local Postgres Docker container (or local Supabase stack).
*   **Target Areas:**
    *   **Ingestion API:** Mock Firebase storage upload, but run the LangChain chunking logic and assert that chunks are inserted into the test database.
    *   **RLS (Row Level Security):** Create User A and User B. Ensure User A querying `/api/graph` only returns User A's nodes, even if User B's nodes exist in the DB.

## 4. End-to-End (E2E) Testing (Playwright)
E2E tests will simulate real user flows in a headless browser.
*   **Tools:** Playwright.
*   **Critical Flows:**
    1.  **Auth Flow:** Login -> Redirected to Dashboard -> Logout -> Redirected to Login.
    2.  **Upload Flow:** Drag a sample PDF into the dropzone -> Wait for processing toast -> Assert new node appears in the DOM (React Flow canvas).
    3.  **Chat Flow:** Type "Hello" -> Assert AI response bubble appears.

## 5. AI Evaluation (Manual & Automated)
Testing AI output is non-deterministic.
*   **Golden Dataset:** Maintain a small set of 5 sample PDFs with known entities.
*   **Automated Eval:** Run an ingestion script on the golden dataset and use an LLM-as-a-judge (another Gemini prompt) to score the extracted entities against the expected entities (Precision/Recall).

## 6. Continuous Integration (GitHub Actions)
*   On Push to `main` or PR:
    1.  Run `tsc --noEmit` (Type checking).
    2.  Run ESLint.
    3.  Run Vitest Unit Tests.
    4.  Build Next.js app (`npm run build`).
