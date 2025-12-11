import { PrismaService } from '../../prisma/prisma.service';
import { DocuSignService } from './providers/docusign.service';
import { ConfigureESignatureDto, ConnectESignatureDto, SendForSignatureDto, ESignatureStatusResponse } from './dto/esignature.dto';
export declare class ESignatureService {
    private readonly prisma;
    private readonly docuSign;
    private readonly logger;
    constructor(prisma: PrismaService, docuSign: DocuSignService);
    getAuthUrl(tenantId: string): Promise<string>;
    configureSettings(tenantId: string, dto: ConfigureESignatureDto): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.ESignatureProvider;
        isConfigured: boolean;
    }>;
    connect(tenantId: string, dto: ConnectESignatureDto): Promise<{
        success: boolean;
        accountId: string;
    }>;
    getSettings(tenantId: string): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.ESignatureProvider;
        isConfigured: boolean;
        clientId: string | null;
        accountId: string | null;
        baseUrl: string | null;
    } | null>;
    private getValidAccessToken;
    sendForSignature(tenantId: string, dto: SendForSignatureDto): Promise<{
        envelopeId: string;
        externalEnvelopeId: string;
        status: string;
    }>;
    getEnvelopeStatus(tenantId: string, envelopeId: string): Promise<ESignatureStatusResponse>;
    getEmbeddedSigningUrl(tenantId: string, envelopeId: string, returnUrl: string): Promise<{
        url: string;
        expiresAt: string;
    }>;
    voidEnvelope(tenantId: string, envelopeId: string, reason: string): Promise<{
        success: boolean;
    }>;
    handleWebhook(payload: any): Promise<void>;
    private mapDocuSignStatus;
    private generateOfferPdf;
}
