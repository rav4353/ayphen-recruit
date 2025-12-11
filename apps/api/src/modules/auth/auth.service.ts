import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpService } from './services/otp.service';
import { OtpType } from './dto/otp.dto';

import { ROLE_PERMISSIONS } from '../../common/constants/permissions';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) { }

  async validateUser(email: string, password: string, tenantId?: string) {
    console.log(`[Auth] Validating user: ${email}, tenantId: ${tenantId}`);
    let user;
    if (tenantId) {
      user = await this.usersService.findByEmail(email, tenantId);
    } else {
      // If no tenantId provided, try to find the user by email globally
      // Note: This assumes email is unique across the platform or picks the first one
      const users = await this.prisma.user.findMany({
        where: { email },
      });
      console.log(`[Auth] Found ${users.length} users with email ${email}`);
      if (users.length > 0) {
        user = users[0];
      }
    }

    if (!user) {
      console.log('[Auth] User not found');
      return null;
    }

    if (!user.passwordHash) {
      console.log('[Auth] User has no password hash');
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Auth] Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      return null;
    }

    if (user.tempPasswordExpiresAt && user.tempPasswordExpiresAt < new Date()) {
      console.log('[Auth] Temporary password expired');
      throw new UnauthorizedException('Temporary password has expired. Please ask administrator to resend invite.');
    }

    return user;
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    let tenantId = dto.tenantId;
    let isNewTenant = false;

    // Force new tenant creation/lookup if 'demo-tenant' is passed
    // This prevents accidental assignment to the demo tenant
    if (tenantId === 'demo-tenant') {
      tenantId = undefined;
    }

    // If no tenantId provided, create a new tenant (SaaS mode)
    if (!tenantId) {
      let domain = dto.email.split('@')[1].toLowerCase();
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];

      // If it's a public domain, treat it as a unique tenant for this user
      // by appending a unique identifier to the domain key
      if (publicDomains.includes(domain)) {
        domain = `${domain}-${uuidv4()}`;
      }

      // Check if tenant with this domain already exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { domain },
      });

      if (existingTenant) {
        // If tenant exists, add user to that tenant instead of failing
        tenantId = existingTenant.id;

        // Check if user already exists in this tenant
        const existingUser = await this.usersService.findByEmail(dto.email, tenantId);
        if (existingUser) {
          throw new ConflictException('User with this email already exists in this organization');
        }
      } else {
        // Create new tenant
        const newTenant = await this.prisma.tenant.create({
          data: {
            name: `${dto.firstName}'s Organization`,
            domain,
          },
        });
        tenantId = newTenant.id;
        isNewTenant = true;
      }
    } else {
      // Check if user exists in the specified tenant
      const existingUser = await this.usersService.findByEmail(
        dto.email,
        tenantId,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists in this organization');
      }
    }

    // Use lower salt rounds in development for faster responses (10 is still secure)
    // Production should use 12+ rounds
    const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: isNewTenant ? 'ADMIN' : ((dto.role || 'RECRUITER') as any),
        status: 'PENDING',
        tenantId: tenantId,
      },
    });

    if (isNewTenant) {
      await this.otpService.requestOtp({
        email: user.email,
        tenantId: user.tenantId,
        type: OtpType.EMAIL_VERIFY,
      });
    } else {
      // If invited to existing tenant, automatically activate
      // In a real app, we might want to send an invite email instead of OTP
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    return { message: 'Verification code sent to your email' };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { requirePasswordChange?: boolean; user: any }> {
    const user = await this.validateUser(dto.email, dto.password, dto.tenantId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact your administrator.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Email not verified');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requirePasswordChange: user.requirePasswordChange,
      user,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  }): Promise<AuthTokens> {
    const userPermissions = await this.resolvePermissions(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      permissions: userPermissions,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshExpiration = new Date();
    refreshExpiration.setDate(refreshExpiration.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiration,
      },
    });

    return { accessToken, refreshToken };
  }

  // Public method for other services to generate tokens
  async generateTokensForUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  }): Promise<AuthTokens> {
    return this.generateTokens(user);
  }

  async generateMagicLink(email: string, tenantId: string): Promise<string> {
    // For candidate magic link login
    const token = uuidv4();
    // Store token with expiration (implementation depends on your needs)
    // For now, return the token - in production, send via email
    return `${this.configService.get('WEB_URL')}/auth/magic?token=${token}`;
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
  async resolvePermissions(user: any): Promise<string[]> {
    // If user has explicit custom permissions set (not empty), they override EVERYTHING.
    // This allows disabling default role permissions or creating fully custom sets per user.
    if (user.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
      return [...user.customPermissions];
    }

    // Otherwise, fall back to Role permissions
    let permissions: string[] = [];

    // If user has a dynamic role assigned
    if (user.roleDef && user.roleDef.permissions) {
      permissions = [...user.roleDef.permissions];
    } else {
      // Fallback to static system role permissions
      // Use type assertion if user.role is not strictly typed as one of the keys
      const role = user.role as keyof typeof ROLE_PERMISSIONS;
      permissions = [...(ROLE_PERMISSIONS[role] || [])];
    }

    return permissions;
  }
}
