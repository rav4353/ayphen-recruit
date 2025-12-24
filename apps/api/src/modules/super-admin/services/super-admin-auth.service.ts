import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminAuditService } from "./super-admin-audit.service";

@Injectable()
export class SuperAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: SuperAdminAuditService,
  ) {}

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Find super admin
    const superAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM super_admins WHERE email = ${email} LIMIT 1
    `;

    if (!superAdmin || superAdmin.length === 0) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const admin = superAdmin[0];

    // Check if locked
    if (admin.status === "LOCKED" && admin.lockedUntil) {
      if (new Date(admin.lockedUntil) > new Date()) {
        throw new ForbiddenException(
          "Account is locked. Please try again later.",
        );
      }
      // Unlock if lock period has passed
      await this.prisma.$executeRaw`
        UPDATE super_admins 
        SET status = 'ACTIVE', "failedAttempts" = 0, "lockedUntil" = NULL 
        WHERE id = ${admin.id}
      `;
    }

    if (admin.status === "DISABLED") {
      throw new ForbiddenException("Account is disabled");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (admin.failedAttempts || 0) + 1;

      if (newAttempts >= 5) {
        // Lock account for 15 minutes
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.$executeRaw`
          UPDATE super_admins 
          SET "failedAttempts" = ${newAttempts}, status = 'LOCKED', "lockedUntil" = ${lockedUntil}
          WHERE id = ${admin.id}
        `;
      } else {
        await this.prisma.$executeRaw`
          UPDATE super_admins SET "failedAttempts" = ${newAttempts} WHERE id = ${admin.id}
        `;
      }

      throw new UnauthorizedException("Invalid credentials");
    }

    if (admin.requirePasswordChange) {
      return {
        requirePasswordChange: true,
        superAdmin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "SUPER_ADMIN",
          lastLogin: admin.lastLoginAt,
          createdAt: admin.createdAt,
        },
      };
    }

    // Reset failed attempts and update last login
    await this.prisma.$executeRaw`
      UPDATE super_admins 
      SET "failedAttempts" = 0, "lastLoginAt" = NOW(), "lastLoginIp" = ${ip}
      WHERE id = ${admin.id}
    `;

    // Generate tokens
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: "SUPER_ADMIN",
      type: "super_admin",
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.$executeRaw`
      INSERT INTO super_admin_refresh_tokens (id, token, "expiresAt", "superAdminId", "createdAt")
      VALUES (gen_random_uuid(), ${refreshToken}, ${expiresAt}, ${admin.id}, NOW())
    `;

    // Log audit
    await this.auditService.log({
      superAdminId: admin.id,
      action: "LOGIN",
      ipAddress: ip,
      userAgent,
    });

    return {
      superAdmin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "SUPER_ADMIN",
        lastLogin: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async forceChangePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    ip?: string,
    userAgent?: string,
  ) {
    const superAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM super_admins WHERE email = ${email} LIMIT 1
    `;

    if (!superAdmin || superAdmin.length === 0) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const admin = superAdmin[0];

    if (admin.status === "DISABLED") {
      throw new ForbiddenException("Account is disabled");
    }

    if (!admin.requirePasswordChange) {
      throw new ForbiddenException("Password change not required");
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    this.validatePasswordStrength(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$executeRaw`
      UPDATE super_admins
      SET "passwordHash" = ${passwordHash}, "requirePasswordChange" = false, "updatedAt" = NOW()
      WHERE id = ${admin.id}
    `;

    await this.prisma.$executeRaw`
      DELETE FROM super_admin_refresh_tokens WHERE "superAdminId" = ${admin.id}
    `;

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: "SUPER_ADMIN",
      type: "super_admin",
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.$executeRaw`
      INSERT INTO super_admin_refresh_tokens (id, token, "expiresAt", "superAdminId", "createdAt")
      VALUES (gen_random_uuid(), ${refreshToken}, ${expiresAt}, ${admin.id}, NOW())
    `;

    await this.auditService.log({
      superAdminId: admin.id,
      action: "PASSWORD_CHANGED",
      ipAddress: ip,
      userAgent,
    });

    return {
      superAdmin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "SUPER_ADMIN",
        lastLogin: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(
    superAdminId: string,
    token?: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Invalidate refresh token
    if (token) {
      await this.prisma.$executeRaw`
        DELETE FROM super_admin_refresh_tokens WHERE token = ${token}
      `;
    }

    // Log audit
    await this.auditService.log({
      superAdminId,
      action: "LOGOUT",
      ipAddress: ip,
      userAgent,
    });

    return { success: true };
  }

  async changePassword(
    superAdminId: string,
    currentPassword: string,
    newPassword: string,
    ip?: string,
    userAgent?: string,
  ) {
    const superAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM super_admins WHERE id = ${superAdminId} LIMIT 1
    `;

    if (!superAdmin || superAdmin.length === 0) {
      throw new UnauthorizedException("Invalid super admin");
    }

    const admin = superAdmin[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.$executeRaw`
      UPDATE super_admins SET "passwordHash" = ${passwordHash}, "requirePasswordChange" = false, "updatedAt" = NOW()
      WHERE id = ${superAdminId}
    `;

    // Invalidate all refresh tokens
    await this.prisma.$executeRaw`
      DELETE FROM super_admin_refresh_tokens WHERE "superAdminId" = ${superAdminId}
    `;

    // Log audit
    await this.auditService.log({
      superAdminId,
      action: "PASSWORD_CHANGED",
      ipAddress: ip,
      userAgent,
    });

    return { success: true };
  }

  async setupInitialAdmin(
    email: string,
    password: string,
    name: string,
    setupKey: string,
  ) {
    // Verify setup key
    const validSetupKey = this.configService.get<string>(
      "SUPER_ADMIN_SETUP_KEY",
    );
    if (!validSetupKey || setupKey !== validSetupKey) {
      throw new ForbiddenException("Invalid setup key");
    }

    // Check if super admin already exists
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM super_admins LIMIT 1
    `;

    if (existing && existing.length > 0) {
      throw new ForbiddenException("Super admin already exists");
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Create super admin
    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.$executeRaw`
      INSERT INTO super_admins (id, email, "passwordHash", name, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${email}, ${passwordHash}, ${name}, 'ACTIVE', NOW(), NOW())
    `;

    return { success: true, message: "Super admin created successfully" };
  }

  private validatePasswordStrength(password: string) {
    if (password.length < 16) {
      throw new ForbiddenException("Password must be at least 16 characters");
    }
    if (!/[A-Z]/.test(password)) {
      throw new ForbiddenException("Password must contain uppercase letters");
    }
    if (!/[a-z]/.test(password)) {
      throw new ForbiddenException("Password must contain lowercase letters");
    }
    if (!/[0-9]/.test(password)) {
      throw new ForbiddenException("Password must contain numbers");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ForbiddenException("Password must contain special characters");
    }
  }

  async getProfile(superAdminId: string) {
    const superAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, name, "mfaEnabled" as mfa_enabled, "lastLoginAt" as last_login_at, "createdAt" as created_at
      FROM super_admins WHERE id = ${superAdminId} LIMIT 1
    `;

    if (!superAdmin || superAdmin.length === 0) {
      throw new UnauthorizedException("Super admin not found");
    }

    return {
      id: superAdmin[0].id,
      email: superAdmin[0].email,
      name: superAdmin[0].name,
      mfaEnabled: superAdmin[0].mfa_enabled,
      lastLogin: superAdmin[0].last_login_at,
      createdAt: superAdmin[0].created_at,
    };
  }
}
