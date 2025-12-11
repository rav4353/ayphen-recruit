import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class InterviewReminderService {
    private readonly logger = new Logger(InterviewReminderService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
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

        // Send to Candidate
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
                tenantId: application.candidate.tenantId
            });
            this.logger.log(`Reminder sent to candidate ${candidate.email}`);
        } catch (e) {
            this.logger.error(`Failed to send reminder to candidate ${candidate.email}`, e);
        }

        // Send to Interviewer
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
            this.logger.log(`Reminder sent to interviewer ${interviewer.email}`);
        } catch (e) {
            this.logger.error(`Failed to send reminder to interviewer ${interviewer.email}`, e);
        }

        // Update reminderSent flag
        await this.prisma.interview.update({
            where: { id: interview.id },
            data: { reminderSent: true },
        });
    }
}
