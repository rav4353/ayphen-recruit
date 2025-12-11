# Module 8: Offer Management

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to generate, approve, and track offers so that we can close candidates professionally.

This module handles the sensitive final stage of hiring: generating the legal contract and getting it signed.

---

## User Stories

### Story 8.1: Offer Letter Builder with AI-Generated Salary Breakup
**Description**
Create error-free offer letters using dynamic data with intelligent AI-powered salary breakup generation that optimizes tax efficiency and ensures compliance.

**Scope**
*   **In-Scope:**
    *   **Template Editor:**
        *   Rich text editor with placeholders ({{Salary}}, {{StartDate}}, {{Equity}}, {{Bonus}})
        *   Multiple template versions for different roles, levels, and locations
        *   Conditional sections based on employee type (full-time, contract, intern)
        *   Multi-language support for global hiring
    *   **AI-Generated Salary Breakup:**
        *   **Intelligent CTC Calculation:**
            *   Input: Annual CTC (Cost to Company)
            *   AI generates optimal salary structure with components:
                *   Basic Salary (40-50% of CTC)
                *   House Rent Allowance (HRA)
                *   Special Allowance
                *   Performance Bonus
                *   Employer PF Contribution
                *   Gratuity
                *   Medical Insurance
                *   Other Allowances (Transport, Food, etc.)
        *   **Tax Optimization:**
            *   AI suggests tax-efficient salary structure based on location (India: 80C, HRA exemptions; US: 401k; UK: Pension)
            *   Calculates estimated tax deductions
            *   Shows in-hand salary (take-home pay) after deductions
            *   Suggests optional tax-saving components
        *   **Compliance-Based Breakup:**
            *   Ensures minimum wage compliance
            *   Adheres to PF/ESI regulations (India)
            *   Complies with FLSA (US), Working Time Regulations (UK)
            *   Location-specific statutory deductions
        *   **Customizable Components:**
            *   Admin can define company-specific allowances
            *   Set min/max percentages for each component
            *   Configure variable pay vs. fixed pay ratio
        *   **Salary Comparison:**
            *   Show market benchmark for the role
            *   Highlight how offer compares to industry standards
            *   Display percentile ranking
    *   **Clause Library:**
        *   Pre-built clauses: "Non-compete for Sales", "IP Assignment for Eng", "Confidentiality", "Probation Period"
        *   Role-based clause recommendations
        *   Location-specific legal clauses
        *   Version control for clause updates
    *   **Preview as PDF:**
        *   Real-time PDF preview with actual data
        *   Branded letterhead with company logo
        *   Digital signature placeholders
        *   Downloadable and printable format
    *   **Offer Creation Workflow:**
        *   Auto-populate candidate details from profile
        *   Select template and customize
        *   AI generates salary breakup
        *   Review and adjust components
        *   Add custom clauses
        *   Preview and finalize
*   **Out-of-Scope:**
    *   Full CLM (Contract Lifecycle Management) features
    *   Equity management and cap table integration (Phase 2)
    *   Multi-currency real-time conversion

**Pre-requisites**
*   Candidate Profile with compensation expectations
*   Salary benchmarking data (optional, for AI suggestions)

**Acceptance Criteria**
1.  Recruiter fills a form with offer details: Annual CTC, Role, Location, Start Date.
2.  AI generates salary breakup with 8-10 components optimized for tax efficiency.
3.  System shows: Gross Salary, Total Deductions, Net Take-Home Pay.
4.  Salary breakup complies with local regulations (e.g., PF contribution for India).
5.  Recruiter can adjust individual components (increase HRA, decrease Special Allowance).
6.  System recalculates total and validates that sum equals CTC.
7.  AI suggests: "Increasing HRA by ₹5,000 can save ₹1,500 in taxes annually."
8.  Template includes conditional clauses: If Department = "Sales" → Add "Non-compete Clause".
9.  Preview shows offer letter with all placeholders replaced by actual values.
10. PDF includes detailed salary breakup table with monthly and annual figures.
11. System validates minimum wage compliance and shows warning if violated.
12. Offer letter includes market comparison: "This offer is at 75th percentile for this role."
13. Multi-language support: Generate offer in English, Hindi, Spanish, etc.
14. Clause library has at least 20 pre-built clauses categorized by type (Legal, Benefits, Policies).
15. Version control: If template is updated, existing offers remain unchanged.

---

### Story 8.2: Offer Approval Workflow
**Description**
Ensure offers meet budget and policy guidelines before sending.

**Scope**
*   **In-Scope:**
    *   Sequential approvals (Recruiter -> Hiring Manager -> Finance -> HR).
    *   "Request Changes" capability for approvers.
    *   Version control (Offer v1, v2).
*   **Out-of-Scope:**
    *   AI-based salary benchmarking (Phase 2).

**Pre-requisites**
*   Approval Engine (from Module 1).

**Acceptance Criteria**
1.  Offer cannot be sent to candidate until status is "Approved".
2.  Approvers see a summary of the offer vs. the job budget.
3.  Audit log tracks who approved and when.

---

### Story 8.3: E-Signature Integration & Tracking
**Description**
Seamless signing experience for candidates with comprehensive tracking, multi-party workflows, and integration with leading e-signature platforms.

**Scope**
*   **In-Scope:**
    *   **E-Signature Platform Integration:**
        *   **Supported Providers:**
            *   DocuSign (Primary)
            *   Adobe Sign
            *   Zoho Sign
            *   HelloSign (Dropbox Sign)
            *   PandaDoc
            *   SignNow
        *   **Integration Capabilities:**
            *   API-based integration with OAuth authentication
            *   Embedded signing (within ATS portal)
            *   Email-based signing (send link to candidate)
            *   SMS-based signing link delivery
            *   Bulk send for multiple offers
    *   **Signing Workflows:**
        *   **Single Signer:** Candidate only
        *   **Multi-Party Signing:**
            *   Sequential: Candidate → Hiring Manager → HR Head
            *   Parallel: Multiple signers simultaneously
            *   Conditional: If salary > $150k → CFO approval required
        *   **Witness/Notary Support:** For legal documents requiring witnesses
        *   **Delegate Signing:** Allow candidate to delegate to authorized person
    *   **E-Signature Features:**
        *   **Signing Methods:**
            *   Click-to-sign (simple)
            *   Draw signature with mouse/touch
            *   Upload signature image
            *   Type name (auto-generates signature)
            *   Digital certificate-based signing (PKI)
        *   **Identity Verification:**
            *   Email verification (default)
            *   SMS OTP verification
            *   Knowledge-based authentication (KBA)
            *   Government ID verification
            *   Biometric verification (for high-security documents)
        *   **Document Preparation:**
            *   Drag-and-drop signature fields
            *   Auto-detect signature locations
            *   Initial fields, date fields, checkbox fields
            *   Required vs. optional fields
            *   Field validation (e.g., date format)
    *   **Real-Time Status Tracking:**
        *   **Webhook Integration:**
            *   Sent: Document sent to signer
            *   Delivered: Email delivered successfully
            *   Viewed: Candidate opened the document
            *   Signed: Candidate completed signing
            *   Declined: Candidate declined to sign
            *   Expired: Signing deadline passed
            *   Voided: Document cancelled by sender
        *   **Status Updates in ATS:**
            *   Real-time status badge on candidate profile
            *   Activity timeline entry for each status change
            *   Push notifications to recruiter
            *   Email alerts for key events (signed, declined)
    *   **Offer Tracking Dashboard:**
        *   **Dashboard Widgets:**
            *   Total offers sent for signature
            *   Pending signatures (awaiting candidate)
            *   Signed today/this week
            *   Declined offers
            *   Expired offers
            *   Average time to sign (TAT)
            *   Signature completion rate
        *   **Visual Analytics:**
            *   Funnel chart: Sent → Viewed → Signed
            *   Time-to-sign trend graph
            *   Signature status pie chart
            *   Comparison: This month vs. last month
        *   **Drill-Down Capabilities:**
            *   Click on any metric to see detailed list
            *   Filter by date range, recruiter, department, job
            *   Export dashboard data to Excel/PDF
    *   **Document Management:**
        *   **Signed Document Storage:**
            *   Automatically save signed PDF to candidate profile
            *   Separate folder for signed vs. unsigned documents
            *   Version control (if offer is revised and re-sent)
            *   Tamper-proof storage with audit trail
        *   **Certificate of Completion:**
            *   Auto-generate certificate with signing details
            *   Timestamp and IP address of signer
            *   Legal validity proof
        *   **Document Retrieval:**
            *   Download signed offer anytime
            *   Bulk download for multiple candidates
            *   Share signed offer with HRIS/Payroll
    *   **Reminders & Notifications:**
        *   **Automated Reminders:**
            *   Send reminder if not viewed within 24h
            *   Send reminder if viewed but not signed within 48h
            *   Escalation reminder 24h before expiry
            *   Customizable reminder frequency
        *   **Notification Channels:**
            *   Email (primary)
            *   SMS (optional)
            *   In-app notification (if candidate has portal access)
            *   WhatsApp (via integration)
    *   **Compliance & Security:**
        *   **Legal Validity:**
            *   Compliant with ESIGN Act (US)
            *   eIDAS compliant (EU)
            *   IT Act 2000 compliant (India)
        *   **Audit Trail:**
            *   Complete history: Who sent, when viewed, when signed, IP address, device used
            *   Tamper-evident seal
            *   Court-admissible evidence
        *   **Data Security:**
            *   End-to-end encryption
            *   Secure document transmission (TLS)
            *   Access control (only authorized users can view)
    *   **Advanced Features:**
        *   **Embedded Signing:** Candidate signs within ATS portal without leaving
        *   **Mobile Optimization:** Fully responsive signing experience
        *   **Offline Signing:** Download, sign, upload (for areas with poor connectivity)
        *   **Bulk Send:** Send offers to multiple candidates in one action
        *   **Template Management:** Save signing workflows as templates
        *   **Custom Branding:** Company logo and colors in signing interface
*   **Out-of-Scope:**
    *   Proprietary e-sign engine building (rely on third-party providers)
    *   Blockchain-based signatures (Phase 2)
    *   Video-based signing verification

**Pre-requisites**
*   E-signature vendor API Key (DocuSign, Adobe Sign, etc.)
*   Offer Letter Builder (Story 8.1)

**Acceptance Criteria**
1.  "Send Offer" button triggers the e-sign envelope creation in DocuSign/Adobe Sign.
2.  Candidate receives email with "Review and Sign" button within 2 minutes.
3.  Candidate can sign on mobile or desktop with responsive interface.
4.  System supports 3 signing methods: Draw, Type, Upload signature image.
5.  When candidate views the document, status changes to "Viewed" in ATS within 30 seconds.
6.  When candidate signs, status changes to "Signed" and signed PDF is automatically saved to candidate profile.
7.  Status changes to "Hired" automatically upon signature completion.
8.  If candidate declines, recruiter receives immediate email notification.
9.  Automated reminder sent if candidate hasn't viewed offer within 24 hours.
10. Dashboard shows: 15 offers sent, 10 signed, 3 pending, 2 declined this week.
11. Average time-to-sign metric displayed: "Candidates sign in average 1.8 days".
12. Multi-party signing: Candidate signs first, then hiring manager receives notification to countersign.
13. Audit trail shows: Sent by [Recruiter] on [Date], Viewed by [Candidate] on [Date] from [IP], Signed on [Date].
14. Certificate of completion auto-generated with timestamp and legal validity statement.
15. Embedded signing: Candidate can sign within ATS portal without redirecting to DocuSign.
16. Bulk send: Recruiter selects 5 candidates and sends offers to all with one click.
17. SMS OTP verification: For high-value offers, candidate must verify identity via SMS before signing.
18. Expired offers: If not signed within 7 days (configurable), status changes to "Expired".
19. Voided offers: Recruiter can cancel/void sent offer, candidate receives notification.
20. Integration supports both embedded and email-based signing workflows.
21. Signed documents are tamper-proof with digital seal.
22. Dashboard filterable by: Date range, Status, Recruiter, Department, Job.
23. Export signed offers in bulk for HRIS integration.
24. Custom branding: Signing page shows company logo and brand colors.
25. Mobile signing: Candidate can sign using touch signature on smartphone.

---

### Story 8.4: Offer Expiry & Reminders
**Description**
Create urgency and track outstanding offers.

**Scope**
*   **In-Scope:**
    *   Set expiry date (e.g., 3 days).
    *   Auto-reminders (24h before expiry).
    *   Countdown timer on candidate view (optional).
*   **Out-of-Scope:**
    *   Auto-rescind (risky, requires manual confirmation).

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Recruiter sets expiry date.
2.  System sends reminder email 24h prior.
3.  Dashboard highlights "Expiring Soon" offers.

---

### Story 8.5: Offer List Management & Tracking
**Description**
Provide comprehensive list management capabilities for viewing, searching, filtering, and managing offers at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across candidate name, job title, offer details, and approver names.
    *   **Filter:**
        *   Offer Status (Draft, Pending Approval, Approved, Sent, Viewed, Signed, Declined, Expired, Withdrawn)
        *   Approval Stage (Pending Manager, Pending Finance, Pending HR, etc.)
        *   Job/Position
        *   Salary Range
        *   Date Created/Sent
        *   Expiry Status (Active, Expiring Soon, Expired)
        *   Recruiter/Owner
        *   Signature Status (Not Sent, Sent, Viewed, Signed)
    *   **Sort:** Sortable columns including Candidate Name, Job, Offer Date, Expiry Date, Salary, Status, Last Updated.
    *   **Pagination:** Configurable page size (25, 50, 100 records per page).
    *   **Bulk Actions:**
        *   Send reminder emails
        *   Withdraw offers
        *   Export to PDF/CSV
        *   Extend expiry dates
        *   Resend signature requests
        *   Archive offers
    *   **Export:** Download offer data in CSV/Excel format with customizable field selection.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Pending Approvals", "Expiring This Week", "Signed Offers").
    *   **Quick Actions:** Inline actions for View Offer, Edit, Send, Withdraw, Extend Expiry, View Signature Status.
    *   **Dashboard Widgets:**
        *   Offers by status (pie chart)
        *   Acceptance rate
        *   Average time to sign
        *   Expiring soon count
*   **Out-of-Scope:**
    *   Offer comparison analytics (Phase 2).
    *   Salary benchmarking integration.

**Pre-requisites**
*   Stories 8.1 through 8.4 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 50k offers.
2.  Filters can be combined (e.g., "Pending Approval" + "Engineering" + "Expiring in 3 days").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session.
5.  Pagination shows total count and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
7.  Export includes all visible columns and respects active filters (with option to exclude salary data).
8.  Saved Views can be created, edited, deleted, shared with team, and set as default.
9.  List view shows: Candidate name, Job, Offer status badge, Approval progress, Salary (if permitted), Expiry date with countdown, Signature status, Quick actions.
10. Mobile-responsive with card layout for smaller screens.
11. Real-time updates when offer status changes (e.g., signed, viewed).
12. Quick filters for: "My Offers", "Pending My Approval", "Expiring Soon", "Awaiting Signature", "Signed Today".
13. Visual indicators for urgent items (expiring within 24h).
14. Approval workflow progress bar showing current stage.
15. Notification badges for offers requiring action.
