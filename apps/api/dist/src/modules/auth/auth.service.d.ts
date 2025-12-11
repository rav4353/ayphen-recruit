import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpService } from './services/otp.service';
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
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly otpService;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService, otpService: OtpService);
    validateUser(email: string, password: string, tenantId?: string): Promise<{
        role: import("@prisma/client").$Enums.UserRole;
        email: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        title: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        departmentId: string | null;
        customPermissions: string[];
        roleId: string | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.UserStatus;
        employeeId: string | null;
        passwordHash: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        requirePasswordChange: boolean;
        tempPasswordExpiresAt: Date | null;
        preferredTheme: string;
        preferredLanguage: string;
    } | null>;
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<AuthTokens & {
        requirePasswordChange?: boolean;
        user: any;
    }>;
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    private generateTokens;
    generateTokensForUser(user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        tenantId: string;
    }): Promise<AuthTokens>;
    generateMagicLink(email: string, tenantId: string): Promise<string>;
    getUserById(userId: string): Promise<{
        role: import("@prisma/client").$Enums.UserRole;
        email: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        title: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        departmentId: string | null;
        customPermissions: string[];
        roleId: string | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.UserStatus;
        employeeId: string | null;
        passwordHash: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        requirePasswordChange: boolean;
        tempPasswordExpiresAt: Date | null;
        preferredTheme: string;
        preferredLanguage: string;
    } | null>;
    resolvePermissions(user: any): Promise<string[]>;
}
