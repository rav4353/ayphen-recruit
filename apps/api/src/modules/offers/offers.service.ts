import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus } from '@prisma/client';

import { CommunicationEmailsService } from '../communication/communication-emails.service';
import { ConfigService } from '@nestjs/config';

import { OnboardingService } from '../onboarding/onboarding.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OffersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailsService: CommunicationEmailsService,
        private readonly configService: ConfigService,
        private readonly onboardingService: OnboardingService,
        private readonly notificationsService: NotificationsService,
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

        // Send notification for offer accepted
        await this.sendOfferNotification(offer, 'ACCEPTED');

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

        const updatedOffer = await this.prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: OfferStatus.DECLINED,
                declinedAt: new Date(),
                declineReason: reason,
            }
        });

        // Send notification for offer declined
        await this.sendOfferNotification(offer, 'DECLINED');

        return updatedOffer;
    }

    private async sendOfferNotification(offer: any, status: string) {
        try {
            const job = offer.application?.job;
            if (!job) return;

            const recipientIds: string[] = [];
            if (job.recruiterId) recipientIds.push(job.recruiterId);
            if (job.hiringManagerId) recipientIds.push(job.hiringManagerId);

            if (recipientIds.length > 0) {
                await this.notificationsService.notifyOfferStatusChange(
                    offer,
                    status,
                    recipientIds,
                    job.tenantId,
                );
            }
        } catch (error) {
            console.error('Failed to send offer notification:', error);
        }
    }

    /**
     * Generate offer letter content from template with variable substitution
     */
    async generateOfferLetter(tenantId: string, offerId: string) {
        const offer = await this.findOne(tenantId, offerId);
        
        // Get template content
        let letterContent = offer.template?.content || offer.content || this.getDefaultOfferTemplate();

        // Get tenant details
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true, logo: true },
        });

        // Prepare substitution variables
        const variables: Record<string, string> = {
            // Candidate info
            '{{candidate_name}}': `${offer.application.candidate.firstName} ${offer.application.candidate.lastName}`,
            '{{candidate_first_name}}': offer.application.candidate.firstName || '',
            '{{candidate_last_name}}': offer.application.candidate.lastName || '',
            '{{candidate_email}}': offer.application.candidate.email || '',
            
            // Job info
            '{{job_title}}': offer.application.job.title || '',
            '{{department}}': offer.application.job.departmentId || '',
            '{{location}}': offer.application.job.locationId || '',
            '{{employment_type}}': offer.application.job.employmentType || 'Full-time',
            
            // Compensation
            '{{salary}}': this.formatCurrency(Number(offer.salary), offer.currency),
            '{{salary_amount}}': offer.salary?.toString() || '',
            '{{currency}}': offer.currency || 'USD',
            '{{bonus}}': offer.bonus ? this.formatCurrency(Number(offer.bonus), offer.currency) : 'N/A',
            '{{equity}}': offer.equity || 'N/A',
            
            // Dates
            '{{start_date}}': offer.startDate ? this.formatDate(offer.startDate) : 'TBD',
            '{{offer_date}}': this.formatDate(new Date()),
            '{{expiry_date}}': offer.expiresAt ? this.formatDate(offer.expiresAt) : 'N/A',
            
            // Company info
            '{{company_name}}': tenant?.name || 'Our Company',
            '{{company_logo}}': tenant?.logo || '',
            
            // Other
            '{{offer_id}}': offer.id,
        };

        // Replace all variables in template
        for (const [key, value] of Object.entries(variables)) {
            letterContent = letterContent.replace(new RegExp(key, 'g'), value);
        }

        return {
            content: letterContent,
            variables,
            offer,
        };
    }

    /**
     * Preview offer letter (without saving)
     */
    async previewOfferLetter(tenantId: string, data: {
        applicationId: string;
        templateId?: string;
        salary?: number;
        currency?: string;
        startDate?: string;
        bonus?: number;
        equity?: string;
    }) {
        // Get application details
        const application = await this.prisma.application.findFirst({
            where: { id: data.applicationId, job: { tenantId } },
            include: {
                candidate: true,
                job: {
                    include: { tenant: { select: { name: true, logo: true } } }
                },
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Get template if specified
        let templateContent = this.getDefaultOfferTemplate();
        if (data.templateId) {
            const template = await this.prisma.offerTemplate.findUnique({
                where: { id: data.templateId },
            });
            if (template) {
                templateContent = template.content;
            }
        }

        // Prepare variables
        const variables: Record<string, string> = {
            '{{candidate_name}}': `${application.candidate.firstName} ${application.candidate.lastName}`,
            '{{candidate_first_name}}': application.candidate.firstName || '',
            '{{job_title}}': application.job.title || '',
            '{{department}}': application.job.departmentId || '',
            '{{location}}': application.job.locationId || '',
            '{{salary}}': data.salary ? this.formatCurrency(data.salary, data.currency || 'USD') : '[SALARY]',
            '{{bonus}}': data.bonus ? this.formatCurrency(data.bonus, data.currency || 'USD') : 'N/A',
            '{{equity}}': data.equity || 'N/A',
            '{{start_date}}': data.startDate ? this.formatDate(new Date(data.startDate)) : '[START DATE]',
            '{{offer_date}}': this.formatDate(new Date()),
            '{{company_name}}': application.job.tenant?.name || 'Our Company',
        };

        let content = templateContent;
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(key, 'g'), value);
        }

        return { content, variables };
    }

    /**
     * Get all available offer templates
     */
    async getTemplates(tenantId: string) {
        return this.prisma.offerTemplate.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Create custom offer template
     */
    async createTemplate(tenantId: string, data: {
        name: string;
        content: string;
    }) {
        return this.prisma.offerTemplate.create({
            data: {
                tenantId,
                name: data.name,
                content: data.content,
            },
        });
    }

    private formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(date));
    }

    private getDefaultOfferTemplate(): string {
        return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #333;">{{company_name}}</h1>
        <h2 style="color: #666; font-weight: normal;">Employment Offer Letter</h2>
    </div>
    
    <p style="margin-bottom: 20px;"><strong>Date:</strong> {{offer_date}}</p>
    
    <p style="margin-bottom: 20px;">Dear {{candidate_first_name}},</p>
    
    <p style="margin-bottom: 20px;">
        We are pleased to offer you the position of <strong>{{job_title}}</strong> at {{company_name}}. 
        We were impressed with your background and believe you will be a valuable addition to our team.
    </p>
    
    <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Position Details</h3>
    <ul style="margin-bottom: 20px;">
        <li><strong>Position:</strong> {{job_title}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Location:</strong> {{location}}</li>
        <li><strong>Start Date:</strong> {{start_date}}</li>
    </ul>
    
    <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Compensation</h3>
    <ul style="margin-bottom: 20px;">
        <li><strong>Base Salary:</strong> {{salary}} per year</li>
        <li><strong>Signing Bonus:</strong> {{bonus}}</li>
        <li><strong>Equity:</strong> {{equity}}</li>
    </ul>
    
    <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Benefits</h3>
    <p style="margin-bottom: 20px;">
        As an employee, you will be eligible for our comprehensive benefits package, including:
    </p>
    <ul style="margin-bottom: 20px;">
        <li>Health, dental, and vision insurance</li>
        <li>401(k) retirement plan with company match</li>
        <li>Paid time off and holidays</li>
        <li>Professional development opportunities</li>
    </ul>
    
    <p style="margin-bottom: 20px;">
        This offer is contingent upon successful completion of background verification and 
        reference checks. This offer will expire on {{expiry_date}}.
    </p>
    
    <p style="margin-bottom: 20px;">
        We are excited about the possibility of you joining our team and contributing to our success. 
        Please confirm your acceptance by signing below.
    </p>
    
    <p style="margin-bottom: 40px;">
        Sincerely,<br>
        <strong>{{company_name}} Hiring Team</strong>
    </p>
    
    <div style="border-top: 2px solid #333; padding-top: 20px; margin-top: 40px;">
        <h3 style="color: #333;">Acceptance</h3>
        <p>I, {{candidate_name}}, accept the offer of employment as described above.</p>
        <div style="margin-top: 30px;">
            <p>Signature: ___________________________ Date: _______________</p>
        </div>
    </div>
</div>
        `.trim();
    }

    /**
     * Submit a counter-offer (candidate negotiation)
     */
    async submitCounterOffer(
        offerId: string,
        tenantId: string,
        data: {
            requestedSalary?: number;
            requestedBonus?: number;
            requestedEquity?: string;
            requestedStartDate?: Date;
            notes?: string;
        },
    ) {
        const offer = await this.findOne(offerId, tenantId);

        if (offer.status !== 'PENDING_APPROVAL' && offer.status !== 'APPROVED') {
            throw new NotFoundException('Offer is not in a negotiable state');
        }

        // Log the counter-offer
        await this.prisma.activityLog.create({
            data: {
                action: 'OFFER_COUNTER_SUBMITTED',
                description: 'Candidate submitted counter-offer',
                applicationId: offer.applicationId,
                candidateId: offer.application.candidateId,
                metadata: {
                    offerId,
                    counterOfferId: `counter_${Date.now()}`,
                    originalOffer: {
                        salary: offer.salary,
                        bonus: offer.bonus,
                        equity: offer.equity,
                        startDate: offer.startDate,
                    },
                    counterOffer: {
                        requestedSalary: data.requestedSalary,
                        requestedBonus: data.requestedBonus,
                        requestedEquity: data.requestedEquity,
                        requestedStartDate: data.requestedStartDate,
                    },
                    notes: data.notes,
                    submittedAt: new Date().toISOString(),
                    negotiationStatus: 'PENDING_REVIEW',
                },
            },
        });

        // Keep offer in PENDING_APPROVAL status (negotiation tracked via activity log)

        // Notify recruiter/hiring manager
        const recipientIds = [];
        if (offer.application.job.recruiterId) recipientIds.push(offer.application.job.recruiterId);
        if (offer.application.job.hiringManagerId) recipientIds.push(offer.application.job.hiringManagerId);

        if (recipientIds.length > 0) {
            await this.notificationsService.notifyOfferStatusChange(
                offer,
                'PENDING_APPROVAL',
                recipientIds,
                tenantId,
            );
        }

        return {
            success: true,
            message: 'Counter-offer submitted successfully',
            negotiationStatus: 'PENDING_REVIEW',
        };
    }

    /**
     * Respond to a counter-offer
     */
    async respondToCounterOffer(
        offerId: string,
        tenantId: string,
        userId: string,
        data: {
            action: 'ACCEPT' | 'REJECT' | 'COUNTER';
            revisedSalary?: number;
            revisedBonus?: number;
            revisedEquity?: string;
            revisedStartDate?: Date;
            notes?: string;
        },
    ) {
        const offer = await this.findOne(offerId, tenantId);

        // Check if there's a pending counter-offer for this offer
        const pendingCounter = await this.prisma.activityLog.findFirst({
            where: {
                action: 'OFFER_COUNTER_SUBMITTED',
                metadata: {
                    path: ['offerId'],
                    equals: offerId,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!pendingCounter) {
            throw new NotFoundException('No counter-offer found for this offer');
        }

        // Get the latest counter-offer
        const latestCounter = await this.prisma.activityLog.findFirst({
            where: {
                action: 'OFFER_COUNTER_SUBMITTED',
                metadata: { path: ['offerId'], equals: offerId },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!latestCounter) {
            throw new NotFoundException('No counter-offer found');
        }

        const counterMetadata = latestCounter.metadata as any;

        if (data.action === 'ACCEPT') {
            // Accept the counter-offer - update offer with requested terms
            const updateData: any = { status: 'APPROVED' };
            if (counterMetadata.counterOffer.requestedSalary) {
                updateData.salary = counterMetadata.counterOffer.requestedSalary;
            }
            if (counterMetadata.counterOffer.requestedBonus) {
                updateData.bonus = counterMetadata.counterOffer.requestedBonus;
            }
            if (counterMetadata.counterOffer.requestedEquity) {
                updateData.equity = counterMetadata.counterOffer.requestedEquity;
            }
            if (counterMetadata.counterOffer.requestedStartDate) {
                updateData.startDate = new Date(counterMetadata.counterOffer.requestedStartDate);
            }

            await this.prisma.offer.update({
                where: { id: offerId },
                data: updateData,
            });

            // Log acceptance
            await this.prisma.activityLog.create({
                data: {
                    action: 'OFFER_COUNTER_ACCEPTED',
                    description: 'Counter-offer accepted by employer',
                    applicationId: offer.applicationId,
                    candidateId: offer.application.candidateId,
                    userId,
                    metadata: {
                        offerId,
                        acceptedTerms: updateData,
                        notes: data.notes,
                    },
                },
            });

        } else if (data.action === 'REJECT') {
            // Log rejection
            await this.prisma.activityLog.create({
                data: {
                    action: 'OFFER_COUNTER_REJECTED',
                    description: 'Counter-offer rejected by employer',
                    applicationId: offer.applicationId,
                    candidateId: offer.application.candidateId,
                    userId,
                    metadata: {
                        offerId,
                        notes: data.notes,
                    },
                },
            });

            // Update offer back to sent status
            await this.prisma.offer.update({
                where: { id: offerId },
                data: { status: 'SENT' },
            });

        } else if (data.action === 'COUNTER') {
            // Employer submits a revised offer
            const updateData: any = {};
            if (data.revisedSalary) updateData.salary = data.revisedSalary;
            if (data.revisedBonus) updateData.bonus = data.revisedBonus;
            if (data.revisedEquity) updateData.equity = data.revisedEquity;
            if (data.revisedStartDate) updateData.startDate = data.revisedStartDate;

            if (Object.keys(updateData).length > 0) {
                await this.prisma.offer.update({
                    where: { id: offerId },
                    data: updateData,
                });
            }

            // Log the revised offer
            await this.prisma.activityLog.create({
                data: {
                    action: 'OFFER_REVISED',
                    description: 'Employer submitted revised offer',
                    applicationId: offer.applicationId,
                    candidateId: offer.application.candidateId,
                    userId,
                    metadata: {
                        offerId,
                        previousTerms: {
                            salary: offer.salary,
                            bonus: offer.bonus,
                            equity: offer.equity,
                            startDate: offer.startDate,
                        },
                        revisedTerms: updateData,
                        notes: data.notes,
                        revision: (counterMetadata.revision || 0) + 1,
                    },
                },
            });

            // Keep status as negotiating
            await this.prisma.offer.update({
                where: { id: offerId },
                data: { status: 'SENT' },
            });
        }

        return {
            success: true,
            action: data.action,
            offerStatus: data.action === 'ACCEPT' ? 'APPROVED' : 'SENT',
        };
    }

    /**
     * Get negotiation history for an offer
     */
    async getNegotiationHistory(offerId: string, tenantId: string) {
        const offer = await this.findOne(offerId, tenantId);

        const activities = await this.prisma.activityLog.findMany({
            where: {
                applicationId: offer.applicationId,
                action: {
                    in: [
                        'OFFER_CREATED',
                        'OFFER_SENT',
                        'OFFER_COUNTER_SUBMITTED',
                        'OFFER_COUNTER_ACCEPTED',
                        'OFFER_COUNTER_REJECTED',
                        'OFFER_REVISED',
                        'OFFER_ACCEPTED',
                        'OFFER_DECLINED',
                    ],
                },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return {
            offerId,
            currentStatus: offer.status,
            currentTerms: {
                salary: offer.salary,
                bonus: offer.bonus,
                equity: offer.equity,
                startDate: offer.startDate,
            },
            negotiationCount: activities.filter(a => 
                a.action === 'OFFER_COUNTER_SUBMITTED' || a.action === 'OFFER_REVISED'
            ).length,
            history: activities.map(activity => ({
                id: activity.id,
                action: activity.action,
                description: activity.description,
                timestamp: activity.createdAt,
                user: activity.user,
                details: activity.metadata,
            })),
        };
    }

    /**
     * Get offer comparison (original vs current terms)
     */
    async getOfferComparison(offerId: string, tenantId: string) {
        const offer = await this.findOne(offerId, tenantId);

        // Get the original offer creation
        const originalActivity = await this.prisma.activityLog.findFirst({
            where: {
                applicationId: offer.applicationId,
                action: 'OFFER_CREATED',
            },
            orderBy: { createdAt: 'asc' },
        });

        const originalTerms = (originalActivity?.metadata as any)?.originalTerms || {
            salary: offer.salary,
            bonus: offer.bonus,
            equity: offer.equity,
            startDate: offer.startDate,
        };

        const currentTerms = {
            salary: offer.salary,
            bonus: offer.bonus,
            equity: offer.equity,
            startDate: offer.startDate,
        };

        // Calculate differences
        const changes: any[] = [];
        
        if (originalTerms.salary !== currentTerms.salary) {
            const diff = Number(currentTerms.salary) - Number(originalTerms.salary);
            changes.push({
                field: 'salary',
                original: originalTerms.salary,
                current: currentTerms.salary,
                difference: diff,
                percentChange: originalTerms.salary ? ((diff / Number(originalTerms.salary)) * 100).toFixed(1) : null,
            });
        }

        if (originalTerms.bonus !== currentTerms.bonus) {
            changes.push({
                field: 'bonus',
                original: originalTerms.bonus,
                current: currentTerms.bonus,
            });
        }

        if (originalTerms.equity !== currentTerms.equity) {
            changes.push({
                field: 'equity',
                original: originalTerms.equity,
                current: currentTerms.equity,
            });
        }

        if (originalTerms.startDate?.toString() !== currentTerms.startDate?.toString()) {
            changes.push({
                field: 'startDate',
                original: originalTerms.startDate,
                current: currentTerms.startDate,
            });
        }

        return {
            offerId,
            hasChanges: changes.length > 0,
            originalTerms,
            currentTerms,
            changes,
        };
    }
}
