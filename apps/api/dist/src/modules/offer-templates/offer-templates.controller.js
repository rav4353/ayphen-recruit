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
exports.OfferTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const offer_templates_service_1 = require("./offer-templates.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const offer_template_dto_1 = require("./dto/offer-template.dto");
let OfferTemplatesController = class OfferTemplatesController {
    constructor(offerTemplatesService) {
        this.offerTemplatesService = offerTemplatesService;
    }
    create(req, createOfferTemplateDto) {
        return this.offerTemplatesService.create(req.user.tenantId, createOfferTemplateDto);
    }
    async findAll(req) {
        console.log(`[OfferTemplates] findAll for tenant: ${req.user.tenantId}`);
        const results = await this.offerTemplatesService.findAll(req.user.tenantId);
        console.log(`[OfferTemplates] Found ${results.length} templates`);
        return results;
    }
    findOne(req, id) {
        return this.offerTemplatesService.findOne(req.user.tenantId, id);
    }
    update(req, id, updateOfferTemplateDto) {
        return this.offerTemplatesService.update(req.user.tenantId, id, updateOfferTemplateDto);
    }
    remove(req, id) {
        return this.offerTemplatesService.remove(req.user.tenantId, id);
    }
};
exports.OfferTemplatesController = OfferTemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new offer template' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, offer_template_dto_1.CreateOfferTemplateDto]),
    __metadata("design:returntype", void 0)
], OfferTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all offer templates' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfferTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific offer template' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OfferTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an offer template' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, offer_template_dto_1.UpdateOfferTemplateDto]),
    __metadata("design:returntype", void 0)
], OfferTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an offer template' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OfferTemplatesController.prototype, "remove", null);
exports.OfferTemplatesController = OfferTemplatesController = __decorate([
    (0, swagger_1.ApiTags)('offer-templates'),
    (0, common_1.Controller)('offer-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [offer_templates_service_1.OfferTemplatesService])
], OfferTemplatesController);
//# sourceMappingURL=offer-templates.controller.js.map