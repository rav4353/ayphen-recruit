"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationModule = void 0;
const common_1 = require("@nestjs/common");
const communication_emails_controller_1 = require("./communication-emails.controller");
const communication_webhooks_controller_1 = require("./communication-webhooks.controller");
const communication_emails_service_1 = require("./communication-emails.service");
const email_templates_controller_1 = require("./templates/email-templates.controller");
const email_templates_service_1 = require("./templates/email-templates.service");
const sms_controller_1 = require("./sms.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const email_service_1 = require("../../common/services/email.service");
const sms_service_1 = require("../../common/services/sms.service");
const config_1 = require("@nestjs/config");
let CommunicationModule = class CommunicationModule {
};
exports.CommunicationModule = CommunicationModule;
exports.CommunicationModule = CommunicationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule],
        controllers: [communication_emails_controller_1.CommunicationEmailsController, email_templates_controller_1.EmailTemplatesController, communication_webhooks_controller_1.CommunicationWebhooksController, sms_controller_1.SmsController],
        providers: [communication_emails_service_1.CommunicationEmailsService, email_service_1.EmailService, email_templates_service_1.EmailTemplatesService, sms_service_1.SmsService],
        exports: [communication_emails_service_1.CommunicationEmailsService, email_templates_service_1.EmailTemplatesService, sms_service_1.SmsService],
    })
], CommunicationModule);
//# sourceMappingURL=communication.module.js.map