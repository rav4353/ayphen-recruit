# Module 4: Pipeline & Workflow Management

## Overview
**Module Owner:** Product Team
**Status:** Draft
**Epic:** As a Recruiter, I want to visualize and move candidates through a hiring process so that I can manage the funnel efficiently.

This module defines the stages a candidate goes through and the rules that govern those transitions.

---

## User Stories

### Story 4.1: Configurable Pipelines
**Description**
Different roles require different processes (e.g., Engineering vs. Sales). Admins need to define custom pipelines.

**Scope**
*   **In-Scope:**
    *   Create/Edit Pipeline Templates.
    *   Define Stages (Name, Type, Order).
    *   Assign Pipeline to Job.
*   **Out-of-Scope:**
    *   Branching logic (e.g., if fail test -> go to specific rejection stage). Linear pipelines only for Phase 1.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Admin interface to add/remove stages.
2.  Default stages: Applied, Screen, Interview, Offer, Hired, Rejected.
3.  When creating a job, recruiter selects which pipeline to use.

---

### Story 4.2: Kanban Board View
**Description**
Visual management of the hiring funnel.

**Scope**
*   **In-Scope:**
    *   Columnar view of stages.
    *   Candidate cards showing Name, Current Role, Match Score.
    *   Drag-and-drop movement.
    *   Quick filters (by Recruiter, by Status).
*   **Out-of-Scope:**
    *   Custom card layouts.

**Pre-requisites**
*   Pipeline Configuration.

**Acceptance Criteria**
1.  Dragging a card from "Screen" to "Interview" updates the application status.
2.  Counts of candidates per stage are displayed at the top of the column.
3.  Clicking a card opens the Candidate Profile side-panel or modal.

---

### Story 4.3: Workflow Automations
**Description**
Reduce manual clicks by triggering actions on stage changes.

**Scope**
*   **In-Scope:**
    *   Triggers: "When candidate moves to [Stage]..."
    *   Actions: "Send Email", "Add Tag", "Create Task", "Request Feedback".
    *   Conditionals: "If Source is Referral".
*   **Out-of-Scope:**
    *   Custom scripting.

**Pre-requisites**
*   Email Templates.

**Acceptance Criteria**
1.  Admin can configure: "When moved to 'Rejected', send 'Rejection Email' after 2 days".
2.  System executes the action and logs it in the activity timeline.
3.  User can override/cancel a pending automated action.

---

### Story 4.4: SLA Management
**Description**
Ensure candidates don't get stuck in black holes.

**Scope**
*   **In-Scope:**
    *   Define max days allowed in each stage.
    *   Visual indicators (Yellow warning, Red alert).
    *   Notifications to recruiter/hiring manager.
*   **Out-of-Scope:**
    *   Escalation workflows (auto-reassign).

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Admin sets "Screening SLA = 2 days".
2.  If candidate is in Screening for 3 days, card turns red.
3.  Dashboard widget shows "At Risk" candidates.


### Story 4.5: Disposition Reasons
**Description**
Capture why a candidate was rejected or withdrew.

**Scope**
*   **In-Scope:**
    *   Configurable list of reasons (e.g., "Not a skill fit", "Salary too high", "Accepted another offer").
    *   Mandatory selection upon moving to "Rejected" or "Withdrawn".
*   **Out-of-Scope:**
    *   Free text only (must be structured for reporting).

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  Moving card to "Rejected" triggers a modal asking for reason.
2.  Reason is stored for reporting (Rejection Analysis).

---

### Story 4.6: Pipeline List Management & Kanban Enhancements
**Description**
Provide comprehensive list management capabilities and enhanced Kanban board features for managing candidates across pipeline stages at scale.

**Scope**
*   **In-Scope:**
    *   **Search:** Quick search within Kanban board to filter visible candidates by name, email, or job title.
    *   **Filter - Kanban Board:**
        *   Assigned Recruiter
        *   Source (Career Site, LinkedIn, Referral, etc.)
        *   Tags
        *   Date Applied (ranges)
        *   Match Score (ranges)
        *   SLA Status (On Track, At Risk, Overdue)
        *   Priority (High, Medium, Low)
    *   **Sort within Columns:**
        *   By Date (Oldest/Newest in stage)
        *   By Match Score
        *   By Priority
        *   By SLA deadline
        *   By Last Activity
    *   **View Modes:**
        *   Kanban (default)
        *   List view with all stages as columns
        *   Timeline view (Gantt-style showing candidate journey)
    *   **Bulk Actions:**
        *   Move multiple candidates to same stage
        *   Assign/Reassign to recruiter
        *   Add/Remove tags
        *   Send bulk emails
        *   Update priority
        *   Archive candidates
    *   **Kanban Enhancements:**
        *   Collapsible columns
        *   Swimlanes (group by Job, Recruiter, or Priority)
        *   Card customization (show/hide fields)
        *   WIP (Work In Progress) limits per stage
        *   Stage metrics (avg time in stage, conversion rate)
    *   **Export:** Download pipeline snapshot in CSV/Excel format.
    *   **Views:** Save custom filter + sort combinations as "Saved Views".
*   **Out-of-Scope:**
    *   Multi-board view (multiple jobs simultaneously).
    *   Advanced workflow builder UI.

**Pre-requisites**
*   Stories 4.1 through 4.5 completed.
*   Search indexing infrastructure.

**Acceptance Criteria**
1.  Search filters Kanban cards in real-time as user types.
2.  Filters can be combined (e.g., "Engineering jobs" + "At Risk SLA" + "Assigned to me").
3.  Active filters are clearly displayed above the board with option to clear.
4.  Sort order within columns persists during the session.
5.  Bulk select allows selecting multiple cards across different columns.
6.  Drag-and-drop works for single and bulk-selected cards.
7.  Swimlanes reorganize the board horizontally by selected dimension.
8.  WIP limits show warning when stage exceeds configured limit.
9.  Stage metrics appear in column headers (e.g., "Interview (12) • Avg: 3.2 days").
10. Export includes all visible candidates with their current stage and key metrics.
11. Saved Views can be created, edited, deleted, and set as default.
12. Card preview on hover shows additional details without opening full profile.
13. Mobile-responsive with horizontal scroll for stages and card-based layout.
14. Real-time updates when another user moves a candidate (with visual notification).
15. Quick actions on cards: Move to stage, Assign, Schedule interview, Send email.

---

### Story 4.7: Recruitment Workflow Automation (Advanced)
**Description**
Implement intelligent, stage-wise automation throughout the recruitment pipeline to reduce manual effort, ensure consistency, and accelerate candidate progression from screening to offer.

> **⚠️ DEVELOPMENT NOTE:** This story has dependencies on Modules 5 (Interview Scheduling), 7 (Communication), and 8 (Offer Management). It should be implemented AFTER those modules are complete, even though it's part of Module 4 conceptually.

**What is Recruitment Workflow Automation?**
Automated workflows that trigger specific actions when candidates move through pipeline stages or when certain conditions are met, enabling recruiters to focus on high-value interactions while routine tasks are handled automatically.

**Why it is Important:**
*   **Reduces Manual Work:** Eliminates repetitive tasks like sending status updates or moving candidates
*   **Ensures Consistency:** Every candidate receives the same timely communication and treatment
*   **Accelerates Hiring:** Faster candidate progression through automated stage transitions
*   **Improves Candidate Experience:** Timely updates and quick responses enhance engagement
*   **Prevents Bottlenecks:** Automatic escalations and reminders keep the pipeline flowing

**Scope**
*   **In-Scope:**
    *   **Stage-wise Automation (Screening → Interview → Offer):**
        *   **Screening Stage:**
            *   Auto-screen based on mandatory criteria (location, experience, skills)
            *   Automatically move qualified candidates to "Phone Screen" stage
            *   Send automated "Application Received" acknowledgment
            *   Trigger resume parsing and skill extraction
            *   Auto-assign to recruiter based on workload or specialization
        *   **Interview Stage:**
            *   Auto-send interview invitation when moved to "Interview Scheduled"
            *   Automatically create calendar events for all participants
            *   Send automated reminders (24h and 2h before interview)
            *   Auto-request feedback from interviewers after interview time
            *   Move to "Awaiting Feedback" stage automatically post-interview
        *   **Offer Stage:**
            *   Auto-generate offer letter when moved to "Offer Preparation"
            *   Trigger approval workflow automatically
            *   Send offer to candidate when all approvals complete
            *   Auto-send reminder if offer not signed within X days
    *   **Auto-Moving Candidates to Next Stage:**
        *   **Rule-based Progression:**
            *   If AI match score ≥ 85% → Auto-move from "Applied" to "Phone Screen"
            *   If phone screen rating ≥ 4/5 → Auto-move to "Technical Interview"
            *   If all interview scores ≥ 4/5 → Auto-move to "Offer Preparation"
            *   If offer signed → Auto-move to "Hired" and trigger onboarding
        *   **Time-based Progression:**
            *   If no action taken in 48h → Auto-move to "Stale" or trigger reminder
            *   If candidate confirms availability → Auto-move to "Ready to Schedule"
        *   **Conditional Logic:**
            *   If candidate fails assessment → Auto-move to "Rejected - Skills Gap"
            *   If candidate withdraws → Auto-move to "Withdrawn" and stop all workflows
        *   **Approval-based Progression:**
            *   When hiring manager approves → Auto-move to next interview round
            *   When budget approved → Auto-move to "Offer Generation"
    *   **Automated Rejection Emails:**
        *   **Smart Rejection Triggers:**
            *   Auto-reject if candidate doesn't meet minimum qualifications
            *   Auto-reject after X days in "On Hold" status
            *   Auto-reject when position is filled (notify all remaining candidates)
            *   Auto-reject based on assessment scores below threshold
        *   **Personalized Rejection Templates:**
            *   Different templates based on rejection stage (screening vs. final round)
            *   Include specific reason (skills mismatch, experience gap, position filled)
            *   Option to "Keep in Talent Pool" for future opportunities
            *   Encourage re-application for other roles
        *   **Delayed Sending:**
            *   Configurable delay (e.g., send rejection 2 days after decision)
            *   Batch rejections to avoid overwhelming candidates
            *   Option to manually review before auto-send
        *   **Compliance:**
            *   Ensure rejection reasons are legally compliant
            *   Maintain audit trail of all rejections
            *   Option to add to "Do Not Contact" list if requested
    *   **Trigger-based Workflows:**
        *   **Event Triggers:**
            *   **When candidate accepts interview invite:**
                *   Send calendar invite to all participants
                *   Send interview preparation guide to candidate
                *   Notify recruiter and hiring manager
                *   Create reminder tasks for interviewers
            *   **When candidate declines interview:**
                *   Notify recruiter immediately
                *   Trigger rescheduling workflow
                *   Log reason for decline
            *   **When feedback submitted:**
                *   Calculate aggregate score
                *   If score meets threshold → Auto-move to next stage
                *   If score below threshold → Trigger rejection workflow
                *   Notify recruiter of decision recommendation
            *   **When offer accepted:**
                *   Trigger onboarding workflow
                *   Notify HR, IT, and hiring manager
                *   Create onboarding tasks
                *   Update job opening (decrement open positions)
            *   **When offer declined:**
                *   Notify recruiter and hiring manager
                *   Trigger "Understand Decline Reason" task
                *   Re-open position if needed
                *   Move next-best candidate forward
        *   **Time-based Triggers:**
            *   Daily: Check for SLA violations and send alerts
            *   Weekly: Send pipeline summary to hiring managers
            *   On Start Date - 7 days: Trigger pre-onboarding tasks
            *   On Interview Date - 24h: Send reminders to all participants
        *   **Condition-based Triggers:**
            *   If candidate inactive for 14 days → Send re-engagement email
            *   If no feedback received 24h post-interview → Escalate to manager
            *   If pipeline stage has >20 candidates → Alert recruiter of bottleneck
    *   **Workflow Builder Interface:**
        *   Visual workflow designer (drag-and-drop)
        *   Pre-built workflow templates for common scenarios
        *   If-Then-Else conditional logic
        *   Multi-step workflows with delays and branches
        *   Test mode to simulate workflows before activation
    *   **Workflow Management:**
        *   Enable/disable workflows without deleting
        *   Version control for workflow changes
        *   Workflow performance analytics (execution count, success rate)
        *   Error handling and retry logic
        *   Manual override capability for any automated action
*   **Out-of-Scope:**
    *   Custom scripting/coding for workflows (no-code only)
    *   Integration with external workflow engines (Zapier, Make.com)
    *   Advanced AI decision-making (Phase 2)

**Pre-requisites**
*   **CRITICAL:** Module 5 (Interview Scheduling), Module 7 (Communication), and Module 8 (Offer Management) must be completed first
*   Email Templates (Module 7)
*   Pipeline Configuration (Story 4.1)
*   Interview Scheduling (Module 5)
*   Offer Management (Module 8)

**Acceptance Criteria**
1.  When candidate is moved to "Phone Screen" stage, system automatically sends "Phone Screen Invitation" email within 1 minute.
2.  Candidates with AI match score ≥ 85% are automatically moved from "Applied" to "Phone Screen" stage.
3.  When all interviewers submit feedback with average score ≥ 4/5, candidate automatically moves to "Offer Preparation".
4.  When candidate is rejected at screening stage, automated rejection email is sent after configured delay (e.g., 2 days).
5.  Rejection email template varies based on stage (screening vs. interview) and includes specific reason.
6.  When candidate accepts interview invite, calendar events are automatically created for all participants.
7.  When candidate declines interview, recruiter receives immediate notification and rescheduling workflow triggers.
8.  When offer is signed, candidate automatically moves to "Hired" and onboarding workflow initiates.
9.  When position is filled, all remaining candidates in pipeline receive automated "Position Filled" rejection email.
10. Time-based trigger sends reminder to interviewers 24h before scheduled interview.
11. If no feedback received 24h post-interview, system escalates to hiring manager with automated reminder.
12. Workflow builder allows creating multi-step workflows with conditional logic (If-Then-Else).
13. Pre-built workflow templates available for: "Standard Screening", "Technical Hiring", "Bulk Hiring", "Executive Search".
14. Admin can enable/disable any workflow without deleting it.
15. Workflow execution log shows: trigger event, actions taken, timestamp, success/failure status.
16. Manual override option available for any automated action (e.g., prevent auto-rejection).
17. Test mode allows simulating workflow execution without actually sending emails or moving candidates.
18. Error handling: If email fails to send, system retries 3 times and logs error if still failing.
19. Workflow analytics dashboard shows: total executions, success rate, average execution time, most-used workflows.
20. When candidate is auto-moved to next stage, activity log records: "Automatically moved by Workflow: [Workflow Name]".
