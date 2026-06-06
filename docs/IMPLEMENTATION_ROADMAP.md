# Implementation Roadmap (MVP to V3)

## Phase 1: MVP (Months 1-3)
*Status: Defined in the Sprint Plan.*
*   **Focus:** Prove the core loop: Upload -> Auto-Graph -> Chat.
*   **Key Deliverables:**
    *   PDF/TXT Upload.
    *   Gemini-powered Entity/Relationship Extraction.
    *   PostgreSQL + pgvector storage.
    *   2D React Flow Graph.
    *   RAG Chat with Citations.

## Phase 2: Knowledge Expansion & Sync (Months 4-6)
*   **Focus:** Making ingestion ubiquitous and frictionless.
*   **Key Deliverables:**
    *   **Browser Extension:** "Clip to NEURONEX". Extracts main article text from URLs and injects into the graph.
    *   **Image/Screenshot Support:** OCR integration. Users can drop images of whiteboards, and the text is extracted and graphed.
    *   **Notion/Obsidian Importer:** Bulk ingest existing PKM systems.
    *   **Graph Editing:** UI controls to manually merge nodes, delete edges, or create custom connections (overriding AI mistakes).

## Phase 3: Analytics & 3D Immersion (Months 7-9)
*   **Focus:** Visual wow-factor and deeper insights.
*   **Key Deliverables:**
    *   **3D React Three Fiber View:** A toggle to fly through the knowledge graph in 3D space.
    *   **Knowledge Timeline:** A slider at the bottom of the screen to see how the graph evolved over time (e.g., "Show my graph from 2024").
    *   **Recommendation Engine:** "Because you clicked 'Machine Learning', you should review these 3 disconnected notes."

## Phase 4: Autonomous Agents (V3+)
*   **Focus:** Proactive knowledge management.
*   **Key Deliverables:**
    *   **Knowledge Gap Detection:** The AI identifies clusters of information and proactively suggests web articles or books to fill missing foundational knowledge.
    *   **Auto-Synthesis:** Overnight, the system generates "Review Briefs" summarizing new connections found between yesterday's uploads and data from 2 years ago.
