import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SetupMfaDto, VerifyMfaDto, DisableMfaDto, MfaSetupResponse } from '../dto/mfa.dto';
export declare class MfaService {
    private readonly prisma;
    private readonly configService;
    private readonly TOTP_STEP;
    private readonly TOTP_DIGITS;
    private readonly TOTP_WINDOW;
    constructor(prisma: PrismaService, configService: ConfigService);
    initiateMfaSetup(userId: string): Promise<MfaSetupResponse>;
    confirmMfaSetup(userId: string, dto: SetupMfaDto): Promise<{
        message: string;
        backupCodes: string[];
    }>;
    verifyMfa(userId: string, dto: VerifyMfaDto): Promise<boolean>;
    disableMfa(userId: string, dto: DisableMfaDto): Promise<{
        message: string;
    }>;
    isMfaRequired(userId: string): Promise<boolean>;
    private generateSecret;
    private base32Encode;
    private base32Decode;
    private verifyTotp;
    private generateTotp;
    private generateBackupCodes;
    private generateQrCode;
}
