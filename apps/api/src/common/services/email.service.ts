import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../../prisma/prisma.service";
import * as aws from "@aws-sdk/client-ses";

export type EmailPurpose =
  | "notifications"
  | "interviews"
  | "offers"
  | "rejections"
  | "bulkEmails"
  | "onboarding"
  | "system" // OTP, verification, password reset - uses super admin SMTP
  | "default";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
  bcc?: string | string[];
  purpose?: EmailPurpose; // Which from address alias to use
  requireTenantSmtp?: boolean; // If true, will throw error if tenant SMTP not configured
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
    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpPort = this.configService.get<number>("SMTP_PORT");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");

    const sesRegion = this.configService.get<string>("AWS_SES_REGION");
    const awsAccessKey = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const awsSecretKey = this.configService.get<string>(
      "AWS_SECRET_ACCESS_KEY",
    );

    // For Gmail, the from email MUST be the authenticated user
    this.fromEmail =
      smtpUser ||
      this.configService.get<string>("SMTP_FROM_EMAIL") ||
      this.configService.get<string>("SMTP_FROM") ||
      "noreply@talentx.com";
    this.fromName =
      this.configService.get<string>("SMTP_FROM_NAME") || "TalentX";

    const isSesConfigured = !!(sesRegion && awsAccessKey && awsSecretKey);
    const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);
    this.isConfigured = isSesConfigured || isSmtpConfigured;

    this.logger.log(
      `Email Config: SES=${isSesConfigured}, SMTP=${isSmtpConfigured}`,
    );

    if (isSesConfigured) {
      const ses = new aws.SES({
        apiVersion: "2010-12-01",
        region: sesRegion,
        credentials: {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey,
        },
      });

      this.defaultTransporter = nodemailer.createTransport({
        SES: { ses, aws },
      } as any);
      this.logger.log("SES transporter initialized");
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
      this.defaultTransporter
        .verify()
        .then(() => {
          this.logger.log("SMTP connection established");
        })
        .catch((err) => {
          this.logger.error("SMTP connection failed:", err.message);
        });
    } else {
      this.logger.warn(
        "Email service not configured - emails will be logged only",
      );
    }
  }

  /**
   * Get super admin SMTP configuration from global settings
   */
  private async getSuperAdminTransporter(): Promise<{ transporter: Transporter; from: string } | null> {
    try {
      const settings = await this.prisma.globalSetting.findMany({
        where: {
          key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from_email", "smtp_from_name", "smtp_secure"] },
        },
      });

      const config: Record<string, any> = {};
      for (const s of settings) {
        config[s.key.replace("smtp_", "")] = s.value;
      }

      if (config.host && config.user && config.password) {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port || 587,
          secure: config.secure || false,
          auth: { user: config.user, pass: config.password },
        });

        const fromEmail = config.from_email || config.user;
        const fromName = config.from_name || "TalentX";

        return {
          transporter,
          from: `"${fromName}" <${fromEmail}>`,
        };
      }
    } catch (error) {
      this.logger.error("Failed to get super admin SMTP config:", error);
    }

    // Fallback to env-configured default transporter
    if (this.isConfigured) {
      return {
        transporter: this.defaultTransporter,
        from: `"${this.fromName}" <${this.fromEmail}>`,
      };
    }

    return null;
  }

  private async getTransporter(
    tenantId?: string,
    purpose: EmailPurpose = "default",
  ): Promise<{ transporter: Transporter; from: string } | null> {
    // For system emails (OTP, verification, password reset), always use super admin SMTP
    if (purpose === "system") {
      return this.getSuperAdminTransporter();
    }

    // 1. Try tenant specific config
    if (tenantId) {
      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: "smtp_config" } },
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

          // Check for purpose-specific alias
          let fromEmail = config.fromEmail || config.user;
          let fromName = config.fromName || this.fromName;

          if (purpose !== "default" && config.fromAliases?.[purpose]) {
            const alias = config.fromAliases[purpose];
            if (alias.email) {
              fromEmail = alias.email;
              fromName = alias.name || fromName;
            }
          }

          return {
            transporter,
            from: `"${fromName}" <${fromEmail}>`,
          };
        }
      }
    }

    // 2. Fallback to super admin SMTP (not env vars)
    return this.getSuperAdminTransporter();
  }

  /**
   * Check if tenant SMTP is configured
   */
  async isTenantSmtpConfigured(tenantId: string): Promise<boolean> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: "smtp_config" } },
      });

      if (!setting || !setting.value) return false;

      const config = setting.value as any;
      return !!(config.host && config.user && config.pass);
    } catch {
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const {
      to,
      subject,
      html,
      text,
      tenantId,
      bcc,
      purpose = "default",
      requireTenantSmtp = false,
    } = options;

    // If tenant SMTP is required, check if it's configured
    if (requireTenantSmtp && tenantId) {
      const tenantSmtpConfigured = await this.isTenantSmtpConfigured(tenantId);
      if (!tenantSmtpConfigured) {
        this.logger.warn(
          `[TENANT SMTP NOT CONFIGURED] Cannot send email to ${to} - tenant ${tenantId} has no SMTP configured`,
        );
        throw new Error(
          "Email cannot be sent. Please configure SMTP settings in Settings > Email Configuration.",
        );
      }
    }

    const transportInfo = await this.getTransporter(tenantId, purpose);

    if (!transportInfo) {
      // When SMTP is not configured, just log the email
      this.logger.log(
        `[SMTP NOT CONFIGURED] Email to ${to} (Tenant: ${tenantId || "Global"}, Purpose: ${purpose}):`,
      );
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Content: ${text || html}`);
      return true;
    }

    try {
      this.logger.log(
        `Sending email from ${transportInfo.from} to ${to} (purpose: ${purpose})`,
      );

      const info = await transportInfo.transporter.sendMail({
        from: transportInfo.from,
        to,
        bcc,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      });

      this.logger.log(
        `Email sent to ${to}: ${subject} (messageId: ${info.messageId})`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      this.logger.error(error.stack);
      return false;
    }
  }

  // ==================== Email Templates ====================

  async sendOtpEmail(
    to: string,
    otp: string,
    tenantId?: string,
  ): Promise<boolean> {
    const subject = "Your TalentX Verification Code";
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

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      purpose: "system", // Use super admin SMTP for OTP emails
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    tenantId?: string,
  ): Promise<boolean> {
    const subject = "Reset your TalentX password";
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

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      purpose: "system", // Use super admin SMTP for password reset emails
    });
  }

  async sendInvitationEmail(
    to: string,
    name: string,
    tempPass: string,
    loginUrl: string,
    tenantId?: string,
  ): Promise<boolean> {
    const subject = "You have been invited to join TalentX";
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

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      tenantId,
      purpose: "notifications",
    });
  }

  async sendAssessmentInvitationEmail(
    to: string,
    candidateName: string,
    assessmentName: string,
    assessmentLink: string,
    expiresAt: string,
    tenantId?: string,
  ): Promise<boolean> {
    const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `You're invited to complete an assessment: ${assessmentName}`;
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
                    <p style="margin: 0 0 32px; font-size: 14px; color: #a3a3a3;">Skill Assessment Invitation</p>
                    
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      Hello ${candidateName},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                      You've been invited to complete the following assessment as part of the application process:
                    </p>
                    
                    <div style="background-color: #262626; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                      <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #fafafa;">${assessmentName}</h2>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">Please complete this assessment before ${expiryDate}</p>
                    </div>
                    
                    <a href="${assessmentLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; margin-bottom: 24px;">
                      Start Assessment
                    </a>
                    
                    <p style="margin: 24px 0 8px; font-size: 13px; color: #737373;">
                      <strong>Tips for success:</strong>
                    </p>
                    <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 13px; color: #737373; line-height: 1.8;">
                      <li>Find a quiet place with stable internet connection</li>
                      <li>Read each question carefully before answering</li>
                      <li>You can only submit the assessment once</li>
                    </ul>
                    
                    <div style="border-top: 1px solid #262626; padding-top: 16px; margin-top: 16px;">
                      <p style="margin: 0; font-size: 12px; color: #525252;">
                        If the button doesn't work, copy and paste this link:<br>
                        <a href="${assessmentLink}" style="color: #737373; word-break: break-all;">${assessmentLink}</a>
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

    const text = `Hello ${candidateName},\n\nYou've been invited to complete the following assessment: ${assessmentName}\n\nPlease complete this assessment before ${expiryDate}.\n\nStart the assessment here: ${assessmentLink}\n\nTips for success:\n- Find a quiet place with stable internet connection\n- Read each question carefully before answering\n- You can only submit the assessment once\n\nGood luck!`;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      tenantId,
      purpose: "interviews",
    });
  }

  async sendInterviewInvitationEmail(
    to: string,
    candidateName: string,
    jobTitle: string,
    interviewDetails: {
      date: string;
      time: string;
      type: string;
      duration: number;
      location?: string;
      meetingLink?: string;
    },
    confirmUrl: string,
    tenantId?: string,
  ): Promise<boolean> {
    const subject = `Interview Invitation: ${jobTitle} at TalentX`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">Interview Invitation</h1>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #bfdbfe; font-weight: 500;">${jobTitle}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                      Hello <strong>${candidateName}</strong>,
                    </p>
                    <p style="margin: 0 0 32px; font-size: 16px; color: #475569; line-height: 1.6;">
                      We're impressed with your background and would like to invite you for an interview for the <strong>${jobTitle}</strong> position. We've proposed the following time slot:
                    </p>
                    
                    <!-- Details Card -->
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 32px; margin-bottom: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px; width: 40px; vertical-align: top;">
                            <span style="font-size: 20px;">📅</span>
                          </td>
                          <td style="padding-bottom: 20px;">
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Date & Time</div>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${interviewDetails.date} at ${interviewDetails.time}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px; vertical-align: top;">
                            <span style="font-size: 20px;">⏱️</span>
                          </td>
                          <td style="padding-bottom: 20px;">
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Duration</div>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${interviewDetails.duration} minutes</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: top;">
                            <span style="font-size: 20px;">💻</span>
                          </td>
                          <td>
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Interview Type</div>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a; text-transform: capitalize;">${interviewDetails.type.toLowerCase()} Interview</div>
                          </td>
                        </tr>
                        ${interviewDetails.location ? `
                        <tr>
                          <td style="padding-top: 20px; vertical-align: top;">
                            <span style="font-size: 20px;">📍</span>
                          </td>
                          <td style="padding-top: 20px;">
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Location</div>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${interviewDetails.location}</div>
                          </td>
                        </tr>
                        ` : ""}
                      </table>
                    </div>
                    
                    <!-- Action Section -->
                    <div style="text-align: center; background-color: #fafafa; border-radius: 12px; padding: 40px; border: 1px dashed #e2e8f0;">
                      <p style="margin: 0 0 24px; font-size: 15px; color: #475569; font-weight: 500;">Does this time work for you?</p>
                      <a href="${confirmUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);">
                        Accept This Interview
                      </a>
                      <p style="margin: 24px 0 0; font-size: 14px; color: #94a3b8;">
                        Clicking accept will automatically add this to your calendar.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 32px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                        Need to reschedule? Just reply to this email and let us know.<br>
                        We're looking forward to meeting you!
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                      Powered by <strong>TalentX</strong>
                    </p>
                    <div style="margin-top: 12px;">
                      <a href="#" style="font-size: 12px; color: #cbd5e1; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
                      <a href="#" style="font-size: 12px; color: #cbd5e1; text-decoration: none; margin: 0 8px;">Help Center</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `Hello ${candidateName},\n\nYou're invited for an interview for the ${jobTitle} position.\n\nDetails:\n- Date: ${interviewDetails.date}\n- Time: ${interviewDetails.time}\n- Type: ${interviewDetails.type}\n- Duration: ${interviewDetails.duration} minutes\n\nAccept the interview here: ${confirmUrl}`;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      tenantId,
      purpose: "interviews",
    });
  }
}
