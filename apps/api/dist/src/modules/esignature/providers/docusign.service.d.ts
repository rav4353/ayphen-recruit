interface DocuSignTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}
interface DocuSignUserInfo {
    accounts: {
        account_id: string;
        base_uri: string;
        is_default: boolean;
    }[];
}
interface EnvelopeResponse {
    envelopeId: string;
    status: string;
    statusDateTime: string;
    uri: string;
}
interface RecipientStatus {
    name: string;
    email: string;
    status: string;
    signedDateTime?: string;
    declinedDateTime?: string;
    declinedReason?: string;
}
interface EnvelopeStatus {
    envelopeId: string;
    status: string;
    sentDateTime?: string;
    deliveredDateTime?: string;
    completedDateTime?: string;
    declinedDateTime?: string;
    voidedDateTime?: string;
    recipients?: {
        signers: RecipientStatus[];
    };
}
export interface DocuSignConfig {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    authServer?: string;
}
export declare class DocuSignService {
    private readonly logger;
    private readonly defaultRedirectUri;
    private readonly defaultAuthServer;
    getAuthUrl(config: DocuSignConfig, state?: string): string;
    exchangeCodeForTokens(config: DocuSignConfig, code: string, redirectUri?: string): Promise<DocuSignTokens>;
    refreshAccessToken(config: DocuSignConfig, refreshToken: string): Promise<DocuSignTokens>;
    getUserInfo(config: DocuSignConfig, accessToken: string): Promise<DocuSignUserInfo>;
    createEnvelope(accessToken: string, baseUri: string, accountId: string, options: {
        documentBase64: string;
        documentName: string;
        signers: {
            name: string;
            email: string;
            recipientId: string;
            routingOrder: string;
        }[];
        emailSubject: string;
        emailBlurb?: string;
        status?: 'sent' | 'created';
    }): Promise<EnvelopeResponse>;
    getEnvelopeStatus(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<EnvelopeStatus>;
    getEmbeddedSigningUrl(accessToken: string, baseUri: string, accountId: string, envelopeId: string, options: {
        signerEmail: string;
        signerName: string;
        returnUrl: string;
        clientUserId?: string;
    }): Promise<{
        url: string;
    }>;
    voidEnvelope(accessToken: string, baseUri: string, accountId: string, envelopeId: string, voidReason: string): Promise<void>;
    getSignedDocument(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<Buffer>;
    resendEnvelope(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<void>;
}
export {};
