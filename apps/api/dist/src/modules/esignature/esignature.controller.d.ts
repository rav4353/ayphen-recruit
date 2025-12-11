import { ESignatureService } from './esignature.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ConfigureESignatureDto, ConnectESignatureDto, SendForSignatureDto } from './dto/esignature.dto';
export declare class ESignatureController {
    private readonly esignatureService;
    constructor(esignatureService: ESignatureService);
    getAuthUrl(req: any): Promise<ApiResponse<{
        url: string;
    }>>;
    configure(dto: ConfigureESignatureDto, req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.ESignatureProvider;
        isConfigured: boolean;
    }>>;
    connect(dto: ConnectESignatureDto, req: any): Promise<ApiResponse<{
        success: boolean;
        accountId: string;
    }>>;
    getSettings(req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.ESignatureProvider;
        isConfigured: boolean;
        clientId: string | null;
        accountId: string | null;
        baseUrl: string | null;
    } | null>>;
    sendForSignature(dto: SendForSignatureDto, req: any): Promise<ApiResponse<{
        envelopeId: string;
        externalEnvelopeId: string;
        status: string;
    }>>;
    getEnvelopeStatus(envelopeId: string, req: any): Promise<ApiResponse<import("./dto/esignature.dto").ESignatureStatusResponse>>;
    getEmbeddedSigningUrl(envelopeId: string, returnUrl: string, req: any): Promise<ApiResponse<{
        url: string;
        expiresAt: string;
    }>>;
    voidEnvelope(envelopeId: string, reason: string, req: any): Promise<ApiResponse<{
        success: boolean;
    }>>;
    handleWebhook(payload: any, signature: string): Promise<{
        success: boolean;
    }>;
}
