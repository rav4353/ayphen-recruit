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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const otp_service_1 = require("./services/otp.service");
const otp_dto_1 = require("./dto/otp.dto");
const permissions_1 = require("../../common/constants/permissions");
let AuthService = class AuthService {
    constructor(prisma, usersService, jwtService, configService, otpService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.otpService = otpService;
    }
    async validateUser(email, password, tenantId) {
        console.log(`[Auth] Validating user: ${email}, tenantId: ${tenantId}`);
        let user;
        if (tenantId) {
            user = await this.usersService.findByEmail(email, tenantId);
        }
        else {
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
            throw new common_1.UnauthorizedException('Temporary password has expired. Please ask administrator to resend invite.');
        }
        return user;
    }
    async register(dto) {
        let tenantId = dto.tenantId;
        let isNewTenant = false;
        if (tenantId === 'demo-tenant') {
            tenantId = undefined;
        }
        if (!tenantId) {
            let domain = dto.email.split('@')[1].toLowerCase();
            const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];
            if (publicDomains.includes(domain)) {
                domain = `${domain}-${(0, uuid_1.v4)()}`;
            }
            const existingTenant = await this.prisma.tenant.findUnique({
                where: { domain },
            });
            if (existingTenant) {
                tenantId = existingTenant.id;
                const existingUser = await this.usersService.findByEmail(dto.email, tenantId);
                if (existingUser) {
                    throw new common_1.ConflictException('User with this email already exists in this organization');
                }
            }
            else {
                const newTenant = await this.prisma.tenant.create({
                    data: {
                        name: `${dto.firstName}'s Organization`,
                        domain,
                    },
                });
                tenantId = newTenant.id;
                isNewTenant = true;
            }
        }
        else {
            const existingUser = await this.usersService.findByEmail(dto.email, tenantId);
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists in this organization');
            }
        }
        const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
        const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: isNewTenant ? 'ADMIN' : (dto.role || 'RECRUITER'),
                status: 'PENDING',
                tenantId: tenantId,
            },
        });
        if (isNewTenant) {
            await this.otpService.requestOtp({
                email: user.email,
                tenantId: user.tenantId,
                type: otp_dto_1.OtpType.EMAIL_VERIFY,
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { status: 'ACTIVE' },
            });
        }
        return { message: 'Verification code sent to your email' };
    }
    async login(dto) {
        const user = await this.validateUser(dto.email, dto.password, dto.tenantId);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status === 'INACTIVE') {
            throw new common_1.UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
        }
        if (user.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Your account has been suspended. Please contact your administrator.');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Email not verified');
        }
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
    async refreshTokens(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        await this.prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        return this.generateTokens(storedToken.user);
    }
    async logout(userId) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async generateTokens(user) {
        const userPermissions = await this.resolvePermissions(user);
        const payload = {
            sub: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            permissions: userPermissions,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = (0, uuid_1.v4)();
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
    async generateTokensForUser(user) {
        return this.generateTokens(user);
    }
    async generateMagicLink(email, tenantId) {
        const token = (0, uuid_1.v4)();
        return `${this.configService.get('WEB_URL')}/auth/magic?token=${token}`;
    }
    async getUserById(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }
    async resolvePermissions(user) {
        if (user.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
            return [...user.customPermissions];
        }
        let permissions = [];
        if (user.roleDef && user.roleDef.permissions) {
            permissions = [...user.roleDef.permissions];
        }
        else {
            const role = user.role;
            permissions = [...(permissions_1.ROLE_PERMISSIONS[role] || [])];
        }
        return permissions;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_service_1.OtpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map