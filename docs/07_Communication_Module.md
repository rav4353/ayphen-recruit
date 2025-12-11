# Module 7: Communication Module

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to communicate with candidates via email and SMS from the platform so that all history is logged.

This module acts as the email client within the ATS, ensuring no context is lost in personal inboxes.

---

## User Stories

### Story 7.1: Email Composer & Threading
**Description**
Send and receive emails directly within the candidate profile.

**Scope**
*   **In-Scope:**
    *   Rich Text Editor.
    *   Template selection.
    *   Attachment support.
    *   Two-way sync (via Gmail/Outlook API or IMAP/SMTP).
*   **Out-of-Scope:**
    *   Full email client features (Folders, Rules).

**Pre-requisites**
*   Email Integration.

**Acceptance Criteria**
1.  Emails sent from ATS appear in user's "Sent" folder in Gmail/Outlook.
2.  Replies from candidates appear in the ATS "Activity" feed.
3.  Unread badge indicates new replies.

---

### Story 7.2: Bulk Messaging
**Description**
Communicate with many candidates at once (e.g., Mass Rejection).

**Scope**
*   **In-Scope:**
    *   Select multiple candidates -> "Send Email".
    *   Preview mode (shows variables resolved).
    *   Queueing system for large batches.
*   **Out-of-Scope:**
    *   A/B testing subject lines.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  User selects 50 candidates and chooses "Rejection Template".
2.  System confirms "Send 50 emails?".
3.  Emails are sent asynchronously.
4.  Activity log updates for all 50 profiles.

---

### Story 7.3: Mass Mailing / Bulk Emailing to Candidates
**Description**
Send job updates, interview invites, or company information to a large group of candidates at once using intelligent segmentation and AI-powered personalization.

**What is Mass Mailing?**
Mass mailing enables recruiters to communicate with multiple candidates simultaneously for:
*   Job opening announcements
*   Interview invitations
*   Application status updates
*   Company news and culture updates
*   Event invitations (job fairs, webinars)
*   Re-engagement campaigns for passive candidates

**Why it is Important:**
*   **Saves Time:** Communicate with hundreds of candidates in minutes instead of hours
*   **Ensures Consistent Communication:** Standardized messaging across all recipients
*   **Helps in Bulk Hiring:** Essential for high-volume recruitment drives
*   **Increases Candidate Engagement:** Regular touchpoints keep candidates interested
*   **Improves Employer Brand:** Professional, timely communication enhances company reputation

**Scope**
*   **In-Scope:**
    *   **Mass Mailing Portal:**
        *   Dedicated interface for creating and managing bulk email campaigns
        *   Template library with pre-built templates for common scenarios
        *   Rich text editor with merge fields and dynamic content
        *   Preview mode showing how emails appear to different candidate segments
    *   **AI-Powered Features:**
        *   **Personalized Subject Lines:** AI generates engaging subject lines based on candidate profile and campaign type
        *   **Auto-Segmentation:** Automatically group candidates by:
            *   Experience level (0-2 years, 2-5 years, 5+ years)
            *   Skills and competencies
            *   Location (city, state, country, timezone)
            *   Job preferences
            *   Application status
            *   Source channel
            *   Engagement history
        *   **Automated Follow-up Emails:** Schedule sequential emails based on recipient actions (opened, clicked, no response)
        *   **Best Time to Send Prediction:** AI analyzes candidate engagement patterns to recommend optimal send times
        *   **Spam Filter Avoidance:** AI checks content and suggests improvements to avoid spam folders
        *   **Content Optimization:** AI suggests improvements for better open and click rates
    *   **Campaign Management:**
        *   Schedule campaigns for future delivery
        *   A/B testing for subject lines and content (Phase 2)
        *   Queueing system for large batches (throttling to avoid provider limits)
        *   Campaign analytics dashboard (open rate, click rate, bounce rate, unsubscribe rate)
    *   **Segmentation \u0026 Targeting:**
        *   Visual segment builder with drag-and-drop filters
        *   Save segments for reuse
        *   Dynamic segments that auto-update based on criteria
        *   Exclude lists (suppression lists for opted-out candidates)
    *   **Personalization:**
        *   Merge fields: {{FirstName}}, {{JobTitle}}, {{Location}}, {{Experience}}, {{Skills}}
        *   Conditional content blocks (show/hide based on candidate attributes)
        *   Dynamic salutations and sign-offs
    *   **Tools Integration:**
        *   Native integration with:
            *   Naukri RMS
            *   Zoho Recruit
            *   LinkedIn Talent Hub
            *   Mailchimp
            *   Sendinblue
        *   ATS inbuilt mass-mail engine with SMTP/API support
        *   Email service provider (ESP) integration for deliverability
    *   **Best Practices Implementation:**
        *   **Clear Subject Lines:** Character limit guidance and preview
        *   **Job Details Inclusion:** Template placeholders for role, location, salary range, key requirements
        *   **Call-to-Action (CTA):** Prominent buttons for "Apply Now", "Confirm Availability", "Schedule Interview"
        *   **Spam-Trigger Word Detection:** Real-time alerts for words like "Free", "Urgent", "Act Now", excessive punctuation
        *   **Template Consistency:** Centralized template library with brand guidelines
        *   **Database Hygiene:** Automated bounce handling and invalid email removal
        *   **Mobile Optimization:** Responsive email templates
    *   **Compliance \u0026 Privacy:**
        *   **Opt-in/Opt-out Management:**
            *   Unsubscribe link in every email (mandatory)
            *   Preference center for candidates to choose communication types
            *   Automatic suppression list management
        *   **Consent Tracking:** Record when and how consent was obtained
        *   **Data Privacy:**
            *   GDPR compliance (EU candidates)
            *   CAN-SPAM compliance (US candidates)
            *   Data retention policies
        *   **Relevance Filtering:** Prevent sending to unsuitable candidates (wrong skills, location, experience)
        *   **Audit Trail:** Log all mass mailings with recipient lists and content
    *   **Deliverability Features:**
        *   Domain authentication (SPF, DKIM, DMARC) verification
        *   Sender reputation monitoring
        *   Bounce categorization (hard bounce, soft bounce, spam complaint)
        *   Automatic list cleaning
*   **Out-of-Scope:**
    *   SMS/WhatsApp bulk messaging (covered in Story 7.4)
    *   Advanced marketing automation workflows (drip campaigns - Phase 2)
    *   Video email capabilities

**Pre-requisites**
*   Email Integration (Story 7.1)
*   Template Management System
*   Candidate Database with segmentation fields

**Acceptance Criteria**
1.  Recruiter can select candidates using multiple filters (skills, location, experience) and create a segment of 500 candidates.
2.  AI suggests 3 subject line variations based on campaign type and audience.
3.  Auto-segmentation creates groups automatically when recruiter selects "Segment by Experience Level".
4.  Preview mode shows how email appears to different candidates with personalized merge fields.
5.  System detects spam-trigger words and shows warning with suggestions.
6.  Recruiter can schedule campaign for optimal send time recommended by AI.
7.  Queueing system sends emails in batches (e.g., 100 per minute) to comply with ESP limits.
8.  Every email includes functional unsubscribe link that updates candidate preferences immediately.
9.  Candidates who unsubscribe are automatically added to suppression list.
10. Campaign dashboard shows real-time metrics: sent, delivered, opened, clicked, bounced, unsubscribed.
11. Automated follow-up email is triggered 3 days after initial email if candidate hasn't opened it.
12. System prevents sending to candidates who have opted out or marked previous emails as spam.
13. Bounce handling automatically removes hard-bounced emails from future campaigns.
14. Template library includes at least 10 pre-built templates: Job Alert, Interview Invite, Rejection, Status Update, Event Invite, etc.
15. Recruiter can save custom segments for reuse (e.g., "Senior Java Developers in Bangalore").
16. Mobile preview shows how email renders on smartphones.
17. Compliance check warns if email lacks unsubscribe link or violates data privacy rules.
18. Audit log records: campaign name, sender, recipient count, send time, template used.
19. AI predicts best send time based on historical open rates for similar candidate segments.
20. Integration with Naukri RMS/Zoho Recruit allows importing candidate lists directly.

---

### Story 7.4: SMS/WhatsApp Integration
**Description**
Reach candidates where they are most responsive.

**Scope**
*   **In-Scope:**
    *   Integration with Twilio/WhatsApp Business API.
    *   Send 1:1 messages.
    *   Template support (HSM templates for WhatsApp).
*   **Out-of-Scope:**
    *   Voice calling.

**Pre-requisites**
*   Vendor Account (Twilio).

**Acceptance Criteria**
1.  "Send SMS" button on profile.
2.  Chat-like interface for conversation history.
3.  Opt-out (STOP) handling is automatic.

---

### Story 7.5: Sender Verification & Domain Auth
**Description**
Ensure emails land in Inbox, not Spam.

**Scope**
*   **In-Scope:**
    *   DKIM/SPF/DMARC setup instructions/verification.
    *   "Send as" alias configuration.
*   **Out-of-Scope:**
    *   Hosting DNS records.

**Pre-requisites**
*   DNS Access.

**Acceptance Criteria**
1.  Admin settings to verify domain ownership.
2.  Warning displayed if domain is unverified.

---

### Story 7.6: Communication List Management & Inbox
**Description**
Provide comprehensive inbox and list management capabilities for viewing, searching, filtering, and managing all communications (emails, SMS) at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across message content, subject lines, sender/recipient, and candidate names.
    *   **Filter:**
        *   Message Type (Email, SMS, WhatsApp)
        *   Status (Sent, Delivered, Opened, Replied, Bounced, Failed)
        *   Direction (Inbound, Outbound)
        *   Date Range
        *   Candidate/Contact
        *   Job Related To
        *   Template Used
        *   Has Attachments
        *   Unread/Read
        *   Starred/Flagged
    *   **Sort:** Sortable columns including Date/Time, Sender, Recipient, Subject, Status, Open Rate.
    *   **View Modes:**
        *   Inbox view (email client style with preview pane)
        *   Conversation view (threaded messages)
        *   List view (table format)
        *   Analytics view (campaign performance)
    *   **Pagination:** Configurable page size (25, 50, 100 messages per page) with infinite scroll option.
    *   **Bulk Actions:**
        *   Mark as read/unread
        *   Star/Unstar
        *   Archive messages
        *   Delete messages
        *   Forward to team member
        *   Add to candidate activity log
        *   Export selected threads
    *   **Inbox Features:**
        *   Preview pane with message content
        *   Quick reply functionality
        *   Attachment preview
        *   Thread grouping
        *   Unread count badges
        *   Smart folders (Unread, Starred, Sent, Drafts, Bounced)
    *   **Export:** Download message data in CSV/PDF format.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "Unread from Candidates", "Failed Deliveries").
    *   **Quick Actions:** Inline actions for Reply, Forward, Archive, Star, View Candidate Profile.
*   **Out-of-Scope:**
    *   Advanced email rules/automation (covered in Module 4).
    *   Spam filtering (handled by email provider).

**Pre-requisites**
*   Stories 7.1 through 7.5 completed.
*   Email/SMS integration infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 1M messages.
2.  Filters can be combined (e.g., "Unread" + "Last 7 days" + "Email" + "Bounced").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Sort order persists during the session.
5.  Pagination shows total count and allows jumping to specific pages.
6.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
7.  Export includes message content, metadata, and respects active filters.
8.  Saved Views can be created, edited, deleted, and set as default.
9.  Inbox view shows: Sender/Recipient, Subject, Preview snippet, Date/Time, Status badges, Attachment icon, Unread indicator.
10. Conversation view groups all messages with a candidate chronologically.
11. Preview pane loads message content without full page navigation.
12. Quick reply opens inline composer with pre-filled recipient.
13. Thread grouping shows message count per conversation.
14. Smart folders auto-update counts in real-time.
15. Mobile-responsive with swipe actions for common operations.
16. Real-time notifications for new inbound messages.
17. Quick filters for: "Unread", "Today", "Awaiting Reply", "Bounced", "High Priority".
18. Delivery status tracking with detailed error messages for failures.
