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
var CommunicationEmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationEmailsService = exports.SendEmailDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
const client_1 = require("@prisma/client");
class SendEmailDto {
}
exports.SendEmailDto = SendEmailDto;
let CommunicationEmailsService = CommunicationEmailsService_1 = class CommunicationEmailsService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(CommunicationEmailsService_1.name);
    }
    async sendEmail(userId, tenantId, dto) {
        const { to, subject, body, candidateId, cc, bcc } = dto;
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate || candidate.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        const email = await this.prisma.email.create({
            data: {
                to,
                from: 'system',
                subject,
                body,
                direction: client_1.EmailDirection.OUTBOUND,
                status: client_1.EmailStatus.DRAFT,
                candidateId,
                userId,
                cc,
                bcc,
                tenant: { connect: { id: tenantId } },
            },
        });
        try {
            const sent = await this.emailService.sendEmail({
                to,
                subject,
                html: body,
                tenantId,
                bcc,
            });
            if (sent) {
                return this.prisma.email.update({
                    where: { id: email.id },
                    data: {
                        status: client_1.EmailStatus.SENT,
                        sentAt: new Date(),
                    },
                });
            }
            else {
                return this.prisma.email.update({
                    where: { id: email.id },
                    data: { status: client_1.EmailStatus.FAILED },
                });
            }
        }
        catch (error) {
            this.logger.error(`Failed to send email ${email.id}`, error);
            await this.prisma.email.update({
                where: { id: email.id },
                data: { status: client_1.EmailStatus.FAILED },
            });
            throw error;
        }
    }
    async getEmailsForCandidate(candidateId, tenantId) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate || candidate.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        return this.prisma.email.findMany({
            where: { candidateId },
            orderBy: { createdAt: 'desc' },
            include: {
                attachments: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
    }
    async sendBulkEmail(userId, tenantId, data) {
        const { ids, subject, message } = data;
        const candidates = await this.prisma.candidate.findMany({
            where: {
                id: { in: ids },
                tenantId
            },
        });
        let sentCount = 0;
        for (const candidate of candidates) {
            try {
                const personalizedBody = message.replace(/{{firstName}}/g, candidate.firstName || '')
                    .replace(/{{lastName}}/g, candidate.lastName || '');
                await this.sendEmail(userId, tenantId, {
                    to: candidate.email,
                    subject,
                    body: personalizedBody,
                    candidateId: candidate.id
                });
                sentCount++;
            }
            catch (error) {
                this.logger.error(`Failed to send bulk email to candidate ${candidate.id}`, error);
            }
        }
        return { count: sentCount, total: candidates.length };
    }
    async processInboundEmail(payload) {
        const { from, to, subject, body, tenantId } = payload;
        let candidate;
        if (tenantId) {
            candidate = await this.prisma.candidate.findFirst({
                where: { email: from, tenantId },
            });
        }
        else {
            candidate = await this.prisma.candidate.findFirst({
                where: { email: from },
            });
        }
        if (!candidate) {
            this.logger.warn(`Received email from unknown candidate: ${from}`);
            return { processed: false, reason: 'Candidate not found' };
        }
        const email = await this.prisma.email.create({
            data: {
                from,
                to,
                subject,
                body,
                direction: client_1.EmailDirection.INBOUND,
                status: client_1.EmailStatus.RECEIVED,
                candidate: { connect: { id: candidate.id } },
                tenant: { connect: { id: candidate.tenantId } },
                sentAt: new Date(),
            },
        });
        this.logger.log(`Processed inbound email from ${from} for candidate ${candidate.id}`);
        return { processed: true, emailId: email.id };
    }
    async getThreads(tenantId) {
        const candidates = await this.prisma.candidate.findMany({
            where: {
                tenantId,
                emails: { some: {} }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                emails: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        subject: true,
                        body: true,
                        createdAt: true,
                        direction: true,
                        status: true
                    }
                }
            }
        });
        const threads = candidates.map((c) => ({
            candidateId: c.id,
            candidateName: `${c.firstName} ${c.lastName}`,
            candidateEmail: c.email,
            lastMessage: c.emails?.[0] || null
        })).sort((a, b) => {
            return new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime();
        });
        return threads;
    }
};
exports.CommunicationEmailsService = CommunicationEmailsService;
exports.CommunicationEmailsService = CommunicationEmailsService = CommunicationEmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], CommunicationEmailsService);
//# sourceMappingURL=communication-emails.service.js.map