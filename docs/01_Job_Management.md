# Module 1: Job Management

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter or Admin, I want to create, approve, and manage job postings efficiently so that we can attract the right talent.

This module focuses on the creation, approval, and distribution of job requisitions. It is the entry point of the hiring workflow.

---

## User Stories

### Story 1.1: Job Creation with Structured Fields
**Description**
The core functionality allowing a Recruiter or Hiring Manager to initiate a new job requisition. The form must be structured to capture all essential data points required for downstream processes (hiring, reporting, integration).

**Scope**
*   **In-Scope:**
    *   Form UI with sections: Basic Info, Compensation, Team/Dept, Location (Remote/Hybrid/Onsite).
    *   Rich Text Editor for Job Description.
    *   Validation logic for mandatory fields.
    *   Draft saving capability.
*   **Out-of-Scope:**
    *   Dynamic custom fields (Phase 2).

**Pre-requisites**
*   Database schema for `Jobs` table defined.
*   Master data for Departments, Locations, and Employment Types must be populated.

**Acceptance Criteria**
1.  User can navigate to "Create Job" and see the form.
2.  Mandatory fields (Title, Department, Location) trigger validation errors if left empty.
3.  Salary range allows minimum, maximum, and currency selection.
4.  User can save the job as a "Draft" without publishing.
5.  Rich text editor supports bullet points, bolding, and headers.

**Technical Notes**
*   `POST /api/jobs`
*   Frontend: React Hook Form with Zod validation.

---

### Story 1.2: Job Templates & Cloning
**Description**
To speed up the creation process, users should be able to select from a library of pre-defined templates (e.g., "Senior Software Engineer") or clone an existing job requisition.

**Scope**
*   **In-Scope:**
    *   Template library management (Admin only).
    *   "Use Template" action in Job Creation flow.
    *   "Clone Job" action from the Job List view.
*   **Out-of-Scope:**
    *   Marketplace for external templates.

**Pre-requisites**
*   Story 1.1 (Job Creation) must be complete.

**Acceptance Criteria**
1.  Admin can create/edit/delete Job Templates.
2.  When selecting a template, the Job Creation form pre-fills with template data.
3.  Cloning a job copies all fields *except* the unique Job ID, Created Date, and Status (resets to Draft).
4.  User can modify the cloned data before saving.

---

### Story 1.3: AI-Powered JD Writing & Optimization
**Description**
Leverage LLMs to assist recruiters in writing compelling Job Descriptions (JDs) and optimizing them for SEO and inclusivity.

**Scope**
*   **In-Scope:**
    *   "Generate JD" button based on Job Title and Skills.
    *   "Optimize" button to rewrite existing text for better tone.
    *   Bias detection highlighting (e.g., gender-coded words).
    *   SEO keyword suggestions.
*   **Out-of-Scope:**
    *   Fully autonomous posting without human review.

**Pre-requisites**
*   Integration with AI Service (Module 11).

**Acceptance Criteria**
1.  User inputs "Java Developer" and clicks Generate; system returns a structured JD.
2.  System highlights biased words (e.g., "Ninja", "Rockstar") and suggests alternatives.
3.  Generated content is editable in the Rich Text Editor.
4.  Latency for generation should be under 5 seconds.

---

### Story 1.4: Job Approval Workflows
**Description**
Ensure financial and operational governance by requiring approvals before a job goes live.

**Scope**
*   **In-Scope:**
    *   Configuration of approval chains (e.g., Hiring Manager -> Finance -> HR).
    *   Email/In-app notifications for approvers.
    *   Approve/Reject actions with comment capability.
*   **Out-of-Scope:**
    *   Complex conditional logic (e.g., "If salary > $200k then CEO approves") - Phase 2.

**Pre-requisites**
*   User Roles & Permissions (Module 10).

**Acceptance Criteria**
1.  Job status changes to "Pending Approval" upon submission.
2.  Approver receives a notification with a link to review the job.
3.  If rejected, the job returns to "Draft" with the rejection reason.
4.  Job cannot be published until all approvers have signed off.

---

### Story 1.5: Internal & External Posting
**Description**
Publishing the approved job to various channels to attract candidates.

**Scope**
*   **In-Scope:**
    *   Toggle for "Internal Career Site".
    *   Integration with LinkedIn, Indeed, ZipRecruiter APIs.
    *   Social media sharing links.
*   **Out-of-Scope:**
    *   Paid ad campaign management directly from the platform.

**Pre-requisites**
*   Job Board Integrations (Module 12).

**Acceptance Criteria**
1.  User sees a "Publish" button only after approval.
2.  Selecting "LinkedIn" posts the job to the company's LinkedIn page via API.
3.  System generates a unique public URL for the job application page.
4.  Status updates to "Open" or "Published".

---

### Story 1.6: Job List Management & Operations
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing jobs at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across job title, description, department, location, and skills.
    *   **Filter:** Multi-select filters for:
        *   Status (Draft, Pending Approval, Open, Closed, On Hold)
        *   Department
        *   Location/Remote Type
        *   Employment Type (Full-time, Part-time, Contract)
        *   Salary Range
        *   Date Posted/Created
        *   Hiring Manager
        *   Number of Applicants (ranges)
    *   **Sort:** Sortable columns including Job Title, Created Date, Status, Applicant Count, Department, Location.
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions:**
        *   Close multiple jobs
        *   Change status (e.g., Draft to Pending Approval)
        *   Export selected jobs
        *   Delete draft jobs
        *   Assign to different recruiter
    *   **Export:** Download job data in CSV/Excel format with all fields.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "My Open Jobs", "Engineering Roles", "Remote Positions").
    *   **Quick Actions:** Inline actions for Clone, Edit, Publish, Archive without opening full detail view.
*   **Out-of-Scope:**
    *   Bulk editing of job content.
    *   Advanced reporting (covered in Module 13).

**Pre-requisites**
*   Stories 1.1 through 1.5 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 50k jobs.
2.  Filters can be combined (e.g., "Open" + "Engineering" + "Remote" + "Posted in last 30 days").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session and can be saved in Views.
5.  Pagination shows total count, current range, and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter" (with warning for large selections).
7.  Export includes all visible columns and respects active filters.
8.  Saved Views can be created, edited, deleted, shared with team, and set as personal default.
9.  List view shows key metrics: Job title, Status badge, Department, Location, Applicant count, Created date, Assigned recruiter.
10. Mobile-responsive table with card view for smaller screens.
11. Column visibility can be customized (show/hide columns).
12. Quick filters for common scenarios: "My Jobs", "Urgent (closing soon)", "No applicants yet".

---

### Story 1.7: Custom Job Fields & Form Customization
**Description**
Allow admins to customize the Job Creation Form by adding custom fields (e.g., "Budget Code", "Visa Sponsorship Available") to capture organization-specific data.

**Scope**
*   **In-Scope:**
    *   Settings UI to manage custom fields (Add, Edit, Delete).
    *   Supported field types: Text, Number, Dropdown, Date, Boolean.
    *   Configuration options: Label, Placeholder, Required/Optional, Options (for dropdowns).
    *   Rendering custom fields in `JobForm`.
    *   Storing custom field values in `Job` entity.
*   **Out-of-Scope:**
    *   Complex validation logic (e.g., regex patterns) - Phase 2.
    *   Conditional visibility of custom fields based on other fields.

**Pre-requisites**
*   Story 1.1 (Job Creation) completed.

**Acceptance Criteria**
1.  Admin can access "Job Form Settings" to add a new field.
2.  Admin can define field label, type, and required status.
3.  When creating/editing a job, the custom fields appear in the form.
4.  Values entered in custom fields are saved and retrieved correctly.
5.  Custom fields are included in job details view.
