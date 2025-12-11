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
exports.InterviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const interviews_service_1 = require("./interviews.service");
const create_interview_dto_1 = require("./dto/create-interview.dto");
const update_interview_dto_1 = require("./dto/update-interview.dto");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const update_feedback_dto_1 = require("./dto/update-feedback.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let InterviewsController = class InterviewsController {
    constructor(interviewsService) {
        this.interviewsService = interviewsService;
    }
    create(user, createInterviewDto) {
        return this.interviewsService.create(createInterviewDto, user.tenantId, user.sub);
    }
    findAll(user, applicationId, interviewerId, candidateId, status, startDate, endDate) {
        return this.interviewsService.findAll(user.tenantId, {
            applicationId,
            interviewerId,
            candidateId,
            status,
            startDate,
            endDate,
        });
    }
    findOne(user, id) {
        return this.interviewsService.findOne(id, user.tenantId);
    }
    update(user, id, updateInterviewDto) {
        return this.interviewsService.update(id, updateInterviewDto, user.tenantId);
    }
    remove(user, id) {
        return this.interviewsService.remove(id, user.tenantId);
    }
    createFeedback(user, createFeedbackDto) {
        return this.interviewsService.createFeedback(createFeedbackDto, user.sub, user.tenantId);
    }
    updateFeedback(user, id, updateFeedbackDto) {
        return this.interviewsService.updateFeedback(id, updateFeedbackDto, user.sub, user.tenantId);
    }
    getFeedback(user, id) {
        return this.interviewsService.getFeedbackByInterview(id, user.tenantId);
    }
};
exports.InterviewsController = InterviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule an interview' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_interview_dto_1.CreateInterviewDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all interviews' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('applicationId')),
    __param(2, (0, common_1.Query)('interviewerId')),
    __param(3, (0, common_1.Query)('candidateId')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get interview details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update interview details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_interview_dto_1.UpdateInterviewDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel/Delete interview' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('feedback'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit interview feedback' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "createFeedback", null);
__decorate([
    (0, common_1.Patch)('feedback/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update interview feedback' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_feedback_dto_1.UpdateFeedbackDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "updateFeedback", null);
__decorate([
    (0, common_1.Get)(':id/feedback'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback for an interview' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "getFeedback", null);
exports.InterviewsController = InterviewsController = __decorate([
    (0, swagger_1.ApiTags)('interviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('interviews'),
    __metadata("design:paramtypes", [interviews_service_1.InterviewsService])
], InterviewsController);
//# sourceMappingURL=interviews.controller.js.map