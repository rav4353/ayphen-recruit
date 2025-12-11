import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';
import { MfaService } from './services/mfa.service';
import { SessionService } from './services/session.service';
import { LoginAttemptService } from './services/login-attempt.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    PasswordService,
    OtpService,
    MfaService,
    SessionService,
    LoginAttemptService,
  ],
  exports: [
    AuthService,
    PasswordService,
    OtpService,
    MfaService,
    SessionService,
    LoginAttemptService,
  ],
})
export class AuthModule {}
