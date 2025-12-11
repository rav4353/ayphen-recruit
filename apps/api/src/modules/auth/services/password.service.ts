import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { EmailService } from '../../../common/services/email.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class PasswordService {
  private readonly PASSWORD_HISTORY_COUNT = 3;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) { }

  async requestPasswordReset(dto: ForgotPasswordDto): Promise<{ message: string }> {
    let user;
    if (dto.tenantId) {
      user = await this.usersService.findByEmail(dto.email, dto.tenantId);
    } else {
      // Find user by email across all tenants (pick first active)
      const users = await this.prisma.user.findMany({
        where: { email: dto.email },
      });
      if (users.length > 0) {
        user = users[0];
      }
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists, a password reset link has been sent' };
    }

    // Invalidate any existing reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email with reset link
    const resetLink = `${this.configService.get('WEB_URL') || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    // Send password reset email without blocking the response
    this.emailService
      .sendPasswordResetEmail(user.email, resetLink)
      .catch((err) => {
        // Log but do not fail the request for email issues
        console.error('Failed to send password reset email', err);
      });

    return { message: 'If an account exists, a password reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('This reset link has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('This reset link has expired');
    }

    // Check password history
    const isReused = await this.isPasswordReused(resetToken.userId, dto.newPassword);
    if (isReused) {
      throw new BadRequestException(
        `New password cannot be the same as your last ${this.PASSWORD_HISTORY_COUNT} passwords`,
      );
    }

    // Hash new password
    const saltRounds =
      Number(this.configService.get('BCRYPT_ROUNDS')) || 12;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password and mark token as used
    await this.prisma.$transaction([
      // Update user password
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      // Add to password history
      this.prisma.passwordHistory.create({
        data: {
          userId: resetToken.userId,
          passwordHash,
        },
      }),
      // Mark token as used
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens (force logout)
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
      // Invalidate all sessions
      this.prisma.userSession.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check password history
    const isReused = await this.isPasswordReused(userId, dto.newPassword);
    if (isReused) {
      throw new BadRequestException(
        `New password cannot be the same as your last ${this.PASSWORD_HISTORY_COUNT} passwords`,
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          requirePasswordChange: false, // Clear the flag after password change
          tempPasswordExpiresAt: null, // Clear expiration of temp password
        },
      }),
      this.prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        },
      }),
      // Invalidate all other sessions except current
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);

    return { message: 'Password changed successfully' };
  }

  private async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    // Get last N passwords from history
    const passwordHistory = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: this.PASSWORD_HISTORY_COUNT,
    });

    // Also check current password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const hashesToCheck = [
      ...(user?.passwordHash ? [user.passwordHash] : []),
      ...passwordHistory.map((ph) => ph.passwordHash),
    ];

    for (const hash of hashesToCheck) {
      if (await bcrypt.compare(newPassword, hash)) {
        return true;
      }
    }

    return false;
  }

  async validatePasswordStrength(password: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
