"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: process.env.WEB_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TalentX API')
        .setDescription('Ayphen TalentX - AI-first Applicant Tracking System API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication & Identity')
        .addTag('users', 'User Management')
        .addTag('jobs', 'Job Management')
        .addTag('candidates', 'Candidate Management')
        .addTag('applications', 'Application Management')
        .addTag('pipelines', 'Pipeline & Workflow')
        .addTag('workflows', 'Workflow Automations')
        .addTag('sla', 'SLA Management')
        .addTag('disposition', 'Disposition Reasons')
        .addTag('ai', 'AI Services')
        .addTag('reference', 'Reference Data')
        .addTag('saved-views', 'Saved Views')
        .addTag('settings', 'System Settings')
        .addTag('storage', 'File Storage')
        .addTag('health', 'Health Check')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/v1/docs', app, document);
    const port = process.env.API_PORT || 3001;
    await app.listen(port);
    console.log(`🚀 TalentX API running on http://localhost:${port}`);
    console.log(`📚 API Docs available at http://localhost:${port}/api/v1/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map