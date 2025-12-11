"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const offer_templates_service_1 = require("./offer-templates.service");
const offer_templates_controller_1 = require("./offer-templates.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
let OfferTemplatesModule = class OfferTemplatesModule {
};
exports.OfferTemplatesModule = OfferTemplatesModule;
exports.OfferTemplatesModule = OfferTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [offer_templates_controller_1.OfferTemplatesController],
        providers: [offer_templates_service_1.OfferTemplatesService],
        exports: [offer_templates_service_1.OfferTemplatesService],
    })
], OfferTemplatesModule);
//# sourceMappingURL=offer-templates.module.js.map