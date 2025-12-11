type ESignatureProvider = 'DOCUSIGN' | 'ADOBE_SIGN' | 'ZOHO_SIGN';
type ESignatureStatus = 'CREATED' | 'SENT' | 'DELIVERED' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'VOIDED' | 'EXPIRED';
export declare class SignerDto {
    name: string;
    email: string;
    role?: string;
    order?: number;
}
export declare class ConfigureESignatureDto {
    provider: ESignatureProvider;
    clientId: string;
    clientSecret: string;
    accountId?: string;
    baseUrl?: string;
}
export declare class ConnectESignatureDto {
    code: string;
    redirectUri?: string;
}
export declare class SendForSignatureDto {
    offerId: string;
    signers: SignerDto[];
    emailSubject?: string;
    emailMessage?: string;
    expirationDays?: number;
    sendReminders?: boolean;
}
export declare class WebhookEventDto {
    event: string;
    envelopeId?: string;
    status?: string;
    data?: any;
}
export declare class ESignatureStatusResponse {
    envelopeId: string;
    status: ESignatureStatus;
    signers: {
        name: string;
        email: string;
        status: string;
        signedAt?: string;
        declinedAt?: string;
        declineReason?: string;
    }[];
    sentAt?: string;
    viewedAt?: string;
    signedAt?: string;
    declinedAt?: string;
    documentUrl?: string;
    signedDocumentUrl?: string;
}
export declare class EmbeddedSigningResponse {
    url: string;
    expiresAt: string;
}
export {};
