import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [OnboardingController],
    providers: [OnboardingService, PrismaService],
    exports: [OnboardingService],
})
export class OnboardingModule { }
