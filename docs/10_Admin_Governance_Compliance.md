# Module 10: Admin, Governance & Compliance

## Overview
**Module Owner:** Engineering/Security
**Status:** Draft
**Epic:** As an Admin, I want to control access and ensure compliance so that the system is secure and auditable.

This module provides the backbone for security, configuration, and legal compliance.

---

## User Stories

### Story 10.1: Role-Based Access Control (RBAC)
**Description**
Granular control over who can see and do what.

**Scope**
*   **In-Scope:**
    *   Standard Roles: Super Admin, Recruiter, Hiring Manager, Interviewer, Vendor.
    *   Custom Role Builder (Select permissions).
    *   Scope restrictions (e.g., "Can only see jobs in Sales Dept").
*   **Out-of-Scope:**
    *   Attribute-based access control (ABAC) - Phase 2.

**Pre-requisites**
*   Auth Service.

**Acceptance Criteria**
1.  Admin can create a role "Junior Recruiter" with "View Candidates" but no "Delete" permission.
2.  UI elements hide if user lacks permission.
3.  API endpoints enforce authorization checks.

---

### Story 10.2: Audit Logs
**Description**
Traceability for all critical system actions.

**Scope**
*   **In-Scope:**
    *   Log: Who, What, When, IP Address.
    *   Events: Login, View Profile, Edit Offer, Export Data.
    *   Searchable Audit Trail UI for Admins.
*   **Out-of-Scope:**
    *   SIEM integration (Phase 2).

**Pre-requisites**
*   Logging Infrastructure.

**Acceptance Criteria**
1.  Every write action is logged.
2.  "View Sensitive Data" (e.g., Salary) is logged.
3.  Logs are immutable and retained for X years.

---

### Story 10.3: Multi-Tenancy & Org Settings
**Description**
Support multiple organizations or distinct business units.

**Scope**
*   **In-Scope:**
    *   Logical separation of data by Tenant ID.
    *   Org-level settings: Logo, Timezone, Currency, Date Format.
*   **Out-of-Scope:**
    *   On-premise deployment.

**Pre-requisites**
*   Database Architecture (Tenant Column).

**Acceptance Criteria**
1.  Data from Tenant A is never accessible to Tenant B.
2.  Admin can upload company logo which replaces the default app branding.

---

### Story 10.4: SSO & Authentication
**Description**
Secure and convenient login.

**Scope**
*   **In-Scope:**
    *   SAML 2.0 / OIDC support.
    *   Google / Microsoft Social Login.
    *   MFA enforcement options.
*   **Out-of-Scope:**
    *   Biometric login.

**Pre-requisites**
*   Identity Provider (Auth0 / Firebase / Cognito).

**Acceptance Criteria**
1.  User can log in via Okta.
2.  Admin can enforce "SSO Only" for the organization.
3.  Session timeout configuration.

---

### Story 10.5: Admin & Audit List Management
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing users, roles, audit logs, and system configurations at scale.

**Scope**
*   **In-Scope:**
    *   **Search - Users:** Full-text search across user name, email, role, and department.
    *   **Search - Audit Logs:** Full-text search across user, action, resource, and IP address.
    *   **Filter - Users:**
        *   Status (Active, Inactive, Suspended, Pending Invitation)
        *   Role
        *   Department
        *   Last Login (date ranges)
        *   MFA Enabled (Yes/No)
        *   SSO vs Password Login
    *   **Filter - Audit Logs:**
        *   Action Type (Login, View, Edit, Delete, Export, etc.)
        *   User/Actor
        *   Resource Type (Candidate, Job, Offer, etc.)
        *   Date/Time Range
        *   IP Address
        *   Success/Failure
        *   Severity Level (Info, Warning, Critical)
    *   **Sort:** Sortable columns for all relevant fields (Name, Email, Role, Last Login, Action Time, etc.).
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions - Users:**
        *   Activate/Deactivate users
        *   Assign/Change roles
        *   Send invitation emails
        *   Reset passwords
        *   Enforce MFA
        *   Export user list
    *   **Bulk Actions - Audit Logs:**
        *   Export selected logs
        *   Flag for review
        *   Archive old logs
    *   **Export:** Download user data and audit logs in CSV/Excel/JSON format.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Inactive Users", "Failed Logins", "Salary View Events").
    *   **Quick Actions:** Inline actions for Edit User, Reset Password, View Activity, Deactivate.
    *   **Dashboard Widgets:**
        *   Active users count
        *   Recent login activity
        *   Failed login attempts
        *   Critical audit events
        *   MFA adoption rate
*   **Out-of-Scope:**
    *   Advanced SIEM integration.
    *   Automated threat detection.

**Pre-requisites**
*   Stories 10.1 through 10.4 completed.
*   Audit logging infrastructure.

**Acceptance Criteria**
1.  User search returns results within 2 seconds for databases with up to 10k users.
2.  Audit log search returns results within 3 seconds for databases with up to 10M log entries.
3.  Filters can be combined (e.g., "Failed logins" + "Last 24 hours" + "Admin users").
4.  Active filters are clearly displayed with option to clear individually or all at once.
5.  Sort order persists during the session.
6.  Pagination shows total count and allows jumping to specific pages.
7.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
8.  Export includes all visible columns and respects active filters.
9.  Saved Views can be created, edited, deleted, and set as default.
10. User list view shows: Name, Email, Role, Department, Status badge, Last login, MFA status, Quick actions.
11. Audit log view shows: Timestamp, User, Action, Resource, IP address, Status (success/failure), Details link.
12. Mobile-responsive with simplified view for smaller screens.
13. Real-time updates for new audit events (with notification).
14. Quick filters for: "Active Users", "Recent Logins", "Failed Logins Today", "Critical Events", "My Actions".
15. Audit log detail view shows full context including before/after values for edits.
16. User activity timeline showing all actions by a specific user.
17. Export respects data retention policies and redacts sensitive information if configured.
18. Advanced search for audit logs with field-specific queries (e.g., action:DELETE AND resource:Candidate).
