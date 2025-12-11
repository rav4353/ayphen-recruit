# Module 12: Integrations

## Overview
**Module Owner:** Engineering
**Status:** Draft
**Epic:** As a Developer, I want to build connectors for third-party services so that the platform fits into the ecosystem.

This module manages the connectivity with the outside world.

---

## User Stories

### Story 12.1: Job Board Connectors
**Description**
Publish jobs and retrieve applicants from major boards.

**Scope**
*   **In-Scope:**
    *   LinkedIn (Apply with LinkedIn).
    *   Indeed (XML Feed / API).
    *   ZipRecruiter.
*   **Out-of-Scope:**
    *   Niche local job boards (Phase 2).

**Pre-requisites**
*   Partner API Keys.

**Acceptance Criteria**
1.  Job XML feed is generated and validated.
2.  "Apply with LinkedIn" button pre-fills application form.
3.  Source tracking (UTM parameters) captures where the candidate came from.

---

### Story 12.2: Background Check Integration
**Description**
Trigger checks without leaving the ATS.

**Scope**
*   **In-Scope:**
    *   Vendor: Checkr / Hireright.
    *   "Initiate Check" action.
    *   Webhook listener for status updates.
*   **Out-of-Scope:**
    *   Viewing full detailed report (PII) - link to vendor portal instead.

**Pre-requisites**
*   Vendor Agreement.

**Acceptance Criteria**
1.  Recruiter selects package (e.g., "Criminal + Education").
2.  Candidate receives email from Vendor.
3.  ATS status updates: "Pending" -> "Clear" or "Consider".

---

### Story 12.3: Calendar Providers
**Description**
Abstract layer for calendar interactions.

**Scope**
*   **In-Scope:**
    *   Unified API for Google and Outlook.
    *   Token management.
    *   Rate limit handling.
*   **Out-of-Scope:**
    *   CalDAV generic support.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Service handles API differences between Google/Microsoft.
2.  Retries on transient failures.
