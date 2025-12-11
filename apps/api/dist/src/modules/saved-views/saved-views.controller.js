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
exports.SavedViewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const saved_views_service_1 = require("./saved-views.service");
const create_saved_view_dto_1 = require("./dto/create-saved-view.dto");
const update_saved_view_dto_1 = require("./dto/update-saved-view.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let SavedViewsController = class SavedViewsController {
    constructor(savedViewsService) {
        this.savedViewsService = savedViewsService;
    }
    async create(dto, user) {
        const view = await this.savedViewsService.create(dto, user.tenantId, user.sub);
        return api_response_dto_1.ApiResponse.created(view, 'Saved view created successfully');
    }
    async findAll(user, entity) {
        const views = await this.savedViewsService.findAll(user.tenantId, user.sub, entity);
        return api_response_dto_1.ApiResponse.success(views, 'Saved views retrieved successfully');
    }
    async findOne(id) {
        const view = await this.savedViewsService.findOne(id);
        return api_response_dto_1.ApiResponse.success(view, 'Saved view retrieved successfully');
    }
    async update(id, dto, user) {
        const view = await this.savedViewsService.update(id, dto, user.sub);
        return api_response_dto_1.ApiResponse.updated(view, 'Saved view updated successfully');
    }
    async remove(id, user) {
        await this.savedViewsService.remove(id, user.sub);
        return api_response_dto_1.ApiResponse.deleted('Saved view deleted successfully');
    }
};
exports.SavedViewsController = SavedViewsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new saved view' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_saved_view_dto_1.CreateSavedViewDto, Object]),
    __metadata("design:returntype", Promise)
], SavedViewsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all saved views for an entity' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('entity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SavedViewsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved view by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SavedViewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update saved view' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_saved_view_dto_1.UpdateSavedViewDto, Object]),
    __metadata("design:returntype", Promise)
], SavedViewsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete saved view' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SavedViewsController.prototype, "remove", null);
exports.SavedViewsController = SavedViewsController = __decorate([
    (0, swagger_1.ApiTags)('saved-views'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('saved-views'),
    __metadata("design:paramtypes", [saved_views_service_1.SavedViewsService])
], SavedViewsController);
//# sourceMappingURL=saved-views.controller.js.map