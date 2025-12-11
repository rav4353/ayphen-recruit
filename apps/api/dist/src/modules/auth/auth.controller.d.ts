import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { SetupMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';
import { MfaService } from './services/mfa.service';
import { SessionService } from './services/session.service';
import { LoginAttemptService } from './services/login-attempt.service';
interface AuthenticatedRequest {
    user: {
        sub: string;
        email: string;
        role: string;
        tenantId: string;
    };
}
export declare class AuthController {
    private readonly authService;
    private readonly passwordService;
    private readonly otpService;
    private readonly mfaService;
    private readonly sessionService;
    private readonly loginAttemptService;
    constructor(authService: AuthService, passwordService: PasswordService, otpService: OtpService, mfaService: MfaService, sessionService: SessionService, loginAttemptService: LoginAttemptService);
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, ipAddress: string, userAgent: string): Promise<{
        error: string;
        message: string;
        requiresMfa?: undefined;
        mfaToken?: undefined;
    } | {
        requiresMfa: boolean;
        mfaToken: string;
        error?: undefined;
        message?: undefined;
    } | {
        sessionToken: string;
        sessionExpiresAt: Date;
        accessToken: string;
        refreshToken: string;
        requirePasswordChange?: boolean;
        user: any;
        error?: undefined;
        message?: undefined;
        requiresMfa?: undefined;
        mfaToken?: undefined;
    }>;
    refresh(dto: RefreshTokenDto): Promise<import("./auth.service").AuthTokens>;
    logout(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: AuthenticatedRequest, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        code?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto, ipAddress: string, userAgent: string): Promise<{
        verified: true;
    } | {
        sessionToken: string;
        sessionExpiresAt: Date;
        accessToken: string;
        refreshToken: string;
    }>;
    initiateMfaSetup(req: AuthenticatedRequest): Promise<import("./dto/mfa.dto").MfaSetupResponse>;
    confirmMfaSetup(req: AuthenticatedRequest, dto: SetupMfaDto): Promise<{
        message: string;
        backupCodes: string[];
    }>;
    verifyMfa(req: AuthenticatedRequest, dto: VerifyMfaDto, ipAddress: string, userAgent: string): Promise<{
        sessionToken: string;
        sessionExpiresAt: Date;
        mfaVerified: boolean;
        accessToken: string;
        refreshToken: string;
    }>;
    disableMfa(req: AuthenticatedRequest, dto: DisableMfaDto): Promise<{
        message: string;
    }>;
    getMfaStatus(req: AuthenticatedRequest): Promise<{
        enabled: boolean;
        required: boolean;
    }>;
    getSessions(req: AuthenticatedRequest, currentSessionToken: string): Promise<import("./services/session.service").SessionInfo[]>;
    terminateSession(req: AuthenticatedRequest, sessionId: string): Promise<{
        message: string;
    }>;
    terminateAllSessions(req: AuthenticatedRequest, currentSessionToken: string): Promise<{
        message: string;
    }>;
    refreshSession(sessionToken: string): Promise<{
        expiresAt: Date;
    }>;
    getSessionTimeout(req: AuthenticatedRequest): Promise<{
        timeoutMinutes: number;
        warningMinutes: number;
    }>;
}
export {};
