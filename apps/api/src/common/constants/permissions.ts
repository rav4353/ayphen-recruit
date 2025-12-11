export enum Permission {
    // Candidates
    CANDIDATE_VIEW = 'candidate.view',
    CANDIDATE_CREATE = 'candidate.create',
    CANDIDATE_EDIT = 'candidate.edit',
    CANDIDATE_DELETE = 'candidate.delete',

    // Jobs
    JOB_VIEW = 'job.view',
    JOB_CREATE = 'job.create',
    JOB_EDIT = 'job.edit',
    JOB_DELETE = 'job.delete',
    JOB_PUBLISH = 'job.publish',

    // Offers
    OFFER_VIEW = 'offer.view',
    OFFER_CREATE = 'offer.create',
    OFFER_EDIT = 'offer.edit',
    OFFER_DELETE = 'offer.delete',
    OFFER_APPROVE = 'offer.approve',

    // Settings
    SETTINGS_VIEW = 'settings.view',
    SETTINGS_EDIT = 'settings.edit',

    // Users
    USER_MANAGE = 'user.manage',

    // Reports
    REPORT_VIEW = 'report.view'
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: Object.values(Permission),
    RECRUITER: [
        Permission.CANDIDATE_VIEW, Permission.CANDIDATE_CREATE, Permission.CANDIDATE_EDIT, Permission.CANDIDATE_DELETE,
        Permission.JOB_VIEW, Permission.JOB_CREATE, Permission.JOB_EDIT, Permission.JOB_PUBLISH,
        Permission.OFFER_VIEW, Permission.OFFER_CREATE, Permission.OFFER_EDIT,
        Permission.REPORT_VIEW,
    ],
    HIRING_MANAGER: [
        Permission.CANDIDATE_VIEW,
        Permission.JOB_VIEW,
        Permission.OFFER_VIEW, Permission.OFFER_APPROVE,
    ],
    INTERVIEWER: [
        Permission.CANDIDATE_VIEW
    ]
};
