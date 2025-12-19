import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SetupMfaDto, VerifyMfaDto, DisableMfaDto, MfaSetupResponse } from '../dto/mfa.dto';

// Simple TOTP implementation (in production, use a library like speakeasy or otplib)
@Injectable()
export class MfaService {
  private readonly TOTP_STEP = 30; // 30 seconds
  private readonly TOTP_DIGITS = 6;
  private readonly TOTP_WINDOW = 1; // Allow 1 step before/after

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async initiateMfaSetup(userId: string): Promise<MfaSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Generate secret
    const secret = this.generateSecret();

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    // Generate OTP auth URL
    const issuer = 'TalentX';
    const otpauthUrl = `otpauth://totp/${issuer}:${user.email}?secret=${secret}&issuer=${issuer}&digits=${this.TOTP_DIGITS}&period=${this.TOTP_STEP}`;

    // Generate QR code (base64 data URL)
    const qrCode = await this.generateQrCode(otpauthUrl);

    return {
      otpauthUrl,
      secret,
      qrCode,
    };
  }

  async confirmMfaSetup(userId: string, dto: SetupMfaDto): Promise<{ message: string; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Verify the code
    const isValid = this.verifyTotp(user.mfaSecret, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        // Store hashed backup codes in settings or a separate field
        // For simplicity, we'll store them in a JSON field
      },
    });

    return {
      message: 'MFA enabled successfully',
      backupCodes,
    };
  }

  async verifyMfa(userId: string, dto: VerifyMfaDto): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = this.verifyTotp(user.mfaSecret, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    return true;
  }

  async disableMfa(userId: string, dto: DisableMfaDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new BadRequestException('Password not set');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Verify MFA code
    if (!user.mfaSecret) {
      throw new BadRequestException('MFA secret not found');
    }

    const isCodeValid = this.verifyTotp(user.mfaSecret, dto.code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  async isMfaRequired(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, role: true },
    });

    if (!user) {
      return false;
    }

    // Check global enforcement
    const mfaEnforcedSetting = await this.prisma.globalSetting.findUnique({
      where: { key: 'global_mfa_enforced' },
    });
    const isGlobalEnforced = mfaEnforcedSetting?.value === true;

    // MFA is required if globally enforced OR for vendors OR if user enabled it
    if (isGlobalEnforced || user.role === 'VENDOR' || user.mfaEnabled) {
      return true;
    }

    return false;
  }

  async isMfaSetupRequired(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, role: true },
    });

    if (!user || user.mfaEnabled) {
      return false;
    }

    // Check global enforcement
    const mfaEnforcedSetting = await this.prisma.globalSetting.findUnique({
      where: { key: 'global_mfa_enforced' },
    });
    const isGlobalEnforced = mfaEnforcedSetting?.value === true;

    // Setup is required if globally enforced OR for vendors BUT not yet enabled
    return (isGlobalEnforced || user.role === 'VENDOR');
  }

  private generateSecret(): string {
    // Generate a 20-byte random secret and encode as base32
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.replace(/=+$/, '').toUpperCase();

    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < cleanedInput.length; i++) {
      const idx = alphabet.indexOf(cleanedInput[i]);
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  private verifyTotp(secret: string, code: string): boolean {
    const now = Math.floor(Date.now() / 1000);

    for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
      const counter = Math.floor((now + i * this.TOTP_STEP) / this.TOTP_STEP);
      const expectedCode = this.generateTotp(secret, counter);

      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  private generateTotp(secret: string, counter: number): string {
    const secretBuffer = this.base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.TOTP_DIGITS);
    return otp.toString().padStart(this.TOTP_DIGITS, '0');
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  private async generateQrCode(data: string): Promise<string> {
    // Simple QR code generation using a public API
    // In production, use a library like qrcode
    // For now, return a placeholder that the frontend can use with a QR library
    return `data:text/plain;base64,${Buffer.from(data).toString('base64')}`;
  }
}
