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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const SMS_CONFIG_KEY = 'sms_config';
let SmsService = SmsService_1 = class SmsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SmsService_1.name);
    }
    async getConfig(tenantId) {
        const setting = await this.prisma.setting.findUnique({
            where: { tenantId_key: { tenantId, key: SMS_CONFIG_KEY } },
        });
        return setting?.value;
    }
    async saveConfig(tenantId, config) {
        await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key: SMS_CONFIG_KEY } },
            update: { value: config, category: 'INTEGRATION' },
            create: {
                tenantId,
                key: SMS_CONFIG_KEY,
                value: config,
                category: 'INTEGRATION',
                isPublic: false,
            },
        });
    }
    async getSettings(tenantId) {
        const config = await this.getConfig(tenantId);
        if (!config?.accountSid)
            return null;
        return {
            provider: config.provider,
            fromNumber: config.fromNumber,
            isConfigured: true,
        };
    }
    async sendViaTwilio(config, options) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
        const body = new URLSearchParams({
            To: options.to,
            From: config.fromNumber,
            Body: options.body,
        });
        if (options.mediaUrl) {
            body.append('MediaUrl', options.mediaUrl);
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, messageId: data.sid };
            }
            else {
                this.logger.error('Twilio SMS error:', data);
                return { success: false, error: data.message || 'Failed to send SMS' };
            }
        }
        catch (error) {
            this.logger.error('Twilio SMS exception:', error);
            return { success: false, error: error.message };
        }
    }
    async sendViaMsg91(config, options) {
        const url = 'https://api.msg91.com/api/v5/flow/';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'authkey': config.authToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: config.fromNumber,
                    route: '4',
                    country: '91',
                    sms: [{
                            message: options.body,
                            to: [options.to.replace('+', '')],
                        }],
                }),
            });
            const data = await response.json();
            if (data.type === 'success') {
                return { success: true, messageId: data.request_id };
            }
            else {
                return { success: false, error: data.message };
            }
        }
        catch (error) {
            this.logger.error('MSG91 SMS exception:', error);
            return { success: false, error: error.message };
        }
    }
    async sendSms(options) {
        const config = await this.getConfig(options.tenantId);
        if (!config?.accountSid) {
            return { success: false, error: 'SMS not configured. Please configure SMS settings.' };
        }
        const normalizedPhone = this.normalizePhoneNumber(options.to);
        if (!normalizedPhone) {
            return { success: false, error: 'Invalid phone number format' };
        }
        let result;
        switch (config.provider) {
            case 'TWILIO':
                result = await this.sendViaTwilio(config, { ...options, to: normalizedPhone });
                break;
            case 'MSG91':
                result = await this.sendViaMsg91(config, { ...options, to: normalizedPhone });
                break;
            default:
                result = await this.sendViaTwilio(config, { ...options, to: normalizedPhone });
        }
        if (options.candidateId) {
            await this.logSmsAttempt(options, result);
        }
        return result;
    }
    async sendBulkSms(tenantId, recipients) {
        const results = { total: recipients.length, sent: 0, failed: 0, errors: [] };
        for (const recipient of recipients) {
            const result = await this.sendSms({
                tenantId,
                to: recipient.phone,
                body: recipient.body,
                candidateId: recipient.candidateId,
            });
            if (result.success) {
                results.sent++;
            }
            else {
                results.failed++;
                results.errors.push(`${recipient.phone}: ${result.error}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return results;
    }
    normalizePhoneNumber(phone) {
        let cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) {
            return cleaned;
        }
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.length === 10) {
            if (/^[6-9]/.test(cleaned)) {
                return `+91${cleaned}`;
            }
            return `+1${cleaned}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return `+${cleaned}`;
        }
        if (cleaned.length >= 10 && cleaned.length <= 15) {
            return `+${cleaned}`;
        }
        return null;
    }
    async logSmsAttempt(options, result) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    action: result.success ? 'SMS_SENT' : 'SMS_FAILED',
                    description: `SMS to ${options.to}: ${result.success ? 'Sent' : result.error}`,
                    metadata: {
                        to: options.to,
                        body: options.body.substring(0, 100) + (options.body.length > 100 ? '...' : ''),
                        messageId: result.messageId,
                        error: result.error,
                    },
                    candidateId: options.candidateId,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to log SMS attempt:', error);
        }
    }
    async getTemplates(tenantId) {
        return this.prisma.setting.findMany({
            where: {
                tenantId,
                key: { startsWith: 'sms_template_' },
            },
        });
    }
    async saveTemplate(tenantId, name, content) {
        const key = `sms_template_${name.toLowerCase().replace(/\s+/g, '_')}`;
        return this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key } },
            update: { value: { name, content } },
            create: {
                tenantId,
                key,
                value: { name, content },
                category: 'TEMPLATE',
                isPublic: false,
            },
        });
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SmsService);
//# sourceMappingURL=sms.service.js.map