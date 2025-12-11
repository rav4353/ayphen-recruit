# Module 2: Candidate & Application Management

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to centralize candidate data and manage applications so that I can track talent effectively.

This module is the core database of talent. It handles the ingestion, storage, and management of candidate profiles and their specific applications to jobs.

---

## User Stories

### Story 2.1: Candidate Profile Creation
**Description**
A unified view of the candidate that aggregates all their data, regardless of which job they applied for.

**Scope**
*   **In-Scope:**
    *   Manual creation form.
    *   Profile sections: Personal Info, Experience, Education, Social Links.
    *   Activity Log (timeline of actions).
*   **Out-of-Scope:**
    *   Social media scraping (enrichment).

**Pre-requisites**
*   Database schema for `Candidates` and `Applications`.

**Acceptance Criteria**
1.  Recruiter can manually add a candidate.
2.  Profile view shows a summary of all active and archived applications for that candidate.
3.  Contact information (Email, Phone) is validated.
4.  Duplicate check runs on email entry.

---

### Story 2.2: Resume Upload & AI Parsing
**Description**
Automate data entry by extracting structured data from resume documents.

**Scope**
*   **In-Scope:**
    *   Support for PDF, DOCX, TXT formats.
    *   Extraction of: Name, Email, Phone, Skills, Work History, Education.
    *   Mapping extracted data to profile fields.
*   **Out-of-Scope:**
    *   OCR for image-based resumes (Phase 2).

**Pre-requisites**
*   AI Parsing Service (Module 11).

**Acceptance Criteria**
1.  User uploads a PDF; system parses it within 10 seconds.
2.  Parsed fields are presented for review/confirmation before saving.
3.  Original file is stored and viewable in a document viewer.
4.  Parsing accuracy for standard layouts > 90%.

---

### Story 2.3: Skill Extraction & Normalization
**Description**
Standardize skills to allow for effective searching and matching.

**Scope**
*   **In-Scope:**
    *   Extract skills from resume.
    *   Map synonyms to a canonical list (e.g., "ReactJS", "React.js" -> "React").
    *   Manual tagging of skills.
*   **Out-of-Scope:**
    *   Skill proficiency testing.

**Pre-requisites**
*   Master Skill Database/Taxonomy.

**Acceptance Criteria**
1.  Parsed skills are matched against the master taxonomy.
2.  New skills not in the DB are flagged as "Unverified" or added (based on config).
3.  Recruiter can manually add/remove skills from a profile.

---

### Story 2.4: GDPR & Consent Capture
**Description**
Ensure compliance with data privacy regulations by managing candidate consent.

**Scope**
*   **In-Scope:**
    *   Consent checkbox on the career site application form.
    *   Backend tracking of consent date and expiry.
    *   "Right to be Forgotten" (Anonymize/Delete) functionality.
*   **Out-of-Scope:**
    *   Legal counsel provided by the platform.

**Pre-requisites**
*   Compliance Settings configuration.

**Acceptance Criteria**
1.  Application cannot be submitted without checking the consent box.
2.  Admin can configure data retention period (e.g., 2 years).
3.  Automated email sent to candidate before expiry to request renewal.
4.  "Delete Candidate" action performs a hard delete or anonymization based on policy.

---

### Story 2.5: Duplicate Detection
**Description**
Prevent database clutter and confusion by identifying duplicate profiles.

**Scope**
*   **In-Scope:**
    *   Check based on Email (exact match) and Phone (fuzzy match).
    *   Alert during manual creation or bulk upload.
    *   Merge functionality (Primary vs. Secondary profile).
*   **Out-of-Scope:**
    *   Face recognition.

**Pre-requisites**
*   Search Indexing.

**Acceptance Criteria**
1.  System flags duplicate if email exists.
2.  If a candidate applies to a new job, system links application to existing profile instead of creating a new one.
3.  Merge tool allows recruiter to select which data points to keep from each profile.

---

### Story 2.6: Candidate & Application List Management
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing candidates and applications at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across candidate name, email, phone, skills, experience, education, and resume content.
    *   **Advanced Search:** Boolean operators (AND, OR, NOT) and field-specific search (e.g., skills:React AND location:NYC).
    *   **Filter:** Multi-select filters for:
        *   Application Status (New, In Review, Shortlisted, Rejected, etc.)
        *   Pipeline Stage
        *   Job Applied For
        *   Source (Career Site, LinkedIn, Referral, etc.)
        *   Skills (with AND/OR logic)
        *   Experience Level (Entry, Mid, Senior)
        *   Location/Willing to Relocate
        *   Date Applied (ranges)
        *   Rating/Score
        *   Tags
        *   Assigned Recruiter
    *   **Sort:** Sortable columns including Name, Application Date, Last Activity, Score/Rating, Stage, Source.
    *   **Pagination:** Configurable page size (25, 50, 100 records per page) with infinite scroll option.
    *   **Bulk Actions:**
        *   Move to different pipeline stage
        *   Assign/Reassign to recruiter
        *   Add/Remove tags
        *   Send bulk emails (templates)
        *   Export to CSV/Excel
        *   Archive/Delete applications
        *   Schedule interviews
    *   **Export:** Download candidate data in CSV/Excel format with customizable field selection.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Hot Candidates", "React Developers", "Pending Review").
    *   **Quick Actions:** Inline actions for View Profile, Move Stage, Send Email, Schedule Interview.
    *   **List Layouts:** Toggle between Table, Card, and Compact views.
*   **Out-of-Scope:**
    *   Bulk resume upload (Phase 2).
    *   Advanced talent pool segmentation.

**Pre-requisites**
*   Stories 2.1 through 2.5 completed.
*   Search indexing infrastructure (Elasticsearch or similar).

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 500k candidates.
2.  Advanced search supports complex queries like: `skills:(React OR Angular) AND experience:>5 AND location:Remote`.
3.  Filters can be stacked and combined with search.
4.  Active filters are clearly displayed with option to clear individually or all at once.
5.  Sort order persists during the session.
6.  Pagination shows total count and allows jumping to specific pages.
7.  Bulk select allows "Select All on Page" and "Select All Matching Filter" (with confirmation for >100 records).
8.  Export respects active filters and allows field selection (e.g., exclude sensitive data).
9.  Saved Views can be created, edited, deleted, shared with team, and set as default.
10. List view shows: Candidate photo/avatar, Name, Current stage, Job applied for, Skills (top 3), Source, Application date, Last activity, Assigned recruiter, Quick action buttons.
11. Mobile-responsive with card layout for touch-friendly interaction.
12. Column visibility and order can be customized per user.
13. Quick filters for: "New Today", "Awaiting My Review", "Top Rated", "Expiring Soon (GDPR)".
14. Real-time updates when another user modifies a candidate in the current view.
