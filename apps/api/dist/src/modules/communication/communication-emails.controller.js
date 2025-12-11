"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationEmailsController = void 0;
const common_1 = require("@nestjs/common");
const communication_emails_service_1 = require("./communication-emails.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CommunicationEmailsController = class CommunicationEmailsController {
    constructor(emailsService) {
        this.emailsService = emailsService;
    }
    async sendEmail(user, dto) {
        return this.emailsService.sendEmail(user.id, user.tenantId, dto);
    }
    async sendBulkEmail(user, body) {
        return this.emailsService.sendBulkEmail(user.id, user.tenantId, body);
    }
    async getEmails(user, candidateId) {
        return this.emailsService.getEmailsForCandidate(candidateId, user.tenantId);
    }
    async getThreads(user) {
        return this.emailsService.getThreads(user.tenantId);
    }
};
exports.CommunicationEmailsController = CommunicationEmailsController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, communication_emails_service_1.SendEmailDto]),
    __metadata("design:returntype", Promise)
], CommunicationEmailsController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunicationEmailsController.prototype, "sendBulkEmail", null);
__decorate([
    (0, common_1.Get)('candidate/:candidateId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunicationEmailsController.prototype, "getEmails", null);
__decorate([
    (0, common_1.Get)('threads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunicationEmailsController.prototype, "getThreads", null);
exports.CommunicationEmailsController = CommunicationEmailsController = __decorate([
    (0, common_1.Controller)('emails'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [communication_emails_service_1.CommunicationEmailsService])
], CommunicationEmailsController);
//# sourceMappingURL=communication-emails.controller.js.map