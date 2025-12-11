"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const serve_static_1 = require("@nestjs/serve-static");
const schedule_1 = require("@nestjs/schedule");
const path_1 = require("path");
const prisma_module_1 = require("./prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const candidates_module_1 = require("./modules/candidates/candidates.module");
const applications_module_1 = require("./modules/applications/applications.module");
const pipelines_module_1 = require("./modules/pipelines/pipelines.module");
const saved_views_module_1 = require("./modules/saved-views/saved-views.module");
const workflows_module_1 = require("./modules/workflows/workflows.module");
const sla_module_1 = require("./modules/sla/sla.module");
const disposition_module_1 = require("./modules/disposition/disposition.module");
const ai_module_1 = require("./modules/ai/ai.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const settings_module_1 = require("./modules/settings/settings.module");
const reference_module_1 = require("./modules/reference/reference.module");
const storage_module_1 = require("./modules/storage/storage.module");
const interviews_module_1 = require("./modules/interviews/interviews.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const reports_module_1 = require("./modules/reports/reports.module");
const offer_templates_module_1 = require("./modules/offer-templates/offer-templates.module");
const offers_module_1 = require("./modules/offers/offers.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const communication_module_1 = require("./modules/communication/communication.module");
const scorecards_module_1 = require("./modules/scorecards/scorecards.module");
const health_module_1 = require("./modules/health/health.module");
const roles_module_1 = require("./modules/roles/roles.module");
const calendar_module_1 = require("./modules/calendar/calendar.module");
const esignature_module_1 = require("./modules/esignature/esignature.module");
const bgv_module_1 = require("./modules/bgv/bgv.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env', '../../.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            jobs_module_1.JobsModule,
            candidates_module_1.CandidatesModule,
            applications_module_1.ApplicationsModule,
            pipelines_module_1.PipelinesModule,
            saved_views_module_1.SavedViewsModule,
            workflows_module_1.WorkflowsModule,
            sla_module_1.SlaModule,
            disposition_module_1.DispositionModule,
            ai_module_1.AiModule,
            integrations_module_1.IntegrationsModule,
            settings_module_1.SettingsModule,
            reference_module_1.ReferenceModule,
            storage_module_1.StorageModule,
            interviews_module_1.InterviewsModule,
            analytics_module_1.AnalyticsModule,
            reports_module_1.ReportsModule,
            offer_templates_module_1.OfferTemplatesModule,
            offers_module_1.OffersModule,
            onboarding_module_1.OnboardingModule,
            communication_module_1.CommunicationModule,
            scorecards_module_1.ScorecardsModule,
            health_module_1.HealthModule,
            calendar_module_1.CalendarModule,
            esignature_module_1.ESignatureModule,
            bgv_module_1.BGVModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            roles_module_1.RolesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map