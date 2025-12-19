import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  const allowedOrigins = [
    process.env.WEB_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Raw body support for Stripe Webhooks
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({
    verify: (req: any, res: any, buf: Buffer) => {
      if (req.originalUrl && req.originalUrl.includes('/webhook')) {
        req.rawBody = buf;
      }
    },
  }));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Ayphen TalentX API')
    .setDescription(`
# Ayphen TalentX - AI-first Applicant Tracking System

## Overview
TalentX is a modern, enterprise-grade ATS designed to streamline the entire hiring lifecycle—from job creation to onboarding.

## Authentication
All API endpoints (except public endpoints) require JWT Bearer token authentication.
1. Call \`POST /api/v1/auth/login\` with email and password
2. Include the token in the \`Authorization: Bearer <token>\` header

## Rate Limiting
- Standard endpoints: 100 requests/minute
- AI endpoints: 20 requests/minute
- Public endpoints: 50 requests/minute

## Multi-tenancy
Most endpoints are tenant-scoped. The tenant is determined from the authenticated user's JWT token.

## Response Format
All responses follow a standard format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}
\`\`\`

## Error Handling
Errors return appropriate HTTP status codes with details:
\`\`\`json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human readable message" }
}
\`\`\`
    `)
    .setVersion('1.0.0')
    .setContact('Ayphen Engineering', 'https://ayphen.com', 'engineering@ayphen.com')
    .setLicense('Proprietary', 'https://ayphen.com/license')
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://api.staging.ayphen.com', 'Staging')
    .addServer('https://api.ayphen.com', 'Production')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    // Core Modules
    .addTag('auth', 'Authentication & Identity - Login, SSO, MFA, Sessions')
    .addTag('users', 'User Management - CRUD, Roles, Permissions')
    .addTag('roles', 'Role Management - Custom roles and permissions')
    // Job Management
    .addTag('jobs', 'Job Management - Create, publish, manage job requisitions')
    .addTag('job-templates', 'Job Templates - Reusable job configurations')
    // Candidate Management
    .addTag('candidates', 'Candidate Management - Profiles, search, notes')
    .addTag('candidate-notes', 'Candidate Notes - Comments and activity')
    .addTag('candidate-comparison', 'Candidate Comparison - Side-by-side analysis')
    // Applications
    .addTag('applications', 'Application Management - Track candidate applications')
    .addTag('bulk-actions', 'Bulk Actions - Mass operations on applications')
    // Pipeline & Workflow
    .addTag('pipelines', 'Pipeline Management - Hiring stages and workflows')
    .addTag('workflows', 'Workflow Automations - Triggers and actions')
    .addTag('sla', 'SLA Management - Service level agreements')
    .addTag('disposition', 'Disposition - Rejection and withdrawal reasons')
    // Interviews
    .addTag('interviews', 'Interview Management - Schedule, feedback, kits')
    .addTag('interview-scheduling', 'Interview Scheduling - Calendar integration')
    .addTag('scorecards', 'Scorecards - Interview evaluation templates')
    // Offers
    .addTag('offers', 'Offer Management - Create, approve, send offers')
    .addTag('offer-templates', 'Offer Templates - Letter templates')
    .addTag('esignature', 'E-Signature - DocuSign integration')
    // Communication
    .addTag('communication', 'Communication - Email, SMS, templates')
    .addTag('notifications', 'Notifications - In-app alerts')
    // Onboarding
    .addTag('onboarding', 'Onboarding - New hire workflows')
    // AI & Intelligence
    .addTag('ai', 'AI Services - JD generation, resume parsing, matching')
    // Integrations
    .addTag('integrations-job-boards', 'Job Board Integrations - LinkedIn, Indeed, etc.')
    .addTag('integrations-linkedin', 'LinkedIn Apply - OAuth integration')
    .addTag('integrations-indeed', 'Indeed Feed - XML job feed')
    .addTag('integrations-ziprecruiter', 'ZipRecruiter - Job posting API')
    .addTag('integrations-hris', 'HRIS Sync - Workday, BambooHR, ADP')
    .addTag('integrations-messaging', 'Slack/Teams - Notification integrations')
    .addTag('integrations-webhooks', 'Webhooks - Event notifications')
    // Career Site
    .addTag('career-site-admin', 'Career Site Builder - Branding, layout, pages')
    .addTag('career-site-domain', 'Custom Domains - Subdomain and custom domain')
    .addTag('application-form-admin', 'Application Form - Field customization')
    .addTag('public-career-site', 'Public Career Site - Job listings (no auth)')
    // Analytics & Reports
    .addTag('analytics', 'Analytics - Dashboard metrics')
    .addTag('reports', 'Reports - Custom reports and exports')
    // Reference Data
    .addTag('reference', 'Reference Data - Skills, locations, currencies')
    .addTag('saved-views', 'Saved Views - Filter presets')
    // Admin
    .addTag('settings', 'System Settings - Tenant configuration')
    .addTag('storage', 'File Storage - Upload and download files')
    .addTag('health', 'Health Check - System status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 TalentX API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api/v1/docs`);
}

bootstrap();
// Trigger rebuild 2025-12-16-11-20
// DB Schema Sync forced rebuild
