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
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
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

  // Swagger API Documentation
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 TalentX API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api/v1/docs`);
}

bootstrap();
// Trigger rebuild 2025-12-10-11-29
