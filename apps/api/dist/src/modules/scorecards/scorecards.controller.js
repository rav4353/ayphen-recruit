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
exports.ScorecardsController = void 0;
const common_1 = require("@nestjs/common");
const scorecards_service_1 = require("./scorecards.service");
const create_scorecard_template_dto_1 = require("./dto/create-scorecard-template.dto");
const update_scorecard_template_dto_1 = require("./dto/update-scorecard-template.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ScorecardsController = class ScorecardsController {
    constructor(scorecardsService) {
        this.scorecardsService = scorecardsService;
    }
    create(dto, req) {
        return this.scorecardsService.create(dto, req.user.tenantId);
    }
    findAll(req) {
        return this.scorecardsService.findAll(req.user.tenantId);
    }
    findOne(id) {
        return this.scorecardsService.findOne(id);
    }
    update(id, dto) {
        return this.scorecardsService.update(id, dto);
    }
    remove(id) {
        return this.scorecardsService.remove(id);
    }
};
exports.ScorecardsController = ScorecardsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scorecard_template_dto_1.CreateScorecardTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], ScorecardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ScorecardsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScorecardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_scorecard_template_dto_1.UpdateScorecardTemplateDto]),
    __metadata("design:returntype", void 0)
], ScorecardsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScorecardsController.prototype, "remove", null);
exports.ScorecardsController = ScorecardsController = __decorate([
    (0, common_1.Controller)('scorecards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [scorecards_service_1.ScorecardsService])
], ScorecardsController);
//# sourceMappingURL=scorecards.controller.js.map