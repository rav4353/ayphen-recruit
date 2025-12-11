import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, RawBodyRequest, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ESignatureService } from './esignature.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ConfigureESignatureDto, ConnectESignatureDto, SendForSignatureDto } from './dto/esignature.dto';

@ApiTags('esignature')
@Controller('esignature')
export class ESignatureController {
    constructor(private readonly esignatureService: ESignatureService) { }

    @Get('auth-url')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get OAuth URL for e-signature provider' })
    async getAuthUrl(@Req() req: any) {
        const tenantId = req.user.tenantId;
        const url = await this.esignatureService.getAuthUrl(tenantId);
        return ApiResponse.success({ url }, 'Authorization URL generated');
    }

    @Post('configure')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Configure e-signature provider settings' })
    async configure(@Body() dto: ConfigureESignatureDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.configureSettings(tenantId, dto);
        return ApiResponse.success(result, 'E-signature configured');
    }

    @Post('connect')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Connect to e-signature provider using OAuth code' })
    async connect(@Body() dto: ConnectESignatureDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.connect(tenantId, dto);
        return ApiResponse.success(result, 'E-signature connected');
    }

    @Get('settings')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get e-signature settings' })
    async getSettings(@Req() req: any) {
        const tenantId = req.user.tenantId;
        const settings = await this.esignatureService.getSettings(tenantId);
        return ApiResponse.success(settings, 'Settings retrieved');
    }

    @Post('send')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Send an offer for e-signature' })
    async sendForSignature(@Body() dto: SendForSignatureDto, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.sendForSignature(tenantId, dto);
        return ApiResponse.success(result, 'Offer sent for signature');
    }

    @Get('envelopes/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get envelope status' })
    async getEnvelopeStatus(@Param('id') envelopeId: string, @Req() req: any) {
        const tenantId = req.user.tenantId;
        const status = await this.esignatureService.getEnvelopeStatus(tenantId, envelopeId);
        return ApiResponse.success(status, 'Envelope status retrieved');
    }

    @Post('envelopes/:id/embedded-signing')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get embedded signing URL' })
    async getEmbeddedSigningUrl(
        @Param('id') envelopeId: string,
        @Body('returnUrl') returnUrl: string,
        @Req() req: any
    ) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.getEmbeddedSigningUrl(tenantId, envelopeId, returnUrl);
        return ApiResponse.success(result, 'Embedded signing URL generated');
    }

    @Put('envelopes/:id/void')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Void an envelope' })
    async voidEnvelope(
        @Param('id') envelopeId: string,
        @Body('reason') reason: string,
        @Req() req: any
    ) {
        const tenantId = req.user.tenantId;
        const result = await this.esignatureService.voidEnvelope(tenantId, envelopeId, reason);
        return ApiResponse.success(result, 'Envelope voided');
    }

    @Post('webhook')
    @ApiOperation({ summary: 'DocuSign webhook endpoint' })
    async handleWebhook(@Body() payload: any, @Headers('x-docusign-signature-1') signature: string) {
        // In production, verify the webhook signature
        await this.esignatureService.handleWebhook(payload);
        return { success: true };
    }
}
