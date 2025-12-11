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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const otp_dto_1 = require("./dto/otp.dto");
const mfa_dto_1 = require("./dto/mfa.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const password_service_1 = require("./services/password.service");
const otp_service_1 = require("./services/otp.service");
const mfa_service_1 = require("./services/mfa.service");
const session_service_1 = require("./services/session.service");
const login_attempt_service_1 = require("./services/login-attempt.service");
let AuthController = class AuthController {
    constructor(authService, passwordService, otpService, mfaService, sessionService, loginAttemptService) {
        this.authService = authService;
        this.passwordService = passwordService;
        this.otpService = otpService;
        this.mfaService = mfaService;
        this.sessionService = sessionService;
        this.loginAttemptService = loginAttemptService;
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async login(dto, ipAddress, userAgent) {
        console.log('[AuthController] Login attempt:', { email: dto.email, tenantId: dto.tenantId });
        const lockStatus = await this.loginAttemptService.isAccountLocked(dto.email, dto.tenantId);
        if (lockStatus.locked) {
            return {
                error: 'Account locked',
                message: `Too many failed attempts. Try again in ${lockStatus.remainingMinutes} minutes.`,
            };
        }
        try {
            const result = await this.authService.login(dto);
            await this.loginAttemptService.recordAttempt(dto.email, dto.tenantId, ipAddress, true);
            const user = result.user;
            if (user && await this.mfaService.isMfaRequired(user.id)) {
                return {
                    requiresMfa: true,
                    mfaToken: result.accessToken,
                };
            }
            const session = await this.sessionService.createSession(user.id, userAgent, ipAddress);
            return {
                ...result,
                sessionToken: session.sessionToken,
                sessionExpiresAt: session.expiresAt,
            };
        }
        catch (error) {
            await this.loginAttemptService.recordAttempt(dto.email, dto.tenantId, ipAddress, false);
            throw error;
        }
    }
    async refresh(dto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }
    async logout(req) {
        await this.authService.logout(req.user.sub);
        await this.sessionService.terminateAllSessions(req.user.sub);
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(dto) {
        return this.passwordService.requestPasswordReset(dto);
    }
    async resetPassword(dto) {
        return this.passwordService.resetPassword(dto);
    }
    async changePassword(req, dto) {
        return this.passwordService.changePassword(req.user.sub, dto);
    }
    async requestOtp(dto) {
        return this.otpService.requestOtp(dto);
    }
    async verifyOtp(dto, ipAddress, userAgent) {
        const result = await this.otpService.verifyOtp(dto);
        if ('accessToken' in result) {
            const payload = JSON.parse(Buffer.from(result.accessToken.split('.')[1], 'base64').toString());
            const session = await this.sessionService.createSession(payload.sub, userAgent, ipAddress);
            return {
                ...result,
                sessionToken: session.sessionToken,
                sessionExpiresAt: session.expiresAt,
            };
        }
        return result;
    }
    async initiateMfaSetup(req) {
        return this.mfaService.initiateMfaSetup(req.user.sub);
    }
    async confirmMfaSetup(req, dto) {
        return this.mfaService.confirmMfaSetup(req.user.sub, dto);
    }
    async verifyMfa(req, dto, ipAddress, userAgent) {
        await this.mfaService.verifyMfa(req.user.sub, dto);
        const session = await this.sessionService.createSession(req.user.sub, userAgent, ipAddress);
        const user = await this.authService.getUserById(req.user.sub);
        if (!user) {
            throw new Error('User not found');
        }
        const tokens = await this.authService.generateTokensForUser(user);
        return {
            ...tokens,
            sessionToken: session.sessionToken,
            sessionExpiresAt: session.expiresAt,
            mfaVerified: true,
        };
    }
    async disableMfa(req, dto) {
        return this.mfaService.disableMfa(req.user.sub, dto);
    }
    async getMfaStatus(req) {
        const isRequired = await this.mfaService.isMfaRequired(req.user.sub);
        const user = await this.authService.getUserById(req.user.sub);
        return {
            enabled: user?.mfaEnabled || false,
            required: isRequired,
        };
    }
    async getSessions(req, currentSessionToken) {
        return this.sessionService.getUserSessions(req.user.sub, currentSessionToken);
    }
    async terminateSession(req, sessionId) {
        await this.sessionService.terminateSession(sessionId, req.user.sub);
        return { message: 'Session terminated' };
    }
    async terminateAllSessions(req, currentSessionToken) {
        await this.sessionService.terminateAllSessions(req.user.sub, currentSessionToken);
        return { message: 'All other sessions terminated' };
    }
    async refreshSession(sessionToken) {
        return this.sessionService.refreshSession(sessionToken);
    }
    async getSessionTimeout(req) {
        return this.sessionService.getSessionTimeout(req.user.role);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    (0, swagger_1.ApiResponse)({ status: 423, description: 'Account locked' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset link' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reset link sent if account exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Change password for authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Current password incorrect' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('otp/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request OTP for login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_dto_1.VerifyOtpDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('mfa/setup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate MFA setup' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MFA setup initiated' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "initiateMfaSetup", null);
__decorate([
    (0, common_1.Post)('mfa/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm MFA setup with verification code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MFA enabled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid verification code' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_dto_1.SetupMfaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmMfaSetup", null);
__decorate([
    (0, common_1.Post)('mfa/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify MFA code during login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MFA verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid verification code' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_dto_1.VerifyMfaDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMfa", null);
__decorate([
    (0, common_1.Post)('mfa/disable'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disable MFA' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MFA disabled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mfa_dto_1.DisableMfaDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableMfa", null);
__decorate([
    (0, common_1.Get)('mfa/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get MFA status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MFA status retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMfaStatus", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sessions retrieved' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('x-session-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate a specific session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session terminated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "terminateSession", null);
__decorate([
    (0, common_1.Delete)('sessions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate all other sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All other sessions terminated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('x-session-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "terminateAllSessions", null);
__decorate([
    (0, common_1.Post)('sessions/refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh session to extend timeout' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session refreshed' }),
    __param(0, (0, common_1.Headers)('x-session-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshSession", null);
__decorate([
    (0, common_1.Get)('session-timeout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get session timeout configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session timeout config retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSessionTimeout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        password_service_1.PasswordService,
        otp_service_1.OtpService,
        mfa_service_1.MfaService,
        session_service_1.SessionService,
        login_attempt_service_1.LoginAttemptService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map