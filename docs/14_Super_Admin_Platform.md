# Module 14: Super Admin & Platform Management

## Overview
**Module Owner:** Platform Engineering
**Status:** Planned
**Epic:** As a Super Admin, I want to manage tenants, view global analytics, and control system-wide configurations so that I can operate the SaaS platform effectively.

This module is the "God Mode" for the platform owners (Ayphen team), enabling management of the SaaS business itself.

---

## User Stories

### Story 14.1: Super Admin Console & Impersonation
**Description**
A unified command center for global administration and debugging.

**Scope**
*   **In-Scope:**
    *   **Universal Search (God Mode via Cmd+K):** Instantly find any Tenant, User, Job, or Invoice ID across the entire database.
    *   **Impersonation (Ghost Mode):** "Login as" any user (Tenant Admin, Recruiter) to reproduce bugs.
        *   Visual indicator "You are impersonating [User]" to prevent confusion.
        *   Read-only mode switch to prevent accidental data modification.
    *   **Global User Management:** Force reset passwords, MFA resets, or global bans for suspicious users across tenants.

**Acceptance Criteria**
1.  Super Admin can search for "John Doe" and see results from Company A and Company B.
2.  Impersonation session logs all actions as "SuperAdmin(as User)".
3.  "Stop Impersonating" button immediately returns to Super Admin context.

---

### Story 14.2: Tenant Management & Billing
**Description**
Lifecycle management of customer accounts (Tenants).

**Scope**
*   **In-Scope:**
    *   **Tenant List:** Sortable list of all companies (Active, Suspended, Trial).
    *   **Onboarding Wizard:** Manually create new tenants (Name, Custom Domain, Admin Email, Plan).
    *   **Plan Configuration:** Assign Subscription Plans (Free, Pro, Enterprise) which mandate feature flags and limits.
    *   **Feature Toggles:** Granularly enable/disable modules per tenant (e.g., "Enable AI Matching" only for Gold Tier).
    *   **Suspension:** One-click suspension of a tenant (stops all logins and API access).

**Acceptance Criteria**
1.  Creating a tenant triggers the "Welcome Email" to the assigned admin.
2.  Changing a plan from "Pro" to "Basic" immediately locks "Pro" features (e.g., Video Interviews).
3.  Suspended tenants see a "Contact Support" screen upon login.

---

### Story 14.3: Global Intelligence & Analytics
**Description**
Platform-wide insights to understand business health.

**Scope**
*   **In-Scope:**
    *   **Global Dashboard:** Total Active Users, ARR (if linked), Total Jobs Open, AI Usage Stats.
    *   **Churn Predictor:** AI analysis of login frequency and usage drops to flag "At Risk" tenants.
    *   **Hiring Trends:** Aggregated data (e.g., "Python skills demand +15%") across all tenants.
    *   **Bias Audit:** System-wide report on AI match score distribution across demographics.

**Acceptance Criteria**
1.  Dashboard loads within 3s aggregating data from all tenants.
2.  "At Risk" list is updated daily based on usage heuristics.
3.  All aggregated data is anonymized (no PII leak).

---

### Story 14.4: System Health & Kill-Switches
**Description**
Operational control to manage incidents and stability.

**Scope**
*   **In-Scope:**
    *   **Live Traffic Map:** Real-time visualization of active sessions and API load.
    *   **Global Kill-Switches:** Instantly disable specific sub-systems (e.g., "Stop All Email Sending", "Disable Resume Parsing") globally or per tenant.
    *   **Rate & Quota Management:** Throttling "heavy" tenants who exceed API limits.

**Acceptance Criteria**
1.  Kill-switch activation takes effect immediately (within 1 min) across all nodes.
2.  System notifies Super Admins if a tenant exceeds 2x their expected load.

---

### Story 14.5: Compliance & Security Center
**Description**
Tools to handle legal and security requirements at scale.

**Scope**
*   **In-Scope:**
    *   **GDPR Executor:** "Right to be Forgotten" tool that wipes a user/candidate from all logs and DB tables.
    *   **Forensic Audit Log:** Deep search of *every* system action filterable by IP, User Agent, Time.
    *   **White-Labeling:** UI to upload custom logos/CSS for Enterprise tenants.

**Acceptance Criteria**
1.  GDPR wipe is irreversible and generates a confirmation certificate.
2.  Audit log search accepts complex queries (e.g., `action:DELETE AND ip:192.168.1.1`).
