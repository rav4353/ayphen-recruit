import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { SetupMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly otpService: OtpService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly loginAttemptService: LoginAttemptService,
  ) { }

  // ==================== Basic Auth ====================

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 423, description: 'Account locked' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    console.log('[AuthController] Login attempt:', { email: dto.email, tenantId: dto.tenantId });
    // Check if account is locked
    const lockStatus = await this.loginAttemptService.isAccountLocked(
      dto.email,
      dto.tenantId,
    );
    if (lockStatus.locked) {
      return {
        error: 'Account locked',
        message: `Too many failed attempts. Try again in ${lockStatus.remainingMinutes} minutes.`,
      };
    }

    try {
      const result = await this.authService.login(dto);

      // Record successful attempt
      await this.loginAttemptService.recordAttempt(
        dto.email,
        dto.tenantId,
        ipAddress,
        true,
      );

      // Check if MFA is required
      const user = result.user;

      if (user && await this.mfaService.isMfaRequired(user.id)) {
        return {
          requiresMfa: true,
          mfaToken: result.accessToken, // Temporary token for MFA verification
        };
      }

      // Create session
      const session = await this.sessionService.createSession(
        user.id,
        userAgent,
        ipAddress,
      );

      return {
        ...result,
        sessionToken: session.sessionToken,
        sessionExpiresAt: session.expiresAt,
      };
    } catch (error) {
      // Record failed attempt
      await this.loginAttemptService.recordAttempt(
        dto.email,
        dto.tenantId,
        ipAddress,
        false,
      );
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.sub);
    await this.sessionService.terminateAllSessions(req.user.sub);
    return { message: 'Logged out successfully' };
  }

  // ==================== Password Management ====================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.passwordService.changePassword(req.user.sub, dto);
  }

  // ==================== OTP (Candidate) ====================

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.otpService.verifyOtp(dto);

    // If it's a login OTP, create session
    if ('accessToken' in result) {
      const payload = JSON.parse(
        Buffer.from(result.accessToken.split('.')[1], 'base64').toString(),
      );
      const session = await this.sessionService.createSession(
        payload.sub,
        userAgent,
        ipAddress,
      );

      return {
        ...result,
        sessionToken: session.sessionToken,
        sessionExpiresAt: session.expiresAt,
      };
    }

    return result;
  }

  // ==================== MFA (Vendor/Admin) ====================

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async initiateMfaSetup(@Request() req: AuthenticatedRequest) {
    return this.mfaService.initiateMfaSetup(req.user.sub);
  }

  @Post('mfa/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm MFA setup with verification code' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async confirmMfaSetup(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SetupMfaDto,
  ) {
    return this.mfaService.confirmMfaSetup(req.user.sub, dto);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code during login' })
  @ApiResponse({ status: 200, description: 'MFA verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async verifyMfa(
    @Request() req: AuthenticatedRequest,
    @Body() dto: VerifyMfaDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.mfaService.verifyMfa(req.user.sub, dto);

    // Create full session after MFA verification
    const session = await this.sessionService.createSession(
      req.user.sub,
      userAgent,
      ipAddress,
    );

    // Generate new tokens (full access)
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

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async disableMfa(
    @Request() req: AuthenticatedRequest,
    @Body() dto: DisableMfaDto,
  ) {
    return this.mfaService.disableMfa(req.user.sub, dto);
  }

  @Get('mfa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MFA status' })
  @ApiResponse({ status: 200, description: 'MFA status retrieved' })
  async getMfaStatus(@Request() req: AuthenticatedRequest) {
    const isRequired = await this.mfaService.isMfaRequired(req.user.sub);
    const user = await this.authService.getUserById(req.user.sub);
    return {
      enabled: user?.mfaEnabled || false,
      required: isRequired,
    };
  }

  // ==================== Session Management ====================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved' })
  async getSessions(
    @Request() req: AuthenticatedRequest,
    @Headers('x-session-token') currentSessionToken: string,
  ) {
    return this.sessionService.getUserSessions(req.user.sub, currentSessionToken);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate a specific session' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  async terminateSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    await this.sessionService.terminateSession(sessionId, req.user.sub);
    return { message: 'Session terminated' };
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate all other sessions' })
  @ApiResponse({ status: 200, description: 'All other sessions terminated' })
  async terminateAllSessions(
    @Request() req: AuthenticatedRequest,
    @Headers('x-session-token') currentSessionToken: string,
  ) {
    await this.sessionService.terminateAllSessions(req.user.sub, currentSessionToken);
    return { message: 'All other sessions terminated' };
  }

  @Post('sessions/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh session to extend timeout' })
  @ApiResponse({ status: 200, description: 'Session refreshed' })
  async refreshSession(@Headers('x-session-token') sessionToken: string) {
    return this.sessionService.refreshSession(sessionToken);
  }

  @Get('session-timeout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session timeout configuration' })
  @ApiResponse({ status: 200, description: 'Session timeout config retrieved' })
  async getSessionTimeout(@Request() req: AuthenticatedRequest) {
    return this.sessionService.getSessionTimeout(req.user.role);
  }
}
