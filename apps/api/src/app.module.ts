import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { SavedViewsModule } from './modules/saved-views/saved-views.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { SlaModule } from './modules/sla/sla.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { StorageModule } from './modules/storage/storage.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OfferTemplatesModule } from './modules/offer-templates/offer-templates.module';
import { OffersModule } from './modules/offers/offers.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ScorecardsModule } from './modules/scorecards/scorecards.module';

// Health check
import { HealthModule } from './modules/health/health.module';
import { RolesModule } from './modules/roles/roles.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ESignatureModule } from './modules/esignature/esignature.module';
import { BGVModule } from './modules/bgv/bgv.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CareerSiteModule } from './modules/career-site/career-site.module';
import { BulkImportModule } from './modules/bulk-import/bulk-import.module';
import { AuditModule } from './modules/audit/audit.module';
import { SourcingModule } from './modules/sourcing/sourcing.module';
import { TalentPoolsModule } from './modules/talent-pools/talent-pools.module';
import { BulkEmailModule } from './modules/bulk-email/bulk-email.module';
import { EmailTrackingModule } from './modules/email-tracking/email-tracking.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { SavedJobsModule } from './modules/saved-jobs/saved-jobs.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

import { BlockedIpMiddleware } from './common/middleware/blocked-ip.middleware';
import { MaintenanceMiddleware } from './common/middleware/maintenance.middleware';

@Module({
  imports: [
    // Configuration - check local .env first, then root .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Common services (Email, etc.)
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    PipelinesModule,
    SavedViewsModule,
    WorkflowsModule,
    SlaModule,
    AiModule,
    IntegrationsModule,
    SettingsModule,
    ReferenceModule,
    StorageModule,
    InterviewsModule,
    AnalyticsModule,
    ReportsModule,
    OfferTemplatesModule,
    OffersModule,
    OnboardingModule,
    CommunicationModule,
    ScorecardsModule,
    HealthModule,
    CalendarModule,
    ESignatureModule,
    BGVModule,
    NotificationsModule,
    AssessmentsModule,
    CareerSiteModule,
    BulkImportModule,
    AuditModule,
    SourcingModule,
    TalentPoolsModule,
    BulkEmailModule,
    SuperAdminModule,
    SavedJobsModule,
    PaymentsModule,
    AnnouncementsModule,

    // Serve static files (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    RolesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BlockedIpMiddleware, MaintenanceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
