import { Global, Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import { SubscriptionGuard, PlanLimitGuard } from './guards/subscription.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EmailService, FeatureFlagGuard, SubscriptionGuard, PlanLimitGuard],
  exports: [EmailService, FeatureFlagGuard, SubscriptionGuard, PlanLimitGuard],
})
export class CommonModule { }
