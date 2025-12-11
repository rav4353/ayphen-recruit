# Module 11: AI Layer

## Overview
**Module Owner:** AI/ML Team
**Status:** Draft
**Epic:** As a Product Owner, I want to embed AI capabilities across the platform to enhance user productivity.

This module provides the intelligence services consumed by other modules.

---

## User Stories

### Story 11.1: Embeddings & Matching Engine
**Description**
The core engine for semantic search and candidate matching.

**Scope**
*   **In-Scope:**
    *   Text-to-Vector conversion (OpenAI / HuggingFace models).
    *   Vector Database (Pinecone / Milvus / Pgvector).
    *   Similarity Search API.
*   **Out-of-Scope:**
    *   Training custom foundation models.

**Pre-requisites**
*   Vector DB Infrastructure.

**Acceptance Criteria**
1.  API accepts text (Resume/JD) and returns vector.
2.  Search API returns nearest neighbors with distance scores.
3.  Latency < 200ms for search.

---

### Story 11.2: Recruiter Assistant (RAG)
**Description**
Conversational interface to query the candidate database.

**Scope**
*   **In-Scope:**
    *   Chat UI.
    *   Retrieval Augmented Generation (RAG) pipeline.
    *   Context: Candidate Profiles, Job Descriptions, Notes.
*   **Out-of-Scope:**
    *   Voice interaction.

**Pre-requisites**
*   LLM API Access.

**Acceptance Criteria**
1.  User asks "Who has experience with React and Fintech?".
2.  System retrieves relevant profiles and summarizes why they fit.
3.  Citations (links to profiles) are provided.

---

### Story 11.3: Bias Detection Service
**Description**
Analyze text for non-inclusive language.

**Scope**
*   **In-Scope:**
    *   API endpoint: Input Text -> Output Highlighted Spans + Suggestions.
    *   Categories: Gender, Age, Ableism.
*   **Out-of-Scope:**
    *   Image bias detection.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Input: "We need a young energetic guy."
2.  Output: Flag "young" (Ageism), "guy" (Gender). Suggest: "energetic individual".

---

### Story 11.4: Resume Parsing Service
**Description**
Extract structured data from unstructured documents.

**Scope**
*   **In-Scope:**
    *   Entity Extraction (NER).
    *   Section Segmentation (Experience, Education).
    *   Standardization (Dates, Locations).
*   **Out-of-Scope:**
    *   Handwriting recognition.

**Pre-requisites**
*   OCR / Text Extraction Libs.

**Acceptance Criteria**
1.  Parses PDF/Docx.
2.  Returns JSON object conforming to Candidate Schema.
3.  Handles multi-column layouts correctly.
