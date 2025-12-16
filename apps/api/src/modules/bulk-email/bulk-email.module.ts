import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { BulkEmailController } from './bulk-email.controller';
import { BulkEmailService } from './bulk-email.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BulkEmailController],
  providers: [BulkEmailService],
  exports: [BulkEmailService],
})
export class BulkEmailModule {}
