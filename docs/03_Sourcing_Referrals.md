# Module 3: Sourcing & Referrals

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to proactively source talent and manage referrals so that I can build a strong pipeline.

This module empowers recruiters to find candidates who haven't applied yet (outbound recruiting) and leverage the employee network.

---

## User Stories

### Story 3.1: Talent Pools & Saved Searches
**Description**
Organize candidates into groups for future nurturing.

**Scope**
*   **In-Scope:**
    *   Create/Edit/Delete Talent Pools (e.g., "Q4 Engineering Hires").
    *   Add candidates to pools manually or via bulk action.
    *   Save advanced search queries (e.g., "Python + San Francisco").
*   **Out-of-Scope:**
    *   Dynamic pools that auto-update based on criteria (Phase 2).

**Pre-requisites**
*   Candidate Database (Module 2).

**Acceptance Criteria**
1.  Recruiter can create a named pool.
2.  Search results can be bulk-added to a pool.
3.  Recruiter can view all candidates in a pool.
4.  Saved searches alert the recruiter when new matching candidates appear (optional notification).

---

### Story 3.2: Email Outreach Campaigns
**Description**
Send bulk, personalized emails to talent pools to engage them.

**Scope**
*   **In-Scope:**
    *   Campaign builder (Select Pool -> Select Template -> Schedule).
    *   Mail merge variables ({{FirstName}}, {{CurrentCompany}}).
    *   Tracking: Sent, Opened, Clicked, Replied.
    *   Unsubscribe handling.
*   **Out-of-Scope:**
    *   Drip campaigns (multi-step sequences) - Phase 2.

**Pre-requisites**
*   Email Service Provider integration (SendGrid/AWS SES).

**Acceptance Criteria**
1.  User can select a template and a list of recipients.
2.  System sends individual emails (not CC/BCC).
3.  Analytics dashboard shows open rate %.
4.  Unsubscribe link is automatically appended; clicking it updates the candidate's consent status.

---

### Story 3.3: Referral Portal
**Description**
A dedicated view for employees to refer candidates and track their progress.

**Scope**
*   **In-Scope:**
    *   Employee login (SSO).
    *   "Refer a Friend" form (Upload Resume or Link).
    *   "My Referrals" dashboard showing status (e.g., "Screening", "Offer").
    *   Gamification (Leaderboard - optional).
*   **Out-of-Scope:**
    *   Payout processing (handled in Payroll/Finance system).

**Pre-requisites**
*   Employee Database/SSO.

**Acceptance Criteria**
1.  Employee can submit a referral for a specific job or general pool.
2.  System checks for duplicates; if candidate exists, notifies referrer.
3.  Referrer receives email notifications on status changes (optional config).
4.  Recruiter sees "Referred By [Name]" tag on the candidate profile.

---

### Story 3.4: AI Candidate Matching
**Description**
Automatically surface the best candidates for a job from the existing database.

**Scope**
*   **In-Scope:**
    *   Matching algorithm comparing Job Requirements vs. Candidate Profile.
    *   Scoring/Ranking (0-100% match).
    *   "Why this match?" explanation (e.g., "Matches 4/5 top skills").
*   **Out-of-Scope:**
    *   Matching against external databases (e.g., LinkedIn public profiles) without API.

**Pre-requisites**
*   AI Matching Engine (Module 11).

**Acceptance Criteria**
1.  When viewing a job, recruiter sees a "Suggested Candidates" tab.
2.  List is sorted by match score.
3.  Recruiter can "Invite to Apply" or "Add to Pipeline" directly from the list.

---

### Story 3.5: Sourcing & Referral List Management
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing talent pools, outreach campaigns, and referrals at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across talent pool names, candidate names in pools, referrer names, and campaign names.
    *   **Filter - Talent Pools:** 
        *   Pool Status (Active, Archived)
        *   Created By
        *   Date Created
        *   Number of Candidates (ranges)
        *   Tags
    *   **Filter - Referrals:**
        *   Referral Status (Pending, In Review, Hired, Rejected)
        *   Referrer Name/Department
        *   Job Referred For
        *   Date Submitted
        *   Referral Source (Portal, Email, Direct)
    *   **Filter - Outreach Campaigns:**
        *   Campaign Status (Draft, Scheduled, In Progress, Completed)
        *   Engagement Metrics (Open Rate, Click Rate, Reply Rate ranges)
        *   Date Sent
        *   Template Used
    *   **Sort:** Sortable columns for all relevant metrics (Name, Date, Count, Status, Engagement rates).
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions - Talent Pools:**
        *   Merge pools
        *   Archive/Delete pools
        *   Export pool members
        *   Add candidates to multiple pools
        *   Send outreach campaign to pool
    *   **Bulk Actions - Referrals:**
        *   Update status
        *   Assign to recruiter
        *   Send thank you emails to referrers
        *   Export referral data
    *   **Export:** Download data in CSV/Excel format with all fields.
    *   **Views:** Save custom filter combinations as "Saved Views".
    *   **Quick Actions:** Inline actions for View Details, Edit, Archive, Send Campaign.
*   **Out-of-Scope:**
    *   Advanced campaign analytics (covered in Module 13).
    *   Automated pool management.

**Pre-requisites**
*   Stories 3.1 through 3.4 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds across all sourcing entities.
2.  Filters can be combined (e.g., "Active pools" + "Created in Q4" + "More than 50 candidates").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session.
5.  Pagination shows total count and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
7.  Export includes all visible columns and respects active filters.
8.  Saved Views can be created, edited, deleted, and set as default.
9.  Talent Pool list view shows: Pool name, Candidate count, Created by, Last updated, Tags, Quick actions.
10. Referral list view shows: Candidate name, Referrer name, Job, Status, Date submitted, Current stage, Quick actions.
11. Campaign list view shows: Campaign name, Status, Recipients count, Open rate %, Click rate %, Reply rate %, Date sent, Quick actions.
12. Mobile-responsive with card layout for smaller screens.
13. Real-time updates for campaign metrics as they come in.
14. Quick filters for: "My Pools", "Active Campaigns", "New Referrals Today", "High-Performing Campaigns".
