import { Module } from '@nestjs/common';
import { TalentPoolsService } from './talent-pools.service';
import { TalentPoolsController } from './talent-pools.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TalentPoolsController],
  providers: [TalentPoolsService, PrismaService],
  exports: [TalentPoolsService],
})
export class TalentPoolsModule {}
