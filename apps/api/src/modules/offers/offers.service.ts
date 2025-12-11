import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus } from '@prisma/client';

import { CommunicationEmailsService } from '../communication/communication-emails.service';
import { ConfigService } from '@nestjs/config';

import { OnboardingService } from '../onboarding/onboarding.service';

@Injectable()
export class OffersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailsService: CommunicationEmailsService,
        private readonly configService: ConfigService,
        private readonly onboardingService: OnboardingService,
    ) { }

    async create(tenantId: string, data: CreateOfferDto) {
        // Verify application belongs to tenant
        const application = await this.prisma.application.findFirst({
            where: { id: data.applicationId, job: { tenantId } },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
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
                status: OfferStatus.DRAFT,
            },
        });
    }

    async findAll(tenantId: string) {
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

    async findOne(tenantId: string, id: string) {
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
            throw new NotFoundException('Offer not found');
        }

        return offer;
    }

    async update(tenantId: string, id: string, data: UpdateOfferDto) {
        const offer = await this.findOne(tenantId, id);

        if (offer.status !== OfferStatus.DRAFT) {
            throw new BadRequestException('Only draft offers can be updated');
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

    async submit(tenantId: string, id: string) {
        const offer = await this.findOne(tenantId, id);

        if (offer.status !== OfferStatus.DRAFT) {
            throw new BadRequestException('Only draft offers can be submitted');
        }

        const job = offer.application.job;
        let approverId = job.hiringManagerId || job.recruiterId;

        if (!approverId) {
            return this.prisma.offer.update({
                where: { id },
                data: { status: OfferStatus.APPROVED },
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
            data: { status: OfferStatus.PENDING_APPROVAL },
        });
    }

    async approve(tenantId: string, id: string, user: any) {
        const offer = await this.findOne(tenantId, id);

        if (offer.status !== OfferStatus.PENDING_APPROVAL) {
            throw new BadRequestException('Offer is not pending approval');
        }

        const userId = user.sub || user.id;

        // 1. Try to find an approval assigned specifically to this user
        let approval = await this.prisma.offerApproval.findFirst({
            where: { offerId: id, approverId: userId, status: 'PENDING' },
        });

        // 2. If not found, check if user has admin permission to override
        if (!approval && user.permissions?.includes('OFFER_APPROVE')) {
            // Find ANY pending approval to override
            approval = await this.prisma.offerApproval.findFirst({
                where: { offerId: id, status: 'PENDING' },
            });
        }

        if (!approval) {
            throw new BadRequestException('You are not authorized to approve this offer.');
        }

        await this.prisma.offerApproval.update({
            where: { id: approval.id },
            data: { status: 'APPROVED', approvedAt: new Date(), approverId: userId },
        });

        return this.prisma.offer.update({
            where: { id },
            data: { status: OfferStatus.APPROVED },
        });
    }

    async reject(tenantId: string, id: string, user: any, reason: string) {
        const offer = await this.findOne(tenantId, id);

        if (offer.status !== OfferStatus.PENDING_APPROVAL) {
            throw new BadRequestException('Offer is not pending approval');
        }

        const userId = user.sub || user.id;

        // 1. Try to find an approval assigned specifically to this user
        let approval = await this.prisma.offerApproval.findFirst({
            where: { offerId: id, approverId: userId, status: 'PENDING' },
        });

        // 2. If not found, check if user has admin permission to override
        if (!approval && user.permissions?.includes('OFFER_APPROVE')) {
            // Find ANY pending approval to override
            approval = await this.prisma.offerApproval.findFirst({
                where: { offerId: id, status: 'PENDING' },
            });
        }

        if (!approval) {
            throw new BadRequestException('You are not authorized to reject this offer.');
        }

        await this.prisma.offerApproval.update({
            where: { id: approval.id },
            data: { status: 'REJECTED', comment: reason, approvedAt: new Date(), approverId: userId },
        });

        return this.prisma.offer.update({
            where: { id },
            data: {
                status: OfferStatus.DRAFT,
                notes: offer.notes ? `${offer.notes}\n\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`
            },
        });
    }

    async delete(tenantId: string, id: string) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== OfferStatus.DRAFT) {
            throw new BadRequestException('Only draft offers can be deleted');
        }
        return this.prisma.offer.delete({ where: { id } });
    }

    async send(tenantId: string, id: string) {
        const offer = await this.findOne(tenantId, id);
        if (offer.status !== OfferStatus.APPROVED) {
            throw new BadRequestException('Only approved offers can be sent');
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const webUrl = this.configService.get('WEB_URL') || 'http://localhost:3000';
        const offerLink = `${webUrl}/offers/public/${token}`;

        // Send email to candidate
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
                status: OfferStatus.SENT,
                sentAt: new Date(),
                token,
            }
        });
    }

    async getPublicOffer(token: string) {
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
            throw new NotFoundException('Offer not found or invalid token');
        }

        // Check expiry
        if (offer.expiresAt && new Date() > offer.expiresAt) {
            // We might still want to show it but as expired
            // For now, let's return it but the frontend can handle expired state
        }

        return offer;
    }

    async acceptOffer(token: string, signature: string) {
        const offer = await this.getPublicOffer(token);

        if (offer.status !== OfferStatus.SENT) {
            throw new BadRequestException('Offer is not in a valid state to be accepted');
        }

        const updatedOffer = await this.prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: OfferStatus.ACCEPTED,
                acceptedAt: new Date(),
                signedLetterUrl: signature,
            }
        });

        // Trigger Onboarding Workflow automatically
        try {
            await this.onboardingService.create(
                { applicationId: offer.applicationId },
                offer.application.job.tenantId
            );
        } catch (error) {
            // Log error but don't fail the request if onboarding already exists etc.
            console.warn('Failed to auto-create onboarding workflow:', error.message);
        }

        return updatedOffer;
    }

    async declineOffer(token: string, reason: string) {
        const offer = await this.getPublicOffer(token);

        if (offer.status !== OfferStatus.SENT) {
            throw new BadRequestException('Offer is not in a valid state to be declined');
        }

        return this.prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: OfferStatus.DECLINED,
                declinedAt: new Date(),
                declineReason: reason,
            }
        });
    }
}
