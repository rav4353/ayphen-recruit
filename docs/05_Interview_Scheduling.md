# Module 5: Interview Scheduling

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to schedule interviews seamlessly integrating with calendars so that coordination time is minimized.

This module handles the complex logistics of booking time between candidates and interviewers.

---

## User Stories

### Story 5.1: Calendar Integration (Google/Outlook)
**Description**
Connect user calendars to read availability and write events.

**Scope**
*   **In-Scope:**
    *   OAuth 2.0 flow for Google Workspace and Microsoft 365.
    *   Read "Free/Busy" status.
    *   Create/Update/Delete calendar events.
*   **Out-of-Scope:**
    *   Exchange On-Premise support.

**Pre-requisites**
*   App registration with Google/Microsoft.

**Acceptance Criteria**
1.  User can authorize calendar access in Settings.
2.  System displays "Connected" status.
3.  Token refresh handles session expiry automatically.

---

### Story 5.2: Smart Scheduling & Availability Lookup
**Description**
Find the intersection of availability for multiple attendees.

**Scope**
*   **In-Scope:**
    *   "Schedule Interview" modal.
    *   Select Interviewers.
    *   Visual grid showing mutual availability.
    *   Time zone conversion (Candidate TZ vs. Interviewer TZ).
*   **Out-of-Scope:**
    *   AI-negotiated times via chat.

**Pre-requisites**
*   Story 5.1 (Calendar Integration).

**Acceptance Criteria**
1.  Recruiter selects 3 interviewers; system highlights slots where all 3 are free.
2.  Recruiter selects a slot and clicks "Book".
3.  System warns if booking outside working hours.

---

### Story 5.3: Invite Management
**Description**
Send professional invites with all necessary details.

**Scope**
*   **In-Scope:**
    *   ICS file generation.
    *   Email templates for "Interview Invitation".
    *   Include video links (Zoom/Meet/Teams - static or generated).
    *   Attach resume/scorecard link for interviewers.
*   **Out-of-Scope:**
    *   SMS reminders (Phase 2).

**Pre-requisites**
*   Email Service.

**Acceptance Criteria**
1.  Candidate receives email with "Add to Calendar" button.
2.  Interviewers receive invite with link to Candidate Profile and Scorecard.
3.  Updates to time trigger "Update" emails.

---

### Story 5.4: Self-Scheduling (Candidate Booking)
**Description**
Allow candidates to pick a slot that works for them.

**Scope**
*   **In-Scope:**
    *   Recruiter sends a "Book Time" link.
    *   Candidate sees available slots based on interviewer's calendar.
    *   Candidate selects slot -> Auto-confirms.
*   **Out-of-Scope:**
    *   Payment for interview (not applicable).

**Pre-requisites**
*   Public-facing scheduling page.

**Acceptance Criteria**
1.  Recruiter defines constraints (e.g., "Next 3 days", "30 min slots").
2.  Link is generated.
3.  Once candidate books, the slot is removed from availability and invites are sent.

---

### Story 5.5: Interview Schedule Management & Calendar Views
**Description**
Provide comprehensive list and calendar management capabilities for viewing, searching, filtering, and managing interviews at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Full-text search across candidate name, job title, interviewer name, and interview type.
    *   **Filter:**
        *   Interview Status (Scheduled, Completed, Cancelled, No-Show)
        *   Interview Type/Stage (Phone Screen, Technical, Panel, etc.)
        *   Date Range
        *   Interviewer Name
        *   Job/Position
        *   Location/Format (In-person, Video, Phone)
        *   Feedback Status (Submitted, Pending)
    *   **Sort:** Sortable columns including Date/Time, Candidate Name, Interviewer, Status, Job.
    *   **View Modes:**
        *   Calendar view (Day/Week/Month)
        *   List view (table format)
        *   Timeline view (chronological)
        *   Interviewer schedule view (grouped by interviewer)
    *   **Calendar Features:**
        *   Color-coding by interview type or status
        *   Drag-and-drop to reschedule
        *   Multi-interviewer overlay view
        *   Availability heatmap
    *   **Pagination:** Configurable page size for list view.
    *   **Bulk Actions:**
        *   Reschedule multiple interviews
        *   Cancel interviews with notification
        *   Send reminder emails
        *   Export to calendar file (ICS)
        *   Assign/Reassign interviewers
        *   Mark as completed
    *   **Export:** Download interview schedule in CSV/Excel/ICS format.
    *   **Views:** Save custom filter combinations as "Saved Views" (e.g., "My Interviews This Week", "Pending Feedback").
    *   **Quick Actions:** Inline actions for Reschedule, Cancel, Join Video Call, View Scorecard.
*   **Out-of-Scope:**
    *   Room/resource booking management.
    *   Video conferencing platform (uses integrations).

**Pre-requisites**
*   Stories 5.1 through 5.4 completed.
*   Calendar integration infrastructure.

**Acceptance Criteria**
1.  Search returns results within 2 seconds for databases with up to 100k interviews.
2.  Filters can be combined (e.g., "This week" + "Technical interviews" + "Pending feedback").
3.  Active filters are clearly displayed with option to clear individually or all at once.
4.  Calendar view syncs with external calendars in real-time.
5.  Drag-and-drop rescheduling checks availability and sends update notifications.
6.  Color-coding is customizable (by type, status, or interviewer).
7.  Bulk select allows "Select All on Page" and "Select All Matching Filter".
8.  Export includes all visible columns and respects active filters.
9.  Saved Views can be created, edited, deleted, and set as default.
10. List view shows: Candidate name, Job, Interview type, Date/Time, Interviewer(s), Status, Feedback status, Quick actions.
11. Calendar view shows interview duration, candidate name, and status indicator.
12. Interviewer schedule view shows workload distribution and prevents overbooking.
13. Mobile-responsive with agenda view for smaller screens.
14. Real-time updates when interviews are scheduled/rescheduled by others.
15. Quick filters for: "Today", "This Week", "My Interviews", "Pending Feedback", "Upcoming".
16. Notifications for conflicts when scheduling overlapping interviews.
