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
exports.CandidatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const candidates_service_1 = require("./candidates.service");
const create_candidate_dto_1 = require("./dto/create-candidate.dto");
const update_candidate_dto_1 = require("./dto/update-candidate.dto");
const candidate_query_dto_1 = require("./dto/candidate-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const permissions_1 = require("../../common/constants/permissions");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let CandidatesController = class CandidatesController {
    constructor(candidatesService) {
        this.candidatesService = candidatesService;
    }
    create(dto, user) {
        return this.candidatesService.create(dto, user.tenantId, user.sub);
    }
    createReferral(dto, user) {
        return this.candidatesService.createReferral(dto, user.tenantId, user.sub);
    }
    getMyReferrals(user) {
        return this.candidatesService.getReferrals(user.tenantId, user.sub);
    }
    findAll(user, query) {
        return this.candidatesService.findAll(user.tenantId, query);
    }
    async export(user, res, query) {
        const csv = await this.candidatesService.export(user.tenantId, query);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=candidates.csv');
        res.send(csv);
    }
    findOne(id) {
        return this.candidatesService.findById(id);
    }
    update(id, dto) {
        return this.candidatesService.update(id, dto);
    }
    addTags(id, tags) {
        return this.candidatesService.addTags(id, tags);
    }
    bulkDelete(ids, user) {
        return this.candidatesService.bulkDelete(ids, user.tenantId);
    }
    async sendBulkEmail(body, user) {
        return this.candidatesService.sendBulkEmail(body.ids, body.subject, body.message, user.tenantId);
    }
    async merge(body, user) {
        return this.candidatesService.merge(body.primaryId, body.secondaryId, user.tenantId);
    }
    getActivities(id) {
        return this.candidatesService.getActivities(id);
    }
    remove(id) {
        return this.candidatesService.remove(id);
    }
};
exports.CandidatesController = CandidatesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new candidate' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_candidate_dto_1.CreateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('referral'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a candidate referral' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_candidate_dto_1.CreateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "createReferral", null);
__decorate([
    (0, common_1.Get)('referrals/my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my referrals' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "getMyReferrals", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all candidates' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, candidate_query_dto_1.CandidateQueryDto]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export candidates to CSV' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, candidate_query_dto_1.CandidateQueryDto]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get candidate by ID' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update candidate' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_candidate_dto_1.UpdateCandidateDto]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/tags'),
    (0, swagger_1.ApiOperation)({ summary: 'Add tags to candidate' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "addTags", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk delete candidates' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_DELETE),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "bulkDelete", null);
__decorate([
    (0, common_1.Post)('bulk-email'),
    (0, swagger_1.ApiOperation)({ summary: 'Send bulk email to candidates' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "sendBulkEmail", null);
__decorate([
    (0, common_1.Post)('merge'),
    (0, swagger_1.ApiOperation)({ summary: 'Merge two candidates' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_EDIT, permissions_1.Permission.CANDIDATE_DELETE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "merge", null);
__decorate([
    (0, common_1.Get)(':id/activities'),
    (0, swagger_1.ApiOperation)({ summary: 'Get candidate activity timeline' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "getActivities", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete candidate' }),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permission.CANDIDATE_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "remove", null);
exports.CandidatesController = CandidatesController = __decorate([
    (0, swagger_1.ApiTags)('candidates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('candidates'),
    __metadata("design:paramtypes", [candidates_service_1.CandidatesService])
], CandidatesController);
//# sourceMappingURL=candidates.controller.js.map