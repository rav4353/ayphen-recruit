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
exports.OffersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const communication_emails_service_1 = require("../communication/communication-emails.service");
const config_1 = require("@nestjs/config");
const onboarding_service_1 = require("../onboarding/onboarding.service");
let OffersService = class OffersService {
    constructor(prisma, emailsService, configService, onboardingService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
        this.configService = configService;
        this.onboardingService = onboardingService;
    }
    async create(tenantId, data) {
        const application = await this.prisma.application.findFirst({
            where: { id: data.applicationId, job: { tenantId } },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return this.prisma.offer.create({
            data: {
                applicationId: data.applicationId,
                templateId: data.templateId,
                content: data.content,
                salary: data.salary,
                currency: data.currency || 'USD',
                startDate: new Date(data.startDate),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                bonus: data.bonus,
                equity: data.equity,
                notes: data.notes,
                status: client_1.OfferStatus.DRAFT,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.offer.findMany({
            where: { application: { job: { tenantId } } },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                template: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        const offer = await this.prisma.offer.findFirst({
            where: { id, application: { job: { tenantId } } },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: {
                            include: { tenant: { select: { name: true } } }
                        },
                    },
                },
                template: true,
                approvals: {
                    include: { approver: true },
                    orderBy: { order: 'asc' }
                },
            },
        });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found');
        }
        return offer;
    }
    async update(tenantId, id, data) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft offers can be updated');
        }
        return this.prisma.offer.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            },
        });
    }
    async submit(tenantId, id) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft offers can be submitted');
        }
        const job = offer.application.job;
        let approverId = job.hiringManagerId || job.recruiterId;
        if (!approverId) {
            return this.prisma.offer.update({
                where: { id },
                data: { status: client_1.OfferStatus.APPROVED },
            });
        }
        await this.prisma.offerApproval.create({
            data: {
                offerId: id,
                approverId: approverId,
                status: 'PENDING',
                order: 1,
            },
        });
        return this.prisma.offer.update({
            where: { id },
            data: { status: client_1.OfferStatus.PENDING_APPROVAL },
        });
    }
    async approve(tenantId, id, user) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException('Offer is not pending approval');
        }
        const userId = user.sub || user.id;
        let approval = await this.prisma.offerApproval.findFirst({
            where: { offerId: id, approverId: userId, status: 'PENDING' },
        });
        if (!approval && user.permissions?.includes('OFFER_APPROVE')) {
            approval = await this.prisma.offerApproval.findFirst({
                where: { offerId: id, status: 'PENDING' },
            });
        }
        if (!approval) {
            throw new common_1.BadRequestException('You are not authorized to approve this offer.');
        }
        await this.prisma.offerApproval.update({
            where: { id: approval.id },
            data: { status: 'APPROVED', approvedAt: new Date(), approverId: userId },
        });
        return this.prisma.offer.update({
            where: { id },
            data: { status: client_1.OfferStatus.APPROVED },
        });
    }
    async reject(tenantId, id, user, reason) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException('Offer is not pending approval');
        }
        const userId = user.sub || user.id;
        let approval = await this.prisma.offerApproval.findFirst({
            where: { offerId: id, approverId: userId, status: 'PENDING' },
        });
        if (!approval && user.permissions?.includes('OFFER_APPROVE')) {
            approval = await this.prisma.offerApproval.findFirst({
                where: { offerId: id, status: 'PENDING' },
            });
        }
        if (!approval) {
            throw new common_1.BadRequestException('You are not authorized to reject this offer.');
        }
        await this.prisma.offerApproval.update({
            where: { id: approval.id },
            data: { status: 'REJECTED', comment: reason, approvedAt: new Date(), approverId: userId },
        });
        return this.prisma.offer.update({
            where: { id },
            data: {
                status: client_1.OfferStatus.DRAFT,
                notes: offer.notes ? `${offer.notes}\n\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`
            },
        });
    }
    async delete(tenantId, id) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft offers can be deleted');
        }
        return this.prisma.offer.delete({ where: { id } });
    }
    async send(tenantId, id) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== client_1.OfferStatus.APPROVED) {
            throw new common_1.BadRequestException('Only approved offers can be sent');
        }
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const webUrl = this.configService.get('WEB_URL') || 'http://localhost:3000';
        const offerLink = `${webUrl}/offers/public/${token}`;
        await this.emailsService.sendEmail(offer.application.job.recruiterId || offer.application.job.hiringManagerId || '', tenantId, {
            to: offer.application.candidate.email,
            subject: `Job Offer: ${offer.application.job.title} at ${offer.application.job.tenant?.name || 'Ayphen'}`,
            body: `<p>Dear ${offer.application.candidate.firstName},</p>
                   <p>We are pleased to offer you the position of ${offer.application.job.title}.</p>
                   <p>Please review and sign your offer letter at the following link:</p>
                   <p><a href="${offerLink}">${offerLink}</a></p>
                   <p>Best regards,<br>Hiring Team</p>`,
            candidateId: offer.application.candidateId
        });
        return this.prisma.offer.update({
            where: { id },
            data: {
                status: client_1.OfferStatus.SENT,
                sentAt: new Date(),
                token,
            }
        });
    }
    async getPublicOffer(token) {
        const offer = await this.prisma.offer.findUnique({
            where: { token },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    }
                }
            }
        });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found or invalid token');
        }
        if (offer.expiresAt && new Date() > offer.expiresAt) {
        }
        return offer;
    }
    async acceptOffer(token, signature) {
        const offer = await this.getPublicOffer(token);
        if (offer.status !== client_1.OfferStatus.SENT) {
            throw new common_1.BadRequestException('Offer is not in a valid state to be accepted');
        }
        const updatedOffer = await this.prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: client_1.OfferStatus.ACCEPTED,
                acceptedAt: new Date(),
                signedLetterUrl: signature,
            }
        });
        try {
            await this.onboardingService.create({ applicationId: offer.applicationId }, offer.application.job.tenantId);
        }
        catch (error) {
            console.warn('Failed to auto-create onboarding workflow:', error.message);
        }
        return updatedOffer;
    }
    async declineOffer(token, reason) {
        const offer = await this.getPublicOffer(token);
        if (offer.status !== client_1.OfferStatus.SENT) {
            throw new common_1.BadRequestException('Offer is not in a valid state to be declined');
        }
        return this.prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: client_1.OfferStatus.DECLINED,
                declinedAt: new Date(),
                declineReason: reason,
            }
        });
    }
};
exports.OffersService = OffersService;
exports.OffersService = OffersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communication_emails_service_1.CommunicationEmailsService,
        config_1.ConfigService,
        onboarding_service_1.OnboardingService])
], OffersService);
//# sourceMappingURL=offers.service.js.map