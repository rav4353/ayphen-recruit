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
var CommunicationWebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationWebhooksController = void 0;
const common_1 = require("@nestjs/common");
const communication_emails_service_1 = require("./communication-emails.service");
let CommunicationWebhooksController = CommunicationWebhooksController_1 = class CommunicationWebhooksController {
    constructor(emailsService) {
        this.emailsService = emailsService;
        this.logger = new common_1.Logger(CommunicationWebhooksController_1.name);
    }
    async handleInboundEmail(payload) {
        this.logger.log('Received inbound email webhook', JSON.stringify(payload));
        const from = payload.from || payload.sender;
        const to = payload.to || payload.recipient;
        const subject = payload.subject;
        const body = payload.body || payload.html || payload.text;
        const tenantId = payload.tenantId;
        if (!from || !subject || !body) {
            this.logger.warn('Invalid webhook payload: missing required fields');
            return { success: false, reason: 'Missing required fields' };
        }
        const result = await this.emailsService.processInboundEmail({
            from,
            to,
            subject,
            body,
            tenantId,
        });
        return { success: true, ...result };
    }
};
exports.CommunicationWebhooksController = CommunicationWebhooksController;
__decorate([
    (0, common_1.Post)('inbound'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunicationWebhooksController.prototype, "handleInboundEmail", null);
exports.CommunicationWebhooksController = CommunicationWebhooksController = CommunicationWebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks/email'),
    __metadata("design:paramtypes", [communication_emails_service_1.CommunicationEmailsService])
], CommunicationWebhooksController);
//# sourceMappingURL=communication-webhooks.controller.js.map