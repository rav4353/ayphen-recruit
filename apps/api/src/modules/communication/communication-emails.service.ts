import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { EmailDirection, EmailStatus, Prisma } from '@prisma/client';

export class SendEmailDto {
    to: string;
    subject: string;
    body: string;
    candidateId: string;
    cc?: string;
    bcc?: string;
}

@Injectable()
export class CommunicationEmailsService {
    private readonly logger = new Logger(CommunicationEmailsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    async sendEmail(userId: string, tenantId: string, dto: SendEmailDto) {
        const { to, subject, body, candidateId, cc, bcc } = dto;

        // 1. Verify candidate belongs to tenant
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate || candidate.tenantId !== tenantId) {
            throw new NotFoundException('Candidate not found');
        }

        // 2. Create Email Record (DRAFT)
        const email = await this.prisma.email.create({
            data: {
                to,
                from: 'system', // Will be updated with actual sender from EmailService config if possible, or we assume logged in user
                subject,
                body,
                direction: EmailDirection.OUTBOUND,
                status: EmailStatus.DRAFT,
                candidateId,
                userId,
                cc,
                bcc,
                tenant: { connect: { id: tenantId } },
            } as any,
        });

        // 3. Send via EmailService
        // Note: EmailService handles tenant-specific SMTP configuration
        try {
            const sent = await this.emailService.sendEmail({
                to,
                subject,
                html: body,
                tenantId,
                bcc,
            });

            if (sent) {
                // Update to SENT
                return this.prisma.email.update({
                    where: { id: email.id },
                    data: {
                        status: EmailStatus.SENT,
                        sentAt: new Date(),
                        // We could update 'from' here if EmailService returned the used 'from' address
                    },
                });
            } else {
                // Update to FAILED
                return this.prisma.email.update({
                    where: { id: email.id },
                    data: { status: EmailStatus.FAILED },
                });
            }
        } catch (error) {
            this.logger.error(`Failed to send email ${email.id}`, error);
            await this.prisma.email.update({
                where: { id: email.id },
                data: { status: EmailStatus.FAILED },
            });
            throw error;
        }
    }

    async getEmailsForCandidate(candidateId: string, tenantId: string) {
        // Check candidate existence/tenant
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate || candidate.tenantId !== tenantId) {
            throw new NotFoundException('Candidate not found');
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

    async sendBulkEmail(userId: string, tenantId: string, data: { ids: string[]; subject: string; message: string }) {
        const { ids, subject, message } = data;

        const candidates = await this.prisma.candidate.findMany({
            where: {
                id: { in: ids },
                tenantId
            },
        });

        let sentCount = 0;

        // In a real production system, this should be offloaded to a queue (e.g., Bull/Redis)
        // For MVP, we process sequentially or in parallel batches
        for (const candidate of candidates) {
            try {
                // Simple variable substitution
                const personalizedBody = message.replace(/{{firstName}}/g, candidate.firstName || '')
                    .replace(/{{lastName}}/g, candidate.lastName || '');

                // Reuse existing sendEmail logic but wrapped to avoid total failure
                await this.sendEmail(userId, tenantId, {
                    to: candidate.email,
                    subject,
                    body: personalizedBody,
                    candidateId: candidate.id
                });
                sentCount++;
            } catch (error) {
                this.logger.error(`Failed to send bulk email to candidate ${candidate.id}`, error);
                // Continue with next candidate
            }
        }

        return { count: sentCount, total: candidates.length };
    }

    async processInboundEmail(payload: { from: string; to: string; subject: string; body: string; tenantId?: string }) {
        const { from, to, subject, body, tenantId } = payload;

        // Find Candidate
        // If tenantId provides, search within tenant.
        // Otherwise, search globally (risky if email shared, but acceptable for MVP/Demo)
        let candidate;
        if (tenantId) {
            candidate = await this.prisma.candidate.findFirst({
                where: { email: from, tenantId },
            });
        } else {
            // Basic heuristic: find most recently active candidate or just the first one
            candidate = await this.prisma.candidate.findFirst({
                where: { email: from },
            });
        }

        if (!candidate) {
            this.logger.warn(`Received email from unknown candidate: ${from}`);
            return { processed: false, reason: 'Candidate not found' };
        }

        // Create Email Record
        const email = await this.prisma.email.create({
            data: {
                from,
                to,
                subject,
                body,
                direction: EmailDirection.INBOUND,
                status: EmailStatus.RECEIVED,
                candidate: { connect: { id: candidate.id } },
                tenant: { connect: { id: candidate.tenantId } },
                sentAt: new Date(),
            } as any,
        });

        this.logger.log(`Processed inbound email from ${from} for candidate ${candidate.id}`);
        return { processed: true, emailId: email.id };
    }
    async getThreads(tenantId: string) {
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

        const threads = candidates.map((c: any) => ({
            candidateId: c.id,
            candidateName: `${c.firstName} ${c.lastName}`,
            candidateEmail: c.email,
            lastMessage: c.emails?.[0] || null
        })).sort((a: any, b: any) => {
            return new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime();
        });

        return threads;
    }
}
