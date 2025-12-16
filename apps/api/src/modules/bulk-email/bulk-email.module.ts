import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { EmailTrackingModule } from '../email-tracking/email-tracking.module';
import { BulkEmailController } from './bulk-email.controller';
import { BulkEmailService } from './bulk-email.service';

@Module({
  imports: [PrismaModule, CommonModule, EmailTrackingModule],
  controllers: [BulkEmailController],
  providers: [BulkEmailService],
  exports: [BulkEmailService],
})
export class BulkEmailModule {}
