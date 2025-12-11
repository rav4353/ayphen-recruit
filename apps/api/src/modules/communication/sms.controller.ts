import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { SmsService } from '../../common/services/sms.service';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConfigureSmsDto {
    @IsEnum(['TWILIO', 'MSG91', 'TEXTLOCAL'])
    provider: 'TWILIO' | 'MSG91' | 'TEXTLOCAL';

    @IsString()
    accountSid: string;

    @IsString()
    authToken: string;

    @IsString()
    fromNumber: string;

    @IsOptional()
    @IsString()
    webhookUrl?: string;
}

class SendSmsDto {
    @IsString()
    to: string;

    @IsString()
    body: string;

    @IsOptional()
    @IsString()
    candidateId?: string;

    @IsOptional()
    @IsString()
    mediaUrl?: string;
}

class BulkSmsRecipient {
    @IsString()
    phone: string;

    @IsString()
    body: string;

    @IsOptional()
    @IsString()
    candidateId?: string;
}

class SendBulkSmsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkSmsRecipient)
    recipients: BulkSmsRecipient[];
}

class SaveTemplateDto {
    @IsString()
    name: string;

    @IsString()
    content: string;
}

@ApiTags('sms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}

    @Get('settings')
    @ApiOperation({ summary: 'Get SMS provider settings' })
    async getSettings(@Req() req: any) {
        const tenantId = req.user.tenantId;
        const settings = await this.smsService.getSettings(tenantId);
        return ApiResponse.success(settings, 'SMS settings retrieved');
    }

    @Post('configure')
    @ApiOperation({ summary: 'Configure SMS provider' })
    async configure(@Body() dto: ConfigureSmsDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        await this.smsService.saveConfig(tenantId, dto);
        return ApiResponse.success(null, 'SMS provider configured successfully');
    }

    @Post('send')
    @ApiOperation({ summary: 'Send SMS to a single recipient' })
    async sendSms(@Body() dto: SendSmsDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const result = await this.smsService.sendSms({
            tenantId,
            to: dto.to,
            body: dto.body,
            candidateId: dto.candidateId,
            mediaUrl: dto.mediaUrl,
        });
        
        if (result.success) {
            return ApiResponse.success({ messageId: result.messageId }, 'SMS sent successfully');
        } else {
            return ApiResponse.error(result.error || 'Failed to send SMS');
        }
    }

    @Post('send-bulk')
    @ApiOperation({ summary: 'Send SMS to multiple recipients' })
    async sendBulkSms(@Body() dto: SendBulkSmsDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const result = await this.smsService.sendBulkSms(tenantId, dto.recipients);
        return ApiResponse.success(result, `Sent ${result.sent}/${result.total} SMS messages`);
    }

    @Get('templates')
    @ApiOperation({ summary: 'Get SMS templates' })
    async getTemplates(@Req() req: any) {
        const tenantId = req.user.tenantId;
        const templates = await this.smsService.getTemplates(tenantId);
        return ApiResponse.success(templates, 'SMS templates retrieved');
    }

    @Post('templates')
    @ApiOperation({ summary: 'Save SMS template' })
    async saveTemplate(@Body() dto: SaveTemplateDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        await this.smsService.saveTemplate(tenantId, dto.name, dto.content);
        return ApiResponse.success(null, 'SMS template saved');
    }
}
