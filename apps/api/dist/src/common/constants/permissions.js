"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = void 0;
var Permission;
(function (Permission) {
    Permission["CANDIDATE_VIEW"] = "candidate.view";
    Permission["CANDIDATE_CREATE"] = "candidate.create";
    Permission["CANDIDATE_EDIT"] = "candidate.edit";
    Permission["CANDIDATE_DELETE"] = "candidate.delete";
    Permission["JOB_VIEW"] = "job.view";
    Permission["JOB_CREATE"] = "job.create";
    Permission["JOB_EDIT"] = "job.edit";
    Permission["JOB_DELETE"] = "job.delete";
    Permission["JOB_PUBLISH"] = "job.publish";
    Permission["OFFER_VIEW"] = "offer.view";
    Permission["OFFER_CREATE"] = "offer.create";
    Permission["OFFER_EDIT"] = "offer.edit";
    Permission["OFFER_DELETE"] = "offer.delete";
    Permission["OFFER_APPROVE"] = "offer.approve";
    Permission["SETTINGS_VIEW"] = "settings.view";
    Permission["SETTINGS_EDIT"] = "settings.edit";
    Permission["USER_MANAGE"] = "user.manage";
    Permission["REPORT_VIEW"] = "report.view";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
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
//# sourceMappingURL=permissions.js.map