import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "../../../common/services/email.service";
import { RequestOtpDto, VerifyOtpDto, OtpType } from "../dto/otp.dto";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly OTP_LENGTH = 6;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async requestOtp(
    dto: RequestOtpDto,
  ): Promise<{ message: string; code?: string }> {
    const type = dto.type || OtpType.LOGIN;
    let tenantId = dto.tenantId;

    if (!tenantId) {
      // Try to find user by email to get tenantId
      const user = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });
      if (user) {
        tenantId = user.tenantId;
      } else {
        // If user not found and no tenantId provided, we can't generate OTP
        // unless we want to support "public" OTPs, but schema requires tenantId.
        // For now, throw error if user doesn't exist.
        throw new BadRequestException("User not found");
      }
    }

    // Generate 6-digit OTP
    const code = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Invalidate any existing OTPs for this email/type
    await this.prisma.otpCode.updateMany({
      where: {
        email: dto.email,
        tenantId,
        type,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Create new OTP
    await this.prisma.otpCode.create({
      data: {
        code,
        email: dto.email,
        tenantId,
        type,
        expiresAt,
      },
    });

    // Send OTP via email without blocking the response
    this.emailService.sendOtpEmail(dto.email, code).catch((err) => {
      console.error("Failed to send OTP email", err);
    });

    // In development, also return the code for testing
    const isDev = this.configService.get("NODE_ENV") !== "production";

    return {
      message: "OTP sent to your email",
      ...(isDev && { code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens | { verified: true }> {
    const type = dto.type || OtpType.LOGIN;
    let tenantId = dto.tenantId;

    let otpRecord;

    if (tenantId) {
      otpRecord = await this.prisma.otpCode.findFirst({
        where: {
          email: dto.email,
          tenantId,
          type,
          usedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Find by email and code only
      otpRecord = await this.prisma.otpCode.findFirst({
        where: {
          email: dto.email,
          code: dto.code, // Optimization: filter by code too
          type,
          usedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
      if (otpRecord) {
        tenantId = otpRecord.tenantId;
      }
    }

    if (!otpRecord) {
      throw new BadRequestException(
        "No valid OTP found. Please request a new one.",
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException(
        "OTP has expired. Please request a new one.",
      );
    }

    if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
      // Mark as used to prevent further attempts
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException(
        "Too many failed attempts. Please request a new OTP.",
      );
    }

    if (otpRecord.code !== dto.code) {
      // Increment attempt counter
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new UnauthorizedException("Invalid OTP");
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // For login type, return auth tokens
    if (type === OtpType.LOGIN) {
      let user = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId },
      });

      if (!user) {
        // Create new candidate user
        // Note: This path might fail if tenantId is still undefined (shouldn't happen if otpRecord found)
        if (!tenantId) throw new BadRequestException("Tenant ID missing");

        // Check if tenant exists
        const tenantExists = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenantExists) {
          // If tenant doesn't exist (e.g. was deleted or is invalid), create a new one
          // This handles the case where old OTPs might point to deleted 'demo-tenant'
          let domain = dto.email.split("@")[1].toLowerCase();
          const publicDomains = [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "outlook.com",
            "icloud.com",
            "aol.com",
            "protonmail.com",
          ];

          if (publicDomains.includes(domain)) {
            domain = `${domain}-${uuidv4()}`;
          }

          const slug = `${toSlug(domain)}-${uuidv4().slice(0, 8)}`;

          const newTenant = await this.prisma.tenant.create({
            data: {
              name: "New Organization",
              slug,
              domain: domain,
              status: "ACTIVE",
            } as any,
          });
          tenantId = newTenant.id;
        }

        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            firstName: dto.email.split("@")[0],
            lastName: "",
            role: "CANDIDATE",
            status: "ACTIVE",
            tenantId,
          },
        });
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return this.generateTokens(user);
    }

    if (type === OtpType.EMAIL_VERIFY) {
      const user = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId },
      });

      if (user && user.status !== "ACTIVE") {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: "ACTIVE" },
        });
      }
    }

    return { verified: true };
  }

  private generateOtp(): string {
    const crypto = require("crypto");
    let otp = "";
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  }): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpiration = new Date();
    refreshExpiration.setDate(refreshExpiration.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiration,
      },
    });

    return { accessToken, refreshToken };
  }
}
