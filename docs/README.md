# Ayphen TalentX - Project Reference & Master Plan

## 1. Project Vision
**Ayphen TalentX** is a modern, AI-first Applicant Tracking System (ATS) designed to streamline the entire hiring lifecycle—from job creation to onboarding. It combines enterprise-grade compliance with consumer-grade design and powerful AI automation.

---

## 2. Technology Stack

### Frontend & Core Framework
*   **Framework:** React.js - For building dynamic, client-side user interfaces.
*   **Language:** TypeScript - For type safety and maintainability across the large codebase.
*   **Styling:** Vanilla CSS (Modern) - Utilizing CSS Variables, Flexbox, Grid, and CSS Modules for scoped styling. *Focus on premium, glassmorphism, and dynamic aesthetics.*
*   **State Management:** React Context / Zustand.

### Backend & Data
*   **API:** NestJS - A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
*   **Database:** PostgreSQL - Relational data for Jobs, Candidates, Applications.
*   **Caching/Queues:** Redis - For job queues (email sending, resume parsing) and caching.
*   **Storage:** AWS S3 (or compatible object storage) - For storing Resumes, Offer Letters, and User Avatars.

### AI & Machine Learning
*   **LLM Integration:** OpenAI API (GPT-4) - For JD writing, summarization, and chat assistants.
*   **Vector Database:** pgvector (PostgreSQL extension) or Pinecone - For semantic search and candidate matching.
*   **Parsing:** Python-based microservice or API integration (e.g., PyPDF2, spaCy) for resume extraction.

### Infrastructure & DevOps
*   **Authentication:** NextAuth.js / Auth0 / Clerk - Supporting SSO (SAML/OIDC).
*   **Deployment:** Docker - Containerized deployment for consistency across environments.
*   **CI/CD:** GitHub Actions.

---

## 3. Module Outline & Story Map

This project is divided into 13 distinct modules. Detailed requirements for each are in their respective markdown files.

### [Module 0: Authentication & Identity](./00_Authentication_Identity.md)
*   **Focus:** Secure access for all user types.
*   **Key Stories:** Internal SSO, Candidate Magic Links, Vendor Portal Login, Password Recovery.

### [Module 1: Job Management](./01_Job_Management.md)
*   **Focus:** Creating, approving, and publishing job requisitions.
*   **Key Stories:** Structured Job Form, Template Library, AI JD Writer, Approval Workflows, Multi-channel Posting.

### [Module 2: Candidate & Application Management](./02_Candidate_Application_Management.md)
*   **Focus:** Central database of talent and their application status.
*   **Key Stories:** Candidate Profile, Resume Parsing (PDF/Docx), Duplicate Detection, GDPR Consent.

### [Module 3: Sourcing & Referrals](./03_Sourcing_Referrals.md)
*   **Focus:** Outbound recruiting and leveraging employee networks.
*   **Key Stories:** Talent Pools, Saved Searches, Email Campaigns, Employee Referral Portal, AI Matching.

### [Module 4: Pipeline & Workflow Management](./04_Pipeline_Workflow_Management.md)
*   **Focus:** Visualizing the hiring funnel and automating steps.
*   **Key Stories:** Configurable Pipelines, Kanban Board, Automations (Auto-email/Tag), SLA Alerts.

### [Module 5: Interview Scheduling](./05_Interview_Scheduling.md)
*   **Focus:** Logistics of booking time.
*   **Key Stories:** Calendar Sync (Google/Outlook), Smart Availability Lookup, Panel Scheduling, ICS Invites.

### [Module 6: Interview Feedback & Scorecards](./06_Interview_Feedback_Scorecards.md)
*   **Focus:** Structured evaluation of candidates.
*   **Key Stories:** Custom Scorecard Builder, Feedback Form, AI Summarization of Feedback, Question Assistant.

### [Module 7: Communication Module](./07_Communication_Module.md)
*   **Focus:** In-app messaging system.
*   **Key Stories:** Email Composer with Templates, Threaded View, Bulk Messaging, SMS/WhatsApp Integration.

### [Module 8: Offer Management](./08_Offer_Management.md)
*   **Focus:** Closing the candidate.
*   **Key Stories:** Offer Letter Builder, Approval Chains, E-Signature Integration (DocuSign), Expiry Tracking.

### [Module 9: Onboarding](./09_Onboarding.md)
*   **Focus:** Pre-boarding and Day 1 readiness.
*   **Key Stories:** New Hire Checklist, Document Collection, IT Provisioning (Okta), HRIS Sync.

### [Module 10: Admin, Governance & Compliance](./10_Admin_Governance_Compliance.md)
*   **Focus:** System control and security.
*   **Key Stories:** RBAC (Roles & Permissions), Audit Logs, Multi-tenancy, SSO Configuration.

### [Module 11: AI Layer](./11_AI_Layer.md)
*   **Focus:** Intelligence services.
*   **Key Stories:** Embeddings Engine, RAG Assistant, Bias Detection, Resume Parsing Service.

### [Module 12: Integrations](./12_Integrations.md)
*   **Focus:** Connectivity with external tools.
*   **Key Stories:** Job Board APIs, Background Check Vendors, Calendar Providers.

### [Module 13: Reporting & Analytics](./13_Reporting_Analytics.md)
*   **Focus:** Data-driven insights.
*   **Key Stories:** Hiring Funnel, Time-to-Hire, Source Effectiveness, Diversity Reporting.

### [Module 14: Super Admin & Platform Management](./14_Super_Admin_Platform.md)
*   **Focus:** Core platform operations for Ayphen staff ("God Mode").
*   **Key Stories:** Impersonation, Tenant Management, Global Kill-Switches, Billing.

---

## 4. Development Guidelines
*   **Design First:** Prioritize "Wow" aesthetics. Use glassmorphism, smooth transitions, and high-quality typography.
*   **Mobile Responsive:** All candidate-facing and recruiter-actionable screens must work on mobile.
*   **Code Quality:** Strict TypeScript usage, component modularity, and comprehensive error handling.
