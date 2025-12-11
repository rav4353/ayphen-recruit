"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffersModule = void 0;
const common_1 = require("@nestjs/common");
const offers_service_1 = require("./offers.service");
const offers_controller_1 = require("./offers.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const communication_module_1 = require("../communication/communication.module");
const config_1 = require("@nestjs/config");
const onboarding_module_1 = require("../onboarding/onboarding.module");
let OffersModule = class OffersModule {
};
exports.OffersModule = OffersModule;
exports.OffersModule = OffersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, communication_module_1.CommunicationModule, config_1.ConfigModule, onboarding_module_1.OnboardingModule],
        controllers: [offers_controller_1.OffersController],
        providers: [offers_service_1.OffersService],
        exports: [offers_service_1.OffersService],
    })
], OffersModule);
//# sourceMappingURL=offers.module.js.map