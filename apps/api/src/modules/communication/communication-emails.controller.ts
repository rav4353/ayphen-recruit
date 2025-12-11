import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommunicationEmailsService, SendEmailDto } from './communication-emails.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class CommunicationEmailsController {
    constructor(private readonly emailsService: CommunicationEmailsService) { }

    @Post('send')
    async sendEmail(
        @CurrentUser() user: User,
        @Body() dto: SendEmailDto,
    ) {
        return this.emailsService.sendEmail(user.id, user.tenantId, dto);
    }

    @Post('bulk')
    async sendBulkEmail(
        @CurrentUser() user: User,
        @Body() body: { ids: string[]; subject: string; message: string },
    ) {
        return this.emailsService.sendBulkEmail(user.id, user.tenantId, body);
    }

    @Get('candidate/:candidateId')
    async getEmails(
        @CurrentUser() user: User,
        @Param('candidateId') candidateId: string,
    ) {
        return this.emailsService.getEmailsForCandidate(candidateId, user.tenantId);
    }

    @Get('threads')
    async getThreads(@CurrentUser() user: User) {
        return this.emailsService.getThreads(user.tenantId);
    }
}
