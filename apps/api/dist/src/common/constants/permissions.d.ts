export declare enum Permission {
    CANDIDATE_VIEW = "candidate.view",
    CANDIDATE_CREATE = "candidate.create",
    CANDIDATE_EDIT = "candidate.edit",
    CANDIDATE_DELETE = "candidate.delete",
    JOB_VIEW = "job.view",
    JOB_CREATE = "job.create",
    JOB_EDIT = "job.edit",
    JOB_DELETE = "job.delete",
    JOB_PUBLISH = "job.publish",
    OFFER_VIEW = "offer.view",
    OFFER_CREATE = "offer.create",
    OFFER_EDIT = "offer.edit",
    OFFER_DELETE = "offer.delete",
    OFFER_APPROVE = "offer.approve",
    SETTINGS_VIEW = "settings.view",
    SETTINGS_EDIT = "settings.edit",
    USER_MANAGE = "user.manage",
    REPORT_VIEW = "report.view"
}
export declare const ROLE_PERMISSIONS: Record<string, Permission[]>;
