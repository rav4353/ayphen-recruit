"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const prisma_service_1 = require("../../prisma/prisma.service");
const aws = require("@aws-sdk/client-ses");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporters = new Map();
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get('SMTP_PORT');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        const sesRegion = this.configService.get('AWS_SES_REGION');
        const awsAccessKey = this.configService.get('AWS_ACCESS_KEY_ID');
        const awsSecretKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        this.fromEmail = smtpUser || this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_FROM') || 'noreply@talentx.com';
        this.fromName = this.configService.get('SMTP_FROM_NAME') || 'TalentX';
        const isSesConfigured = !!(sesRegion && awsAccessKey && awsSecretKey);
        const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);
        this.isConfigured = isSesConfigured || isSmtpConfigured;
        this.logger.log(`Email Config: SES=${isSesConfigured}, SMTP=${isSmtpConfigured}`);
        if (isSesConfigured) {
            const ses = new aws.SES({
                apiVersion: '2010-12-01',
                region: sesRegion,
                credentials: {
                    accessKeyId: awsAccessKey,
                    secretAccessKey: awsSecretKey,
                },
            });
            this.defaultTransporter = nodemailer.createTransport({
                SES: { ses, aws },
            });
            this.logger.log('SES transporter initialized');
        }
        else if (isSmtpConfigured) {
            this.defaultTransporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort || 587,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.defaultTransporter.verify().then(() => {
                this.logger.log('SMTP connection established');
            }).catch((err) => {
                this.logger.error('SMTP connection failed:', err.message);
            });
        }
        else {
            this.logger.warn('Email service not configured - emails will be logged only');
        }
    }
    async getTransporter(tenantId) {
        if (tenantId) {
            if (this.transporters.has(tenantId)) {
            }
            const setting = await this.prisma.setting.findUnique({
                where: { tenantId_key: { tenantId, key: 'smtp_config' } },
            });
            if (setting && setting.value) {
                const config = setting.value;
                if (config.host && config.user && config.pass) {
                    const transporter = nodemailer.createTransport({
                        host: config.host,
                        port: config.port || 587,
                        secure: config.secure || false,
                        auth: { user: config.user, pass: config.pass },
                    });
                    return {
                        transporter,
                        from: `"${config.fromName || this.fromName}" <${config.fromEmail || config.user}>`
                    };
                }
            }
        }
        if (this.isConfigured) {
            return {
                transporter: this.defaultTransporter,
                from: `"${this.fromName}" <${this.fromEmail}>`
            };
        }
        return null;
    }
    async sendEmail(options) {
        const { to, subject, html, text, tenantId, bcc } = options;
        const transportInfo = await this.getTransporter(tenantId);
        if (!transportInfo) {
            this.logger.log(`[SMTP NOT CONFIGURED] Email to ${to} (Tenant: ${tenantId || 'Global'}):`);
            this.logger.log(`Subject: ${subject}`);
            this.logger.log(`Content: ${text || html}`);
            return true;
        }
        try {
            this.logger.log(`Sending email from ${transportInfo.from} to ${to}`);
            const info = await transportInfo.transporter.sendMail({
                from: transportInfo.from,
                to,
                bcc,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, ''),
            });
            this.logger.log(`Email sent to ${to}: ${subject} (messageId: ${info.messageId})`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            this.logger.error(error.stack);
            return false;
        }
    }
    async sendOtpEmail(to, otp, tenantId) {
        const subject = 'Your TalentX Verification Code';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 12px; border: 1px solid #262626;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">TalentX</h1>
                    <p style="margin: 0 0 32px; font-size: 14px; color: #a3a3a3;">Verification Code</p>
                    
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      Use the following code to verify your identity:
                    </p>
                    
                    <div style="background-color: #262626; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #fafafa;">${otp}</span>
                    </div>
                    
                    <p style="margin: 0 0 8px; font-size: 13px; color: #737373;">
                      This code expires in 10 minutes.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #737373;">
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 12px; color: #525252;">
                © ${new Date().getFullYear()} TalentX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
        const text = `Your TalentX verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;
        return this.sendEmail({ to, subject, html, text, tenantId });
    }
    async sendPasswordResetEmail(to, resetLink, tenantId) {
        const subject = 'Reset your TalentX password';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 12px; border: 1px solid #262626;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">TalentX</h1>
                    <p style="margin: 0 0 32px; font-size: 14px; color: #a3a3a3;">Password Reset</p>
                    
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    
                    <a href="${resetLink}" style="display: inline-block; background-color: #fafafa; color: #171717; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; margin-bottom: 24px;">
                      Reset Password
                    </a>
                    
                    <p style="margin: 24px 0 8px; font-size: 13px; color: #737373;">
                      This link expires in 1 hour.
                    </p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: #737373;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    
                    <div style="border-top: 1px solid #262626; padding-top: 16px; margin-top: 16px;">
                      <p style="margin: 0; font-size: 12px; color: #525252;">
                        If the button doesn't work, copy and paste this link:<br>
                        <a href="${resetLink}" style="color: #737373; word-break: break-all;">${resetLink}</a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 12px; color: #525252;">
                © ${new Date().getFullYear()} TalentX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
        const text = `Reset your TalentX password\n\nClick this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`;
        return this.sendEmail({ to, subject, html, text, tenantId });
    }
    async sendInvitationEmail(to, name, tempPass, loginUrl, tenantId) {
        const subject = 'You have been invited to join TalentX';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 12px; border: 1px solid #262626;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #fafafa;">TalentX</h1>
                    <p style="margin: 0 0 32px; font-size: 14px; color: #a3a3a3;">Invitation to Join</p>
                    
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      Hello ${name},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      You have been invited to join the TalentX platform. Please use the following temporary password to log in:
                    </p>
                    
                    <div style="background-color: #262626; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #fafafa; font-family: monospace;">${tempPass}</span>
                    </div>
                    
                    <a href="${loginUrl}" style="display: inline-block; background-color: #fafafa; color: #171717; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; margin-bottom: 24px;">
                      Log In to TalentX
                    </a>
                    
                    <p style="margin: 0 0 16px; font-size: 13px; color: #737373;">
                      Please change your password immediately after logging in. This temporary password is valid for 2 days.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; font-size: 12px; color: #525252;">
                © ${new Date().getFullYear()} TalentX. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
        const text = `Hello ${name},\n\nYou have been invited to join TalentX.\n\nYour temporary password is: ${tempPass}\n\nPlease log in at: ${loginUrl}\n\nChange your password immediately after logging in. This temporary password is valid for 2 days.`;
        return this.sendEmail({ to, subject, html, text, tenantId });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map