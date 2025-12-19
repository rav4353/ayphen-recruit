import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminAuthService } from './services/super-admin-auth.service';
import { SuperAdminAuditService } from './services/super-admin-audit.service';
import { SuperAdminTenantsService } from './services/super-admin-tenants.service';
import { SuperAdminUsersService } from './services/super-admin-users.service';
import { SuperAdminSubscriptionsService } from './services/super-admin-subscriptions.service';
import { SuperAdminAnnouncementsService } from './services/super-admin-announcements.service';
import { SuperAdminSupportService } from './services/super-admin-support.service';
import { SuperAdminSecurityService } from './services/super-admin-security.service';
import { SuperAdminBillingService } from './services/super-admin-billing.service';
import { SuperAdminMonitoringService } from './services/super-admin-monitoring.service';
import { SuperAdminApiManagementService } from './services/super-admin-api-management.service';
import { SuperAdminSettingsService } from './services/super-admin-settings.service';
import { AuthModule } from '../auth/auth.module';
import { SuperAdminJwtStrategy } from './strategies/super-admin-jwt.strategy';
import { SuperAdminGateway } from './super-admin.gateway';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SUPER_ADMIN_JWT_SECRET') || configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '30m', // Shorter expiration for super admin
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminService,
    SuperAdminAuthService,
    SuperAdminAuditService,
    SuperAdminTenantsService,
    SuperAdminUsersService,
    SuperAdminSubscriptionsService,
    SuperAdminAnnouncementsService,
    SuperAdminSupportService,
    SuperAdminSecurityService,
    SuperAdminBillingService,
    SuperAdminMonitoringService,
    SuperAdminApiManagementService,
    SuperAdminJwtStrategy,
    SuperAdminGateway,
    SuperAdminSettingsService,
  ],
  exports: [SuperAdminService, SuperAdminSecurityService, SuperAdminSettingsService],
})
export class SuperAdminModule { }
