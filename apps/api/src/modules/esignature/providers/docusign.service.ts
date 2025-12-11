import { Injectable, Logger } from '@nestjs/common';

interface DocuSignTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

interface DocuSignUserInfo {
    accounts: { account_id: string; base_uri: string; is_default: boolean }[];
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
    authServer?: string; // 'account-d.docusign.com' for demo, 'account.docusign.com' for production
}

@Injectable()
export class DocuSignService {
    private readonly logger = new Logger(DocuSignService.name);
    private readonly defaultRedirectUri = 'http://localhost:3000/settings';
    private readonly defaultAuthServer = 'account-d.docusign.com'; // Demo by default

    /**
     * Generate OAuth authorization URL
     */
    getAuthUrl(config: DocuSignConfig, state?: string): string {
        const scopes = ['signature', 'impersonation'];
        const authServer = config.authServer || this.defaultAuthServer;

        const params = new URLSearchParams({
            response_type: 'code',
            scope: scopes.join(' '),
            client_id: config.clientId,
            redirect_uri: config.redirectUri || this.defaultRedirectUri,
            ...(state && { state }),
        });

        return `https://${authServer}/oauth/auth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(config: DocuSignConfig, code: string, redirectUri?: string): Promise<DocuSignTokens> {
        const authServer = config.authServer || this.defaultAuthServer;
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

        const response = await fetch(`https://${authServer}/oauth/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri || config.redirectUri || this.defaultRedirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('DocuSign token exchange failed:', error);
            throw new Error(`Failed to exchange code: ${error}`);
        }

        return response.json();
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(config: DocuSignConfig, refreshToken: string): Promise<DocuSignTokens> {
        const authServer = config.authServer || this.defaultAuthServer;
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

        const response = await fetch(`https://${authServer}/oauth/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('DocuSign token refresh failed:', error);
            throw new Error(`Failed to refresh token: ${error}`);
        }

        return response.json();
    }

    /**
     * Get user info including account details
     */
    async getUserInfo(config: DocuSignConfig, accessToken: string): Promise<DocuSignUserInfo> {
        const authServer = config.authServer || this.defaultAuthServer;
        
        const response = await fetch(`https://${authServer}/oauth/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return response.json();
    }

    /**
     * Create and send an envelope for signature
     */
    async createEnvelope(
        accessToken: string,
        baseUri: string,
        accountId: string,
        options: {
            documentBase64: string;
            documentName: string;
            signers: { name: string; email: string; recipientId: string; routingOrder: string }[];
            emailSubject: string;
            emailBlurb?: string;
            status?: 'sent' | 'created';
        }
    ): Promise<EnvelopeResponse> {
        const envelopeDefinition = {
            emailSubject: options.emailSubject,
            emailBlurb: options.emailBlurb || 'Please review and sign this document.',
            documents: [
                {
                    documentBase64: options.documentBase64,
                    name: options.documentName,
                    fileExtension: 'pdf',
                    documentId: '1',
                },
            ],
            recipients: {
                signers: options.signers.map(signer => ({
                    email: signer.email,
                    name: signer.name,
                    recipientId: signer.recipientId,
                    routingOrder: signer.routingOrder,
                    tabs: {
                        signHereTabs: [
                            {
                                documentId: '1',
                                pageNumber: '1',
                                xPosition: '100',
                                yPosition: '700',
                            },
                        ],
                        dateSignedTabs: [
                            {
                                documentId: '1',
                                pageNumber: '1',
                                xPosition: '100',
                                yPosition: '750',
                            },
                        ],
                    },
                })),
            },
            status: options.status || 'sent',
        };

        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(envelopeDefinition),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to create DocuSign envelope:', error);
            throw new Error(`Failed to create envelope: ${error}`);
        }

        return response.json();
    }

    /**
     * Get envelope status
     */
    async getEnvelopeStatus(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<EnvelopeStatus> {
        const response = await fetch(
            `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}?include=recipients`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get envelope status:', error);
            throw new Error(`Failed to get envelope status: ${error}`);
        }

        return response.json();
    }

    /**
     * Get embedded signing URL for recipient
     */
    async getEmbeddedSigningUrl(
        accessToken: string,
        baseUri: string,
        accountId: string,
        envelopeId: string,
        options: {
            signerEmail: string;
            signerName: string;
            returnUrl: string;
            clientUserId?: string;
        }
    ): Promise<{ url: string }> {
        const recipientView = {
            returnUrl: options.returnUrl,
            authenticationMethod: 'none',
            email: options.signerEmail,
            userName: options.signerName,
            clientUserId: options.clientUserId || options.signerEmail,
        };

        const response = await fetch(
            `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipientView),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get embedded signing URL:', error);
            throw new Error(`Failed to get signing URL: ${error}`);
        }

        return response.json();
    }

    /**
     * Void an envelope
     */
    async voidEnvelope(accessToken: string, baseUri: string, accountId: string, envelopeId: string, voidReason: string): Promise<void> {
        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'voided',
                voidedReason: voidReason,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to void envelope:', error);
            throw new Error(`Failed to void envelope: ${error}`);
        }
    }

    /**
     * Download signed document
     */
    async getSignedDocument(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<Buffer> {
        const response = await fetch(
            `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to download document:', error);
            throw new Error(`Failed to download document: ${error}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Resend envelope notification
     */
    async resendEnvelope(accessToken: string, baseUri: string, accountId: string, envelopeId: string): Promise<void> {
        const response = await fetch(
            `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}?resend_envelope=true`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to resend envelope:', error);
            throw new Error(`Failed to resend envelope: ${error}`);
        }
    }
}
