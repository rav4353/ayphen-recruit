import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

import { CareerSiteService } from './career-site.service';
import { ApplicationFormService } from './application-form.service';
import { CustomDomainService } from './custom-domain.service';

import {
  CareerSiteAdminController,
  CustomDomainController,
  ApplicationFormAdminController,
  PublicCareerSiteController,
} from './career-site.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CareerSiteAdminController,
    CustomDomainController,
    ApplicationFormAdminController,
    PublicCareerSiteController,
  ],
  providers: [
    CareerSiteService,
    ApplicationFormService,
    CustomDomainService,
  ],
  exports: [
    CareerSiteService,
    ApplicationFormService,
    CustomDomainService,
  ],
})
export class CareerSiteModule {}
