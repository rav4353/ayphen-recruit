import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * Get all notifications for the current user
     */
    @Get()
    async getAll(
        @Request() req,
        @Query('read') read?: string,
        @Query('type') type?: string,
    ) {
        const filters: any = {};
        if (read !== undefined) {
            filters.read = read === 'true';
        }
        if (type) {
            filters.type = type;
        }

        const userId = req.user.sub || req.user.id;
        const notifications = await this.notificationsService.findAllForUser(
            userId,
            filters,
        );

        return {
            success: true,
            data: notifications,
        };
    }

    /**
     * Get unread notification count
     */
    @Get('count')
    async getUnreadCount(@Request() req) {
        const userId = req.user.sub || req.user.id;
        const count = await this.notificationsService.getUnreadCount(userId);
        return {
            success: true,
            data: { count },
        };
    }

    /**
     * Get notification preferences
     */
    @Get('preferences')
    async getPreferences(@Request() req) {
        const userId = req.user.sub || req.user.id;
        const preferences = await this.notificationsService.getPreferences(userId);
        return {
            success: true,
            data: preferences,
        };
    }

    /**
     * Update notification preferences
     */
    @Patch('preferences')
    async updatePreferences(
        @Request() req,
        @Body() body: Record<string, boolean>,
    ) {
        const userId = req.user.sub || req.user.id;
        const preferences = await this.notificationsService.updatePreferences(
            userId,
            body,
        );
        return {
            success: true,
            data: preferences,
        };
    }

    /**
     * Mark a notification as read
     */
    @Patch(':id/read')
    async markAsRead(@Request() req, @Param('id') id: string) {
        const userId = req.user.sub || req.user.id;
        await this.notificationsService.markAsRead(id, userId);
        return {
            success: true,
            message: 'Notification marked as read',
        };
    }

    /**
     * Mark all notifications as read
     */
    @Post('read-all')
    async markAllAsRead(@Request() req) {
        const userId = req.user.sub || req.user.id;
        await this.notificationsService.markAllAsRead(userId);
        return {
            success: true,
            message: 'All notifications marked as read',
        };
    }

    /**
     * Delete a notification
     */
    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        const userId = req.user.sub || req.user.id;
        await this.notificationsService.delete(id, userId);
        return {
            success: true,
            message: 'Notification deleted',
        };
    }

    /**
     * Clear all notifications
     */
    @Delete()
    async clearAll(@Request() req) {
        const userId = req.user.sub || req.user.id;
        await this.notificationsService.clearAll(userId);
        return {
            success: true,
            message: 'All notifications cleared',
        };
    }
}

