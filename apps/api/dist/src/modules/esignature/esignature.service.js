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
var ESignatureService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESignatureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const docusign_service_1 = require("./providers/docusign.service");
let ESignatureService = ESignatureService_1 = class ESignatureService {
    constructor(prisma, docuSign) {
        this.prisma = prisma;
        this.docuSign = docuSign;
        this.logger = new common_1.Logger(ESignatureService_1.name);
    }
    async getAuthUrl(tenantId) {
        const settings = await this.prisma.eSignatureSettings.findUnique({ where: { tenantId } });
        if (!settings?.clientId || !settings?.clientSecret) {
            throw new common_1.BadRequestException('DocuSign not configured. Please add credentials first.');
        }
        const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
        const config = { clientId: settings.clientId, clientSecret: settings.clientSecret };
        return this.docuSign.getAuthUrl(config, state);
    }
    async configureSettings(tenantId, dto) {
        const settings = await this.prisma.eSignatureSettings.upsert({
            where: { tenantId },
            update: {
                provider: dto.provider,
                clientId: dto.clientId,
                clientSecret: dto.clientSecret,
                accountId: dto.accountId,
                baseUrl: dto.baseUrl,
            },
            create: {
                tenantId,
                provider: dto.provider,
                clientId: dto.clientId,
                clientSecret: dto.clientSecret,
                accountId: dto.accountId,
                baseUrl: dto.baseUrl,
            },
        });
        return { id: settings.id, provider: settings.provider, isConfigured: settings.isConfigured };
    }
    async connect(tenantId, dto) {
        const settings = await this.prisma.eSignatureSettings.findUnique({ where: { tenantId } });
        if (!settings?.clientId || !settings?.clientSecret)
            throw new common_1.BadRequestException('E-signature provider not configured');
        const config = { clientId: settings.clientId, clientSecret: settings.clientSecret };
        const tokens = await this.docuSign.exchangeCodeForTokens(config, dto.code, dto.redirectUri);
        const userInfo = await this.docuSign.getUserInfo(config, tokens.access_token);
        const defaultAccount = userInfo.accounts.find(a => a.is_default) || userInfo.accounts[0];
        if (!defaultAccount)
            throw new common_1.BadRequestException('No DocuSign account found');
        await this.prisma.eSignatureSettings.update({
            where: { tenantId },
            data: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                accountId: defaultAccount.account_id,
                baseUrl: defaultAccount.base_uri,
                isConfigured: true,
            },
        });
        return { success: true, accountId: defaultAccount.account_id };
    }
    async getSettings(tenantId) {
        return this.prisma.eSignatureSettings.findUnique({
            where: { tenantId },
            select: { id: true, provider: true, clientId: true, accountId: true, baseUrl: true, isConfigured: true },
        });
    }
    async getValidAccessToken(settings) {
        if (settings.tokenExpiresAt && new Date(settings.tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
            return settings.accessToken;
        }
        if (!settings.refreshToken)
            throw new common_1.BadRequestException('E-signature connection expired. Please reconnect.');
        const config = { clientId: settings.clientId, clientSecret: settings.clientSecret };
        const tokens = await this.docuSign.refreshAccessToken(config, settings.refreshToken);
        await this.prisma.eSignatureSettings.update({
            where: { id: settings.id },
            data: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || settings.refreshToken,
                tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            },
        });
        return tokens.access_token;
    }
    async sendForSignature(tenantId, dto) {
        const settings = await this.prisma.eSignatureSettings.findUnique({ where: { tenantId } });
        if (!settings?.isConfigured)
            throw new common_1.BadRequestException('E-signature is not configured');
        const offer = await this.prisma.offer.findFirst({
            where: { id: dto.offerId, application: { job: { tenantId } } },
            include: { application: { include: { candidate: true, job: { include: { tenant: true } } } } },
        });
        if (!offer)
            throw new common_1.NotFoundException('Offer not found');
        if (offer.status !== 'APPROVED' && offer.status !== 'SENT') {
            throw new common_1.BadRequestException('Offer must be approved before sending for signature');
        }
        const accessToken = await this.getValidAccessToken(settings);
        const documentBase64 = await this.generateOfferPdf(offer);
        const envelope = await this.docuSign.createEnvelope(accessToken, settings.baseUrl, settings.accountId, {
            documentBase64,
            documentName: `Offer Letter - ${offer.application.candidate.firstName} ${offer.application.candidate.lastName}.pdf`,
            signers: dto.signers.map((s, i) => ({ name: s.name, email: s.email, recipientId: String(i + 1), routingOrder: String(s.order || i + 1) })),
            emailSubject: dto.emailSubject || `Please sign your offer letter for ${offer.application.job.title}`,
            emailBlurb: dto.emailMessage,
            status: 'sent',
        });
        const envelopeRecord = await this.prisma.eSignatureEnvelope.create({
            data: {
                offerId: dto.offerId,
                provider: settings.provider,
                externalId: envelope.envelopeId,
                status: 'SENT',
                signers: dto.signers,
                sentAt: new Date(),
                expiresAt: dto.expirationDays ? new Date(Date.now() + dto.expirationDays * 24 * 60 * 60 * 1000) : null,
            },
        });
        await this.prisma.offer.update({ where: { id: dto.offerId }, data: { status: 'SENT', sentAt: new Date() } });
        return { envelopeId: envelopeRecord.id, externalEnvelopeId: envelope.envelopeId, status: 'SENT' };
    }
    async getEnvelopeStatus(tenantId, envelopeId) {
        const envelope = await this.prisma.eSignatureEnvelope.findFirst({
            where: { id: envelopeId, offer: { application: { job: { tenantId } } } },
            include: { offer: true },
        });
        if (!envelope)
            throw new common_1.NotFoundException('Envelope not found');
        const signers = envelope.signers || [];
        return {
            envelopeId: envelope.id,
            status: envelope.status,
            signers: signers.map(s => ({ name: s.name, email: s.email, status: 'pending' })),
            sentAt: envelope.sentAt?.toISOString(),
            viewedAt: envelope.viewedAt?.toISOString(),
            signedAt: envelope.signedAt?.toISOString(),
            declinedAt: envelope.declinedAt?.toISOString(),
        };
    }
    async getEmbeddedSigningUrl(tenantId, envelopeId, returnUrl) {
        const envelope = await this.prisma.eSignatureEnvelope.findFirst({
            where: { id: envelopeId, offer: { application: { job: { tenantId } } } },
            include: { offer: { include: { application: { include: { candidate: true } } } } },
        });
        if (!envelope?.externalId)
            throw new common_1.NotFoundException('Envelope not found');
        const settings = await this.prisma.eSignatureSettings.findUnique({ where: { tenantId } });
        if (!settings?.isConfigured)
            throw new common_1.BadRequestException('E-signature not configured');
        const accessToken = await this.getValidAccessToken(settings);
        const candidate = envelope.offer.application.candidate;
        const result = await this.docuSign.getEmbeddedSigningUrl(accessToken, settings.baseUrl, settings.accountId, envelope.externalId, {
            signerEmail: candidate.email,
            signerName: `${candidate.firstName} ${candidate.lastName}`,
            returnUrl,
        });
        return { url: result.url, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
    }
    async voidEnvelope(tenantId, envelopeId, reason) {
        const envelope = await this.prisma.eSignatureEnvelope.findFirst({
            where: { id: envelopeId, offer: { application: { job: { tenantId } } } },
        });
        if (!envelope?.externalId)
            throw new common_1.NotFoundException('Envelope not found');
        const settings = await this.prisma.eSignatureSettings.findUnique({ where: { tenantId } });
        if (!settings?.isConfigured)
            throw new common_1.BadRequestException('E-signature not configured');
        const accessToken = await this.getValidAccessToken(settings);
        await this.docuSign.voidEnvelope(accessToken, settings.baseUrl, settings.accountId, envelope.externalId, reason);
        await this.prisma.eSignatureEnvelope.update({ where: { id: envelopeId }, data: { status: 'VOIDED' } });
        await this.prisma.offer.update({ where: { id: envelope.offerId }, data: { status: 'WITHDRAWN' } });
        return { success: true };
    }
    async handleWebhook(payload) {
        const envelopeId = payload.envelopeId || payload.data?.envelopeId;
        if (!envelopeId)
            return;
        const envelope = await this.prisma.eSignatureEnvelope.findFirst({ where: { externalId: envelopeId } });
        if (!envelope)
            return;
        const status = this.mapDocuSignStatus(payload.status || payload.data?.status);
        const updateData = { status, webhookEvents: { push: payload } };
        if (status === 'VIEWED')
            updateData.viewedAt = new Date();
        if (status === 'SIGNED') {
            updateData.signedAt = new Date();
            await this.prisma.offer.update({ where: { id: envelope.offerId }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
        }
        if (status === 'DECLINED') {
            updateData.declinedAt = new Date();
            updateData.declineReason = payload.declineReason;
            await this.prisma.offer.update({ where: { id: envelope.offerId }, data: { status: 'DECLINED', declinedAt: new Date() } });
        }
        await this.prisma.eSignatureEnvelope.update({ where: { id: envelope.id }, data: updateData });
    }
    mapDocuSignStatus(status) {
        const map = {
            created: 'CREATED', sent: 'SENT', delivered: 'DELIVERED', viewed: 'VIEWED',
            completed: 'SIGNED', declined: 'DECLINED', voided: 'VOIDED',
        };
        return map[status?.toLowerCase()] || 'SENT';
    }
    async generateOfferPdf(offer) {
        const html = `
            <html><head><style>body{font-family:Arial,sans-serif;padding:40px;}</style></head>
            <body>
                <h1>Offer Letter</h1>
                <p>Dear ${offer.application.candidate.firstName} ${offer.application.candidate.lastName},</p>
                <div>${offer.content || 'We are pleased to offer you the position.'}</div>
                <p><strong>Position:</strong> ${offer.application.job.title}</p>
                <p><strong>Salary:</strong> ${offer.currency} ${offer.salary}</p>
                <p><strong>Start Date:</strong> ${offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'TBD'}</p>
                <br/><p>Signature: ____________________</p>
                <p>Date: ____________________</p>
            </body></html>
        `;
        return Buffer.from(html).toString('base64');
    }
};
exports.ESignatureService = ESignatureService;
exports.ESignatureService = ESignatureService = ESignatureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        docusign_service_1.DocuSignService])
], ESignatureService);
//# sourceMappingURL=esignature.service.js.map