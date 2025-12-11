import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { EmailService } from '../../../common/services/email.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
export declare class PasswordService {
    private readonly prisma;
    private readonly usersService;
    private readonly configService;
    private readonly emailService;
    private readonly PASSWORD_HISTORY_COUNT;
    private readonly RESET_TOKEN_EXPIRY_HOURS;
    constructor(prisma: PrismaService, usersService: UsersService, configService: ConfigService, emailService: EmailService);
    requestPasswordReset(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    private isPasswordReused;
    validatePasswordStrength(password: string): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
}
