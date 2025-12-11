# Module 6: Interview Feedback & Scorecards

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As an Interviewer, I want to submit structured feedback so that hiring decisions are data-driven and fair.

This module ensures that interviews are evaluated consistently using pre-defined criteria rather than gut feeling.

---

## User Stories

### Story 6.1: Custom Scorecard Templates
**Description**
Admins need to define what "good" looks like for each role.

**Scope**
*   **In-Scope:**
    *   Builder UI: Sections, Questions, Rating Scales (1-5, Thumbs Up/Down, Yes/No).
    *   Focus Areas (e.g., "Culture Fit", "Technical Skills").
    *   Assign scorecards to specific pipeline stages.
*   **Out-of-Scope:**
    *   Dynamic branching questions.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Admin can create a "Sales Scorecard" with 5 specific questions.
2.  Can mark questions as "Mandatory".
3.  Can add help text/guidelines for interviewers ("Look for X, Y, Z").

---

### Story 6.2: Submit Feedback
**Description**
The interface for interviewers to log their evaluation.

**Scope**
*   **In-Scope:**
    *   Mobile-responsive form.
    *   Split view: Resume on left, Scorecard on right.
    *   Overall Recommendation (Strong Hire, Hire, No Hire, Strong No Hire).
    *   Private notes (visible only to Hiring Manager/Recruiter).
*   **Out-of-Scope:**
    *   Offline mode.

**Pre-requisites**
*   Interview Scheduled (Module 5).

**Acceptance Criteria**
1.  Interviewer receives link via email/calendar.
2.  Form auto-saves drafts.
3.  Submission triggers notification to Recruiter.
4.  Cannot submit if mandatory fields are empty.

---

### Story 6.3: AI Scorecard Summarization
**Description**
Synthesize feedback from multiple interviewers to aid decision making.

**Scope**
*   **In-Scope:**
    *   Aggregated view of scores.
    *   LLM-generated summary: "Consensus is positive on technical skills, but concerns raised about communication."
    *   Highlight discrepancies (e.g., Interviewer A gave 5/5, B gave 1/5).
*   **Out-of-Scope:**
    *   AI making the final decision.

**Pre-requisites**
*   AI Service (Module 11).

**Acceptance Criteria**
1.  Summary appears on the Candidate Profile once >1 scorecard is submitted.
2.  Key pros and cons are bulleted.
3.  Average score calculation is accurate.

---

### Story 6.4: Interview Question Assistant
**Description**
Help interviewers ask the right questions during the session.

**Scope**
*   **In-Scope:**
    *   "Suggestion" sidebar in the scorecard.
    *   Questions based on Role + Candidate Resume (e.g., "Ask about their gap year", "Deep dive into React project").
*   **Out-of-Scope:**
    *   Real-time speech analysis.

**Pre-requisites**
*   AI Service.

**Acceptance Criteria**
1.  System generates 5 suggested questions before the interview starts.
2.  Interviewer can pin questions to their scorecard.

---

### Story 6.5: Scorecard List Management & Operations
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing scorecards at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across candidate name, interviewer name, job title, and feedback comments.
    *   **Filter:** Multi-select filters for:
        *   Interview Stage
        *   Interviewer Name
        *   Overall Recommendation (Strong Hire, Hire, No Hire, Strong No Hire)
        *   Score Range (e.g., 1-2, 3-4, 4-5)
        *   Date Range (submission date)
        *   Job/Position
    *   **Sort:** Sortable columns including Candidate Name, Interview Date, Submission Date, Average Score, Interviewer.
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions:**
        *   Export selected scorecards to PDF/CSV.
        *   Send reminder emails to interviewers who haven't submitted feedback.
        *   Archive/Delete multiple scorecards.
    *   **Export:** Download scorecard data in CSV/Excel format with all fields.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Pending Feedback", "High Scores This Week").
*   **Out-of-Scope:**
    *   Advanced analytics dashboards (covered in Module 13).
    *   Bulk editing of scorecard content.

**Pre-requisites**
*   Stories 6.1, 6.2 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 100k scorecards.
2.  Filters can be combined (e.g., "Strong Hire" + "Last 30 days" + "Engineering roles").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session.
5.  Pagination shows total count and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
7.  Export includes all visible columns and respects active filters.
8.  Saved Views can be created, edited, deleted, and set as default.
9.  List view shows key metrics: Candidate name, Job, Interview date, Interviewer, Overall recommendation, Average score, Status (Submitted/Pending).
10. Mobile-responsive table with horizontal scroll for smaller screens.
