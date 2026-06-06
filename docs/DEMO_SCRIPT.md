# Hackathon Demo Script

**Target Duration:** 3-4 Minutes
**Vibe:** Fast-paced, visual, showing rather than telling.

## Setup (Pre-Demo)
*   Have the NEURONEX dashboard open. It should be completely empty (Empty State: "Feed your brain").
*   Have a folder open on the desktop with 3 distinct PDFs:
    1.  A whitepaper on Quantum Computing.
    2.  A biography excerpt on Alan Turing.
    3.  An article on modern Cryptography.
*   Ensure the local/deployed server is warm (no cold start delays).

## Step 1: The Problem & The Hook (0:00 - 0:45)
**Speaker:** "We all suffer from information overload. We save PDFs to folders, bookmark articles, and write notes. But folders are dead ends. The human brain works by association—connecting ideas. So why do our tools force us to use rigid folders? Meet NEURONEX. Your automated, zero-friction Second Brain. Let me show you."

## Step 2: The Magic Ingestion (0:45 - 1:30)
**Speaker:** "Here is an empty brain. I have three completely different PDFs. Quantum Computing, Alan Turing, and Cryptography. I'm just going to drag and drop them in."
*(Action: Drag all 3 PDFs into the browser).*
**Speaker:** "I don't tag them. I don't organize them. NEURONEX's AI pipeline is reading the text, chunking it, and extracting entities and relationships. Watch."
*(Action: The React Flow canvas animates. Nodes pop up. "Quantum Computing", "Turing", "Cryptography". Lines automatically draw between them as the force-directed layout settles).*
**Speaker:** "Without me doing anything, the AI figured out that Turing is related to Cryptography, and Cryptography relies on Quantum concepts. My knowledge is instantly mapped."

## Step 3: Interaction & RAG (1:30 - 2:30)
**Speaker:** "But a map is only useful if you can explore it. I can click 'Alan Turing'..."
*(Action: Click node. Sidebar opens).*
**Speaker:** "...and see exactly which documents mention him. Even better, I can chat with my brain."
*(Action: Open Chat pane. Type: "How does Turing's work impact the quantum cryptography paper I just uploaded?")*
**Speaker:** "Standard AI would give a generic answer. NEURONEX uses RAG (Retrieval-Augmented Generation) against my specific graph."
*(Action: AI responds with specific details, generating citation pills).*
**Speaker:** "It gave me the exact answer, synthesized from two different PDFs, and provided citations. If I click the citation, it takes me directly to the source."

## Step 4: The Vision (2:30 - 3:00)
**Speaker:** "We built this in [Timeframe] using Next.js, pgvector, and the Gemini API. In the future, NEURONEX will integrate with your browser, Notion, and email, building a 3D universe of everything you've ever learned. Stop organizing. Start thinking. Thank you."
