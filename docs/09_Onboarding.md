# Module 9: Onboarding

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As an HR Admin, I want to initiate onboarding tasks and sync data so that the new hire is ready on Day 1.

This module bridges the gap between "Offer Accepted" and "Day 1".

---

## User Stories

### Story 9.1: Onboarding Checklist
**Description**
Orchestrate the tasks required for a new hire.

**Scope**
*   **In-Scope:**
    *   Task templates (e.g., "US Employee Onboarding").
    *   Assignees: New Hire, Manager, IT, HR.
    *   Due dates relative to Start Date (e.g., Start Date - 3 days).
*   **Out-of-Scope:**
    *   Gamified 3D office tour.

**Pre-requisites**
*   Offer Accepted status.

**Acceptance Criteria**
1.  When offer is signed, system triggers the "Onboarding" workflow.
2.  New Hire gets an email with a link to the "Welcome Portal".
3.  Portal shows tasks: "Upload Photo", "Provide Emergency Contact".
4.  Manager gets tasks: "Schedule Welcome Lunch".

---

### Story 9.2: Document Collection & Validation
**Description**
Securely collect tax forms, IDs, and other docs.

**Scope**
*   **In-Scope:**
    *   Secure upload fields.
    *   Admin verification step (Approve/Reject doc).
    *   Data encryption at rest.
*   **Out-of-Scope:**
    *   Automatic passport verification (use integration).

**Pre-requisites**
*   Secure Storage (S3 with encryption).

**Acceptance Criteria**
1.  Candidate uploads Passport PDF.
2.  HR Admin reviews and clicks "Verify".
3.  If rejected, candidate is notified to re-upload.

---

### Story 9.3: Provisioning Requests (IT Sync)
**Description**
Ensure the employee has a laptop and email on Day 1.

**Scope**
*   **In-Scope:**
    *   Integration with Okta / Azure AD (SCIM).
    *   Create User account automatically.
    *   Email notification to IT Helpdesk for hardware.
*   **Out-of-Scope:**
    *   MDM (Mobile Device Management) enrollment.

**Pre-requisites**
*   SCIM API.

**Acceptance Criteria**
1.  On "Provisioning Trigger" date, system calls Okta API to create user.
2.  User details (Name, Title, Dept) are synced.
3.  IT ticket is created (via email or Jira integration).

---

### Story 9.4: HRIS Sync
**Description**
Hand off the employee record to the system of record.

**Scope**
*   **In-Scope:**
    *   Push data to Workday / BambooHR / Rippling.
    *   Map fields (ATS -> HRIS).
    *   Handle "Pre-hire" vs "Employee" conversion.
*   **Out-of-Scope:**
    *   Bi-directional sync (HRIS -> ATS) for this phase.

**Pre-requisites**
*   HRIS API Credentials.

**Acceptance Criteria**
1.  Admin clicks "Push to HRIS" (or auto-trigger).
2.  System validates data completeness.
3.  Success/Error log is displayed.

---

### Story 9.5: Background Verification (BGV) Integration
**Description**
Streamline and automate the background verification process with intelligent document collection, AI-powered verification tools, seamless third-party BGV provider integration, and digital onboarding capabilities.

**What is Background Verification (BGV)?**
The process of validating a candidate's credentials, employment history, education, criminal records, and other relevant information before finalizing their employment. This ensures hiring decisions are based on accurate information and mitigates organizational risk.

**Why it is Important:**
*   **Risk Mitigation:** Prevents hiring candidates with falsified credentials or undisclosed issues
*   **Compliance:** Meets legal and regulatory requirements for certain industries
*   **Quality of Hire:** Ensures candidates meet the stated qualifications
*   **Employer Protection:** Reduces liability from negligent hiring claims
*   **Faster Onboarding:** Automated processes reduce time-to-hire

**Scope**
*   **In-Scope:**
    *   **Automated Document Collection:**
        *   **Smart Document Request System:**
            *   Configurable document checklists based on role, location, and level
            *   Automated email/SMS requests to candidates with secure upload links
            *   Document types: ID proof, address proof, education certificates, experience letters, salary slips, relieving letters, etc.
            *   Mobile-friendly upload interface with camera capture
            *   Drag-and-drop bulk upload support
            *   Progress tracking dashboard for candidates
        *   **Document Management:**
            *   Secure encrypted storage (AES-256)
            *   Document categorization and tagging
            *   Version control for re-uploaded documents
            *   Expiry date tracking (e.g., passport expiry)
            *   Automatic reminders for missing or expired documents
        *   **Validation Rules:**
            *   File format validation (PDF, JPG, PNG only)
            *   File size limits and compression
            *   Mandatory field checks before submission
            *   Duplicate detection
    *   **AI Verification Tools:**
        *   **Intelligent Document Verification:**
            *   **OCR (Optical Character Recognition):** Extract text from scanned documents
            *   **Data Extraction:** Auto-populate fields from documents (name, DOB, ID numbers, dates)
            *   **Document Authenticity Check:**
                *   Detect tampered or forged documents using AI
                *   Verify security features (watermarks, holograms) where applicable
                *   Flag suspicious documents for manual review
            *   **Cross-Verification:**
                *   Match extracted data against candidate profile
                *   Highlight discrepancies (name mismatch, date inconsistencies)
                *   Verify employment dates don't overlap
        *   **AI-Powered Anomaly Detection:**
            *   Identify unusual patterns (employment gaps, frequent job changes)
            *   Flag high-risk indicators for additional scrutiny
            *   Sentiment analysis on reference feedback
        *   **Automated Reference Checks:**
            *   Send automated reference request emails
            *   AI-generated questionnaires based on role
            *   Sentiment and credibility scoring of responses
    *   **Third-Party BGV Integration in ATS:**
        *   **Supported BGV Providers:**
            *   SpringVerify
            *   AuthBridge
            *   First Advantage
            *   HireRight
            *   Accurate Background
            *   IDfy (India)
            *   Veremark (Global)
        *   **Integration Capabilities:**
            *   **Initiate BGV:** One-click BGV initiation from candidate profile
            *   **Data Sync:** Auto-populate candidate details to BGV platform
            *   **Package Selection:** Choose verification package (basic, standard, comprehensive)
            *   **Real-time Status Updates:** Webhook integration for status changes
            *   **Report Retrieval:** Automatically fetch and store BGV reports in ATS
            *   **Status Tracking:** Visual timeline showing verification progress
        *   **Verification Types Supported:**
            *   Identity Verification (Aadhaar, PAN, Passport, Driver's License)
            *   Address Verification (current and permanent)
            *   Employment Verification (previous employers)
            *   Education Verification (degrees, certifications)
            *   Criminal Record Check (court records, police verification)
            *   Credit History Check (for finance roles)
            *   Drug Testing (where applicable)
            *   Professional License Verification
            *   Reference Checks
        *   **BGV Workflow:**
            *   Candidate consent collection (e-signature on consent form)
            *   Auto-trigger BGV when offer is accepted
            *   Candidate receives BGV provider link via email/SMS
            *   Candidate submits information directly to BGV provider
            *   ATS receives real-time updates (Initiated, In Progress, Pending Info, Completed, Discrepancy Found)
            *   Final report auto-attached to candidate profile
    *   **Digital Onboarding:**
        *   **Paperless Onboarding Portal:**
            *   Branded candidate-facing portal
            *   Mobile-responsive design
            *   Multi-language support
            *   Progress indicator showing completion status
        *   **E-Forms \u0026 E-Signatures:**
            *   Digital forms for: Personal details, Emergency contacts, Bank details, Tax declarations, NDA, Code of Conduct
            *   Integration with DocuSign, Adobe Sign, Zoho Sign
            *   Pre-filled forms using data from ATS
            *   Conditional form fields based on location/role
            *   Auto-save and resume capability
        *   **Onboarding Checklist:**
            *   Interactive checklist with task dependencies
            *   Auto-completion when documents uploaded
            *   Notifications for pending tasks
            *   Escalation alerts for overdue items
        *   **Welcome Kit:**
            *   Digital welcome packet with company policies, org chart, team intro
            *   Video messages from leadership
            *   Virtual office tour
            *   First-day agenda and logistics
        *   **IT Provisioning Integration:**
            *   Auto-create accounts (email, Slack, project management tools)
            *   Hardware request automation
            *   Access provisioning based on role
        *   **Compliance Management:**
            *   Auto-generate compliance documents (I-9, W-4 for US)
            *   E-Verify integration (US)
            *   Right to Work verification (UK)
            *   Data privacy consent (GDPR)
    *   **BGV Dashboard \u0026 Reporting:**
        *   Real-time BGV status for all candidates
        *   Filter by status, BGV provider, verification type
        *   Alerts for discrepancies or delays
        *   Turnaround time (TAT) tracking
        *   Compliance reports for audits
*   **Out-of-Scope:**
    *   Conducting BGV in-house (only integration with third-party providers)
    *   International BGV for all countries (Phase 1 focuses on India, US, UK)
    *   Continuous monitoring post-hire (Phase 2)

**Pre-requisites**
*   Offer Management (Module 8)
*   Document Storage Infrastructure (encrypted S3 or equivalent)
*   E-signature Integration (Story 8.3)
*   BGV Provider API credentials

**Acceptance Criteria**
1.  When offer is accepted, system automatically triggers BGV initiation workflow.
2.  Candidate receives automated email with secure link to upload required documents.
3.  Document upload portal is mobile-responsive and allows camera capture for photos.
4.  AI OCR extracts key data from uploaded ID proof (name, DOB, ID number) with 95%+ accuracy.
5.  System flags documents where extracted name doesn't match candidate profile name.
6.  Admin can configure document checklist templates for different roles (e.g., "Finance Role - India").
7.  One-click "Initiate BGV" button on candidate profile sends data to selected BGV provider (SpringVerify, AuthBridge, etc.).
8.  Candidate data (name, email, phone, address) auto-populates in BGV provider portal.
9.  Admin selects BGV package (Basic: ID + Education, Standard: +Employment, Comprehensive: +Criminal).
10. Real-time status updates from BGV provider appear in ATS (Initiated → In Progress → Completed).
11. When BGV is completed, final report is automatically downloaded and attached to candidate profile.
12. If BGV report shows discrepancy, system sends alert to recruiter and HR with highlighted issues.
13. Digital onboarding portal shows progress bar: "3 of 7 tasks completed".
14. E-forms are pre-filled with candidate data from ATS (name, email, phone, address).
15. Candidate can e-sign consent form, NDA, and offer letter within the portal using DocuSign integration.
16. When all documents are uploaded and verified, onboarding status changes to "Ready for Day 1".
17. IT provisioning workflow auto-triggers when BGV is cleared (creates email account, sends hardware request).
18. BGV dashboard shows: Total BGV initiated, In Progress, Completed, Discrepancies Found, Average TAT.
19. Admin can filter BGV list by: Status, Provider, Verification Type, Date Range, Discrepancy (Yes/No).
20. System maintains audit trail: Document uploaded by [Candidate] on [Date], Verified by [AI/Admin] on [Date], BGV initiated on [Date].
21. Automated reminders sent to candidates for missing documents (Day 2, Day 4, Day 6).
22. Document expiry tracking: System alerts 30 days before passport/visa expiry.
23. AI flags suspicious documents (e.g., inconsistent fonts, mismatched dates) for manual review.
24. Reference check emails are automatically sent to references provided by candidate.
25. Compliance check ensures all required documents collected before onboarding completion.

---

### Story 9.6: Onboarding List Management & Task Tracking
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing onboarding processes and tasks at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across new hire name, job title, manager name, and task descriptions.
    *   **Filter:**
        *   Onboarding Status (Not Started, In Progress, Completed, Delayed)
        *   Start Date (ranges)
        *   Department
        *   Location
        *   Task Completion % (ranges)
        *   Assigned To (New Hire, Manager, HR, IT)
        *   Overdue Tasks (Yes/No)
        *   HRIS Sync Status (Pending, Synced, Failed)
    *   **Sort:** Sortable columns including New Hire Name, Start Date, Completion %, Status, Days Until Start, Last Updated.
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions:**
        *   Send reminder emails
        *   Extend deadlines
        *   Assign/Reassign tasks
        *   Mark tasks as complete
        *   Export onboarding data
        *   Push to HRIS (bulk sync)
        *   Archive completed onboardings
    *   **Export:** Download onboarding data in CSV/Excel format with task details.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Starting This Week", "Incomplete Documents", "IT Provisioning Pending").
    *   **Quick Actions:** Inline actions for View Details, Send Reminder, Mark Complete, Push to HRIS.
    *   **Dashboard Widgets:**
        *   Onboarding completion rate
        *   Upcoming start dates
        *   Overdue tasks count
        *   Average time to complete
*   **Out-of-Scope:**
    *   Advanced task dependency management.
    *   Employee engagement surveys.

**Pre-requisites**
*   Stories 9.1 through 9.5 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 10k onboarding records.
2.  Filters can be combined (e.g., "Starting next week" + "Engineering" + "Incomplete documents").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session.
5.  Pagination shows total count and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
7.  Export includes all visible columns and respects active filters.
8.  Saved Views can be created, edited, deleted, and set as default.
9.  List view shows: New hire name/photo, Job title, Department, Start date with countdown, Completion progress bar, Overdue task count, Status badge, Quick actions.
10. Mobile-responsive with card layout for smaller screens.
11. Real-time updates when tasks are completed or status changes.
12. Quick filters for: "Starting This Week", "My Team", "Overdue Tasks", "Pending Documents", "Ready for HRIS Sync".
13. Visual indicators for urgent items (starting within 3 days, overdue tasks).
14. Task breakdown view showing individual task status per new hire.
15. Notification badges for items requiring action.
16. Gantt-style timeline view option showing all onboardings.
