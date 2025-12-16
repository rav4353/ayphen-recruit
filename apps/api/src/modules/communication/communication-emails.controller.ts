import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommunicationEmailsService, SendEmailDto } from './communication-emails.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class CommunicationEmailsController {
    constructor(private readonly emailsService: CommunicationEmailsService) { }

    @Post('send')
    async sendEmail(
        @CurrentUser() user: JwtPayload,
        @Body() dto: SendEmailDto,
    ) {
        return this.emailsService.sendEmail(user.sub, user.tenantId, dto);
    }

    @Post('bulk')
    async sendBulkEmail(
        @CurrentUser() user: JwtPayload,
        @Body() body: { ids: string[]; subject: string; message: string },
    ) {
        return this.emailsService.sendBulkEmail(user.sub, user.tenantId, body);
    }

    @Get('candidate/:candidateId')
    async getEmails(
        @CurrentUser() user: JwtPayload,
        @Param('candidateId') candidateId: string,
    ) {
        return this.emailsService.getEmailsForCandidate(candidateId, user.tenantId);
    }

    @Get('threads')
    async getThreads(@CurrentUser() user: JwtPayload) {
        return this.emailsService.getThreads(user.tenantId);
    }
}
