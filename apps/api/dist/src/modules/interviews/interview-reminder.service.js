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
var InterviewReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
let InterviewReminderService = InterviewReminderService_1 = class InterviewReminderService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(InterviewReminderService_1.name);
    }
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
        }
        catch (error) {
            this.logger.error('Error checking upcoming interviews', error);
        }
    }
    async sendReminders(interview) {
        const { application, interviewer, scheduledAt, meetingLink } = interview;
        const { candidate, job } = application;
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
        }
        catch (e) {
            this.logger.error(`Failed to send reminder to candidate ${candidate.email}`, e);
        }
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
        }
        catch (e) {
            this.logger.error(`Failed to send reminder to interviewer ${interviewer.email}`, e);
        }
        await this.prisma.interview.update({
            where: { id: interview.id },
            data: { reminderSent: true },
        });
    }
};
exports.InterviewReminderService = InterviewReminderService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterviewReminderService.prototype, "checkUpcomingInterviews", null);
exports.InterviewReminderService = InterviewReminderService = InterviewReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], InterviewReminderService);
//# sourceMappingURL=interview-reminder.service.js.map