export enum Permission {
  // Candidates
  CANDIDATE_VIEW = "candidate.view",
  CANDIDATE_CREATE = "candidate.create",
  CANDIDATE_EDIT = "candidate.edit",
  CANDIDATE_DELETE = "candidate.delete",
  CANDIDATE_EXPORT = "candidate.export",
  CANDIDATE_ARCHIVE = "candidate.archive",

  // Jobs
  JOB_VIEW = "job.view",
  JOB_CREATE = "job.create",
  JOB_EDIT = "job.edit",
  JOB_DELETE = "job.delete",
  JOB_PUBLISH = "job.publish",
  JOB_APPROVE = "job.approve",
  JOB_MANAGE = "job.manage", // Keep existing

  // Interviews
  INTERVIEW_VIEW = "interview.view",
  INTERVIEW_SCHEDULE = "interview.schedule",
  INTERVIEW_CANCEL = "interview.cancel",
  INTERVIEW_FEEDBACK_VIEW = "interview.feedback.view",
  INTERVIEW_FEEDBACK_CREATE = "interview.feedback.create",

  // Offers
  OFFER_VIEW = "offer.view",
  OFFER_CREATE = "offer.create",
  OFFER_EDIT = "offer.edit",
  OFFER_DELETE = "offer.delete",
  OFFER_APPROVE = "offer.approve",

  // Pipelines
  PIPELINE_VIEW = "pipeline.view",
  PIPELINE_MANAGE = "pipeline.manage",

  // Email
  EMAIL_SEND = "email.send",
  EMAIL_TEMPLATE_MANAGE = "email.template.manage",

  // Settings
  SETTINGS_VIEW = "settings.view",
  SETTINGS_EDIT = "settings.edit",
  SETTINGS_MANAGE = "settings.manage", // Keep existing

  // Users
  USER_MANAGE = "user.manage",

  // Reports & Analytics
  REPORT_VIEW = "report.view",
  ANALYTICS_EXPORT = "analytics.export",

  // Integrations
  INTEGRATION_VIEW = "integration.view",
  INTEGRATION_MANAGE = "integration.manage",
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: Object.values(Permission),
  RECRUITER: [
    Permission.CANDIDATE_VIEW,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_EDIT,
    Permission.CANDIDATE_DELETE,
    Permission.CANDIDATE_EXPORT,
    Permission.CANDIDATE_ARCHIVE,
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_EDIT,
    Permission.JOB_PUBLISH,
    Permission.INTERVIEW_VIEW,
    Permission.INTERVIEW_SCHEDULE,
    Permission.INTERVIEW_CANCEL,
    Permission.INTERVIEW_FEEDBACK_VIEW,
    Permission.INTERVIEW_FEEDBACK_CREATE,
    Permission.OFFER_VIEW,
    Permission.OFFER_CREATE,
    Permission.OFFER_EDIT,
    Permission.PIPELINE_VIEW,
    Permission.EMAIL_SEND,
    Permission.EMAIL_TEMPLATE_MANAGE,
    Permission.REPORT_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.SETTINGS_VIEW,
  ],
  HIRING_MANAGER: [
    Permission.CANDIDATE_VIEW,
    Permission.JOB_VIEW,
    Permission.JOB_APPROVE,
    Permission.INTERVIEW_VIEW,
    Permission.INTERVIEW_FEEDBACK_VIEW,
    Permission.INTERVIEW_FEEDBACK_CREATE,
    Permission.OFFER_VIEW,
    Permission.OFFER_APPROVE,
    Permission.PIPELINE_VIEW,
    Permission.SETTINGS_VIEW,
  ],
  HR: [
    Permission.CANDIDATE_VIEW,
    Permission.CANDIDATE_EDIT,
    Permission.JOB_VIEW,
    Permission.INTERVIEW_VIEW,
    Permission.OFFER_VIEW,
    Permission.PIPELINE_VIEW,
    Permission.EMAIL_SEND,
    Permission.REPORT_VIEW,
  ],
  INTERVIEWER: [
    Permission.CANDIDATE_VIEW,
    Permission.INTERVIEW_VIEW,
    Permission.INTERVIEW_FEEDBACK_CREATE,
  ],
  EMPLOYEE: [
    // Primarily used for referrals / limited visibility
    Permission.CANDIDATE_VIEW,
  ],
  CANDIDATE: [],
  VENDOR: [],
};
