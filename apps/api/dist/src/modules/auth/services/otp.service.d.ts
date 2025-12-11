import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../../common/services/email.service';
import { RequestOtpDto, VerifyOtpDto } from '../dto/otp.dto';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class OtpService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    private readonly emailService;
    private readonly OTP_EXPIRY_MINUTES;
    private readonly MAX_OTP_ATTEMPTS;
    private readonly OTP_LENGTH;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService, emailService: EmailService);
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        code?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens | {
        verified: true;
    }>;
    private generateOtp;
    private generateTokens;
}
