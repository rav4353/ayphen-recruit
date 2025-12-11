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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reference_service_1 = require("./reference.service");
let ReferenceController = class ReferenceController {
    constructor(referenceService) {
        this.referenceService = referenceService;
    }
    getCurrencies() {
        return this.referenceService.getCurrencies();
    }
};
exports.ReferenceController = ReferenceController;
__decorate([
    (0, common_1.Get)('currencies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of supported currencies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all currencies.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReferenceController.prototype, "getCurrencies", null);
exports.ReferenceController = ReferenceController = __decorate([
    (0, swagger_1.ApiTags)('reference'),
    (0, common_1.Controller)('reference'),
    __metadata("design:paramtypes", [reference_service_1.ReferenceService])
], ReferenceController);
//# sourceMappingURL=reference.controller.js.map