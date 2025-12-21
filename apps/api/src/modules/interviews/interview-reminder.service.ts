import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';

@Injectable()
export class InterviewReminderService {
    private readonly logger = new Logger(InterviewReminderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly smsService: SmsService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async checkUpcomingInterviews() {
        this.logger.log('Checking for upcoming interviews...');

        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        try {
            const interviews = await this.prisma.interview.findMany({
                where: {
                    status: 'SCHEDULED',
                    reminderSent: false,
                    scheduledAt: {
                        gte: now,
                        lte: next24Hours,
                    },
                },
                include: {
                    application: {
                        include: {
                            candidate: {
                                include: { tenant: true }
                            },
                            job: true,
                        },
                    },
                    interviewer: true,
                },
            });

            this.logger.log(`Found ${interviews.length} interviews to remind.`);

            for (const interview of interviews) {
                await this.sendReminders(interview);
            }
        } catch (error) {
            this.logger.error('Error checking upcoming interviews', error);
        }
    }

    private async sendReminders(interview: any) {
        const { application, interviewer, scheduledAt, meetingLink } = interview;
        const { candidate, job } = application;
        const tenantId = application.candidate.tenantId;

        // Check if SMS reminders are enabled for this tenant
        const smsEnabled = await this.isSmsReminderEnabled(tenantId);

        // Send Email to Candidate
        try {
            await this.emailService.sendEmail({
                to: candidate.email,
                subject: `Reminder: Interview for ${job.title} at ${application.candidate.tenant?.name || 'Ayphen'}`,
                html: `
                <p>Hi ${candidate.firstName},</p>
                <p>This is a reminder about your upcoming interview for the <strong>${job.title}</strong> position.</p>
                <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
                ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
                <p>Good luck!</p>
                `,
                tenantId
            });
            this.logger.log(`Email reminder sent to candidate ${candidate.email}`);
        } catch (e) {
            this.logger.error(`Failed to send email reminder to candidate ${candidate.email}`, e);
        }

        // Send SMS to Candidate (if enabled and phone available)
        if (smsEnabled && candidate.phone) {
            try {
                const formattedTime = new Date(scheduledAt).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
                const smsBody = `Hi ${candidate.firstName}, reminder: Your interview for ${job.title} is scheduled for ${formattedTime}.${meetingLink ? ` Join: ${meetingLink}` : ''} Good luck!`;
                
                const result = await this.smsService.sendSms({
                    to: candidate.phone,
                    body: smsBody,
                    tenantId,
                    candidateId: candidate.id,
                });
                
                if (result.success) {
                    this.logger.log(`SMS reminder sent to candidate ${candidate.phone}`);
                } else {
                    this.logger.warn(`SMS reminder failed for candidate ${candidate.phone}: ${result.error}`);
                }
            } catch (e) {
                this.logger.error(`Failed to send SMS reminder to candidate ${candidate.phone}`, e);
            }
        }

        // Send Email to Interviewer
        try {
            await this.emailService.sendEmail({
                to: interviewer.email,
                subject: `Reminder: Interview with ${candidate.firstName} ${candidate.lastName}`,
                html: `
                <p>Hi ${interviewer.firstName},</p>
                <p>This is a reminder about your upcoming interview with <strong>${candidate.firstName} ${candidate.lastName}</strong> for the <strong>${job.title}</strong> position.</p>
                <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
                ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
                <p>Please review the candidate's profile and resume before the interview.</p>
                `,
                tenantId: interviewer.tenantId
            });
            this.logger.log(`Email reminder sent to interviewer ${interviewer.email}`);
        } catch (e) {
            this.logger.error(`Failed to send email reminder to interviewer ${interviewer.email}`, e);
        }

        // Send SMS to Interviewer (if enabled and phone available)
        if (smsEnabled && interviewer.phone) {
            try {
                const formattedTime = new Date(scheduledAt).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
                const smsBody = `Reminder: Interview with ${candidate.firstName} ${candidate.lastName} for ${job.title} at ${formattedTime}.${meetingLink ? ` Link: ${meetingLink}` : ''}`;
                
                const result = await this.smsService.sendSms({
                    to: interviewer.phone,
                    body: smsBody,
                    tenantId: interviewer.tenantId,
                });
                
                if (result.success) {
                    this.logger.log(`SMS reminder sent to interviewer ${interviewer.phone}`);
                } else {
                    this.logger.warn(`SMS reminder failed for interviewer ${interviewer.phone}: ${result.error}`);
                }
            } catch (e) {
                this.logger.error(`Failed to send SMS reminder to interviewer ${interviewer.phone}`, e);
            }
        }

        // Update reminderSent flag
        await this.prisma.interview.update({
            where: { id: interview.id },
            data: { reminderSent: true },
        });
    }

    /**
     * Check if SMS reminders are enabled for a tenant
     */
    private async isSmsReminderEnabled(tenantId: string): Promise<boolean> {
        try {
            // Check if SMS is configured
            const smsSettings = await this.smsService.getSettings(tenantId);
            if (!smsSettings?.isConfigured) {
                return false;
            }

            // Check tenant settings for SMS reminder preference
            const setting = await this.prisma.setting.findUnique({
                where: { tenantId_key: { tenantId, key: 'interview_sms_reminders_enabled' } },
            });

            // Default to true if SMS is configured but no explicit setting
            return setting?.value !== false;
        } catch {
            return false;
        }
    }

    /**
     * Send immediate SMS reminder for a specific interview
     */
    async sendImmediateSmsReminder(interviewId: string): Promise<{ success: boolean; message: string }> {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true,
                    },
                },
                interviewer: true,
            },
        });

        if (!interview) {
            return { success: false, message: 'Interview not found' };
        }

        const { application, scheduledAt, meetingLink } = interview;
        const { candidate, job } = application;
        const tenantId = candidate.tenantId;

        if (!candidate.phone) {
            return { success: false, message: 'Candidate does not have a phone number' };
        }

        const formattedTime = new Date(scheduledAt).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

        const smsBody = `Hi ${candidate.firstName}, reminder: Your interview for ${job.title} is scheduled for ${formattedTime}.${meetingLink ? ` Join: ${meetingLink}` : ''} Good luck!`;

        const result = await this.smsService.sendSms({
            to: candidate.phone,
            body: smsBody,
            tenantId,
            candidateId: candidate.id,
        });

        return {
            success: result.success,
            message: result.success ? 'SMS reminder sent successfully' : result.error || 'Failed to send SMS',
        };
    }
}
