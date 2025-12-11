"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DocuSignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocuSignService = void 0;
const common_1 = require("@nestjs/common");
let DocuSignService = DocuSignService_1 = class DocuSignService {
    constructor() {
        this.logger = new common_1.Logger(DocuSignService_1.name);
        this.defaultRedirectUri = 'http://localhost:3000/settings';
        this.defaultAuthServer = 'account-d.docusign.com';
    }
    getAuthUrl(config, state) {
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
    async exchangeCodeForTokens(config, code, redirectUri) {
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
    async refreshAccessToken(config, refreshToken) {
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
    async getUserInfo(config, accessToken) {
        const authServer = config.authServer || this.defaultAuthServer;
        const response = await fetch(`https://${authServer}/oauth/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        return response.json();
    }
    async createEnvelope(accessToken, baseUri, accountId, options) {
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
    async getEnvelopeStatus(accessToken, baseUri, accountId, envelopeId) {
        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}?include=recipients`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get envelope status:', error);
            throw new Error(`Failed to get envelope status: ${error}`);
        }
        return response.json();
    }
    async getEmbeddedSigningUrl(accessToken, baseUri, accountId, envelopeId, options) {
        const recipientView = {
            returnUrl: options.returnUrl,
            authenticationMethod: 'none',
            email: options.signerEmail,
            userName: options.signerName,
            clientUserId: options.clientUserId || options.signerEmail,
        };
        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipientView),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to get embedded signing URL:', error);
            throw new Error(`Failed to get signing URL: ${error}`);
        }
        return response.json();
    }
    async voidEnvelope(accessToken, baseUri, accountId, envelopeId, voidReason) {
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
    async getSignedDocument(accessToken, baseUri, accountId, envelopeId) {
        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to download document:', error);
            throw new Error(`Failed to download document: ${error}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    async resendEnvelope(accessToken, baseUri, accountId, envelopeId) {
        const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}?resend_envelope=true`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Failed to resend envelope:', error);
            throw new Error(`Failed to resend envelope: ${error}`);
        }
    }
};
exports.DocuSignService = DocuSignService;
exports.DocuSignService = DocuSignService = DocuSignService_1 = __decorate([
    (0, common_1.Injectable)()
], DocuSignService);
//# sourceMappingURL=docusign.service.js.map