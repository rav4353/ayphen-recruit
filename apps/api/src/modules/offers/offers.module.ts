import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { CommunicationModule } from '../communication/communication.module';
import { ConfigModule } from '@nestjs/config';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
    imports: [PrismaModule, CommunicationModule, ConfigModule, OnboardingModule, SettingsModule],
    controllers: [OffersController],
    providers: [OffersService],
    exports: [OffersService],
})
export class OffersModule { }
