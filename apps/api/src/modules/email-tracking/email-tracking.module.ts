import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailTrackingController } from './email-tracking.controller';
import { EmailTrackingService } from './email-tracking.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailTrackingController],
  providers: [EmailTrackingService],
  exports: [EmailTrackingService],
})
export class EmailTrackingModule {}
