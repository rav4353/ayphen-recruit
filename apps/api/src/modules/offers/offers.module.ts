import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { CommunicationModule } from '../communication/communication.module';
import { ConfigModule } from '@nestjs/config';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
    imports: [PrismaModule, CommunicationModule, ConfigModule, OnboardingModule],
    controllers: [OffersController],
    providers: [OffersService],
    exports: [OffersService],
})
export class OffersModule { }
