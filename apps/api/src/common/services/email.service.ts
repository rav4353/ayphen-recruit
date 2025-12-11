import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import * as aws from '@aws-sdk/client-ses';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
  bcc?: string | string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private defaultTransporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;
  private transporters = new Map<string, Transporter>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    const sesRegion = this.configService.get<string>('AWS_SES_REGION');
    const awsAccessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    // For Gmail, the from email MUST be the authenticated user
    this.fromEmail = smtpUser || this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_FROM') || 'noreply@talentx.com';
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'TalentX';

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
      } as any);
      this.logger.log('SES transporter initialized');
    } else if (isSmtpConfigured) {
      this.defaultTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Verify connection
      this.defaultTransporter.verify().then(() => {
        this.logger.log('SMTP connection established');
      }).catch((err) => {
        this.logger.error('SMTP connection failed:', err.message);
      });
    } else {
      this.logger.warn('Email service not configured - emails will be logged only');
    }
  }

  private async getTransporter(tenantId?: string): Promise<{ transporter: Transporter; from: string } | null> {
    // 1. Try tenant specific config
    if (tenantId) {
      if (this.transporters.has(tenantId)) {
        // We need to store 'from' address with transporter too, but for now let's re-fetch or store complex object
        // For simplicity, let's just re-fetch for now or assume we store it.
        // To do it properly, let's just fetch from DB if not in cache, or invalidate cache on update.
        // Since we don't have cache invalidation mechanism yet, let's fetch from DB every time or short cache.
        // For now, let's fetch from DB to ensure fresh config. Optimization can come later.
      }

      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: 'smtp_config' } },
      });

      if (setting && setting.value) {
        const config = setting.value as any;
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

    // 2. Fallback to default
    if (this.isConfigured) {
      return {
        transporter: this.defaultTransporter,
        from: `"${this.fromName}" <${this.fromEmail}>`
      };
    }

    return null;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text, tenantId, bcc } = options;

    const transportInfo = await this.getTransporter(tenantId);

    if (!transportInfo) {
      // When SMTP is not configured, just log the email
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
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      this.logger.error(error.stack);
      return false;
    }
  }

  // ==================== Email Templates ====================

  async sendOtpEmail(to: string, otp: string, tenantId?: string): Promise<boolean> {
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

  async sendPasswordResetEmail(to: string, resetLink: string, tenantId?: string): Promise<boolean> {
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
  async sendInvitationEmail(to: string, name: string, tempPass: string, loginUrl: string, tenantId?: string): Promise<boolean> {
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
}
