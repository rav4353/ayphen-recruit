import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    userId: string;
    tenantId: string;
}

export interface NotificationFilters {
    read?: boolean;
    type?: NotificationType;
    allowedTypes?: NotificationType[];
}

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a notification for a user
     */
    async create(data: CreateNotificationDto) {
        // Check user preferences before creating
        const preferences = await this.prisma.notificationPreference.findUnique({
            where: { userId: data.userId },
        });

        // If preferences exist, check if this type of notification is enabled
        if (preferences) {
            const shouldNotify = this.checkPreferences(preferences, data.type);
            if (!shouldNotify) {
                return null;
            }
        }

        return this.prisma.notification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                metadata: data.metadata,
                userId: data.userId,
                tenantId: data.tenantId,
            },
        });
    }

    /**
     * Create notifications for multiple users
     */
    async createMany(notifications: CreateNotificationDto[]) {
        const results = [];
        for (const notification of notifications) {
            const result = await this.create(notification);
            if (result) {
                results.push(result);
            }
        }
        return results;
    }

    /**
     * Get all notifications for a user
     */
    async findAllForUser(userId: string, filters?: NotificationFilters) {
        const where: any = { userId };

        if (filters?.read !== undefined) {
            where.read = filters.read;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.allowedTypes?.length) {
            where.type = where.type
                ? where.type
                : { in: filters.allowedTypes };
        }

        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string, allowedTypes?: NotificationType[]) {
        return this.prisma.notification.count({
            where: {
                userId,
                read: false,
                ...(allowedTypes?.length ? { type: { in: allowedTypes } } : {}),
            },
        });
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }

    /**
     * Delete a notification
     */
    async delete(id: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    /**
     * Clear all notifications for a user
     */
    async clearAll(userId: string) {
        return this.prisma.notification.deleteMany({
            where: { userId },
        });
    }

    /**
     * Get notification preferences for a user
     */
    async getPreferences(userId: string) {
        let preferences = await this.prisma.notificationPreference.findUnique({
            where: { userId },
        });

        // Create default preferences if not exist
        if (!preferences) {
            preferences = await this.prisma.notificationPreference.create({
                data: { userId },
            });
        }

        return preferences;
    }

    /**
     * Update notification preferences for a user
     */
    async updatePreferences(userId: string, data: Partial<{
        newApplication: boolean;
        applicationStageChange: boolean;
        interviewScheduled: boolean;
        interviewReminder: boolean;
        interviewFeedback: boolean;
        offerCreated: boolean;
        offerApproval: boolean;
        offerAccepted: boolean;
        offerDeclined: boolean;
        jobApproval: boolean;
        jobPublished: boolean;
        slaAtRisk: boolean;
        slaOverdue: boolean;
        approvalRequests: boolean;
        onboardingUpdates: boolean;
        bgvUpdates: boolean;
        systemAlerts: boolean;
        emailEnabled: boolean;
        pushEnabled: boolean;
    }>) {
        return this.prisma.notificationPreference.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    }

    /**
     * Check if notification should be sent based on preferences
     */
    private checkPreferences(preferences: any, type: NotificationType): boolean {
        switch (type) {
            case 'APPLICATION':
                return preferences.newApplication || preferences.applicationStageChange;
            case 'INTERVIEW':
                return preferences.interviewScheduled || preferences.interviewReminder || preferences.interviewFeedback;
            case 'OFFER':
                return preferences.offerCreated || preferences.offerApproval || preferences.offerAccepted || preferences.offerDeclined;
            case 'JOB':
                return preferences.jobApproval || preferences.jobPublished;
            case 'SLA':
                return preferences.slaAtRisk || preferences.slaOverdue;
            case 'APPROVAL':
                return preferences.approvalRequests;
            case 'ONBOARDING':
                return preferences.onboardingUpdates;
            case 'BGV':
                return preferences.bgvUpdates;
            case 'SYSTEM':
                return preferences.systemAlerts;
            case 'MESSAGE':
                return true;
            default:
                return true;
        }
    }

    // ============================================
    // NOTIFICATION HELPER METHODS
    // ============================================

    /**
     * Notify about new application
     */
    async notifyNewApplication(application: any, recipientIds: string[], tenantId: string) {
        const notifications = recipientIds.map(userId => ({
            type: 'APPLICATION' as NotificationType,
            title: 'New Application',
            message: `${application.candidate.firstName} ${application.candidate.lastName} applied for ${application.job.title}`,
            link: `/candidates/${application.candidateId}`,
            metadata: { applicationId: application.id, jobId: application.jobId },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about interview scheduled
     */
    async notifyInterviewScheduled(interview: any, recipientIds: string[], tenantId: string) {
        const notifications = recipientIds.map(userId => ({
            type: 'INTERVIEW' as NotificationType,
            title: 'Interview Scheduled',
            message: `Interview with ${interview.candidate?.firstName || 'Candidate'} scheduled for ${new Date(interview.scheduledAt).toLocaleString()}`,
            link: `/interviews`,
            metadata: { interviewId: interview.id },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about offer status change
     */
    async notifyOfferStatusChange(offer: any, status: string, recipientIds: string[], tenantId: string) {
        const statusMessages: Record<string, string> = {
            PENDING_APPROVAL: 'Offer pending approval',
            APPROVED: 'Offer has been approved',
            SENT: 'Offer has been sent to candidate',
            ACCEPTED: 'Offer has been accepted!',
            DECLINED: 'Offer has been declined',
        };

        const notifications = recipientIds.map(userId => ({
            type: 'OFFER' as NotificationType,
            title: statusMessages[status] || `Offer ${status}`,
            message: `Offer for ${offer.candidate?.firstName || 'Candidate'} - ${offer.job?.title || 'Position'}`,
            link: `/offers/${offer.id}`,
            metadata: { offerId: offer.id, status },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about approval request
     */
    async notifyApprovalRequest(type: 'job' | 'offer', item: any, approverId: string, tenantId: string) {
        return this.create({
            type: 'APPROVAL',
            title: `${type === 'job' ? 'Job' : 'Offer'} Approval Required`,
            message: `${item.title || item.job?.title || 'Item'} requires your approval`,
            link: type === 'job' ? `/jobs/${item.id}` : `/offers/${item.id}`,
            metadata: { itemId: item.id, itemType: type },
            userId: approverId,
            tenantId,
        });
    }

    /**
     * Notify about SLA status
     */
    async notifySlaAlert(application: any, status: 'AT_RISK' | 'OVERDUE', recipientIds: string[], tenantId: string) {
        const isOverdue = status === 'OVERDUE';
        const notifications = recipientIds.map(userId => ({
            type: 'SLA' as NotificationType,
            title: isOverdue ? 'SLA Overdue' : 'SLA At Risk',
            message: `${application.candidate?.firstName || 'Candidate'} in ${application.currentStage?.name || 'stage'} - ${isOverdue ? 'SLA breached' : 'approaching deadline'}`,
            link: `/candidates/${application.candidateId}`,
            metadata: { applicationId: application.id, slaStatus: status },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about job status change
     */
    async notifyJobStatusChange(job: any, status: string, recipientIds: string[], tenantId: string) {
        const statusMessages: Record<string, string> = {
            APPROVED: 'Job has been approved',
            OPEN: 'Job is now live',
            CLOSED: 'Job has been closed',
            REJECTED: 'Job approval was rejected',
        };

        const notifications = recipientIds.map(userId => ({
            type: 'JOB' as NotificationType,
            title: statusMessages[status] || `Job ${status}`,
            message: `${job.title} - ${job.department || 'Position'}`,
            link: `/jobs/${job.id}`,
            metadata: { jobId: job.id, status },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about onboarding update
     */
    async notifyOnboardingUpdate(onboarding: any, message: string, recipientIds: string[], tenantId: string) {
        const notifications = recipientIds.map(userId => ({
            type: 'ONBOARDING' as NotificationType,
            title: 'Onboarding Update',
            message,
            link: `/onboarding/${onboarding.id}`,
            metadata: { onboardingId: onboarding.id },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }

    /**
     * Notify about BGV status change
     */
    async notifyBgvStatusChange(bgvCheck: any, status: string, recipientIds: string[], tenantId: string) {
        const statusMessages: Record<string, string> = {
            IN_PROGRESS: 'Background check in progress',
            COMPLETED: 'Background check completed',
            CLEAR: 'Background check cleared',
            CONSIDER: 'Background check requires review',
            FAILED: 'Background check failed',
        };

        const notifications = recipientIds.map(userId => ({
            type: 'BGV' as NotificationType,
            title: statusMessages[status] || 'Background Check Update',
            message: `Background check for ${bgvCheck.candidate?.firstName || 'Candidate'}`,
            link: `/candidates/${bgvCheck.candidateId}`,
            metadata: { bgvCheckId: bgvCheck.id, status },
            userId,
            tenantId,
        }));
        return this.createMany(notifications);
    }
}
