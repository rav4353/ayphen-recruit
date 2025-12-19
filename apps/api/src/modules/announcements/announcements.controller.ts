import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Get('active')
    @ApiOperation({ summary: 'Get active announcements for the current user' })
    async getActiveAnnouncements(@CurrentUser() user: JwtPayload) {
        const announcements = await this.announcementsService.getActiveAnnouncements(user.sub, user.tenantId);
        return { success: true, data: announcements };
    }

    @Post(':id/read')
    @ApiOperation({ summary: 'Mark an announcement as read/dismissed' })
    async markAsRead(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string
    ) {
        await this.announcementsService.markAsRead(user.sub, id);
        return { success: true };
    }
}
