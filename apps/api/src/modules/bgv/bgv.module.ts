import { Module } from '@nestjs/common';
import { BGVController } from './bgv.controller';
import { BGVService } from './bgv.service';
import { CheckrService } from './providers/checkr.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BGVController],
    providers: [BGVService, CheckrService],
    exports: [BGVService],
})
export class BGVModule {}
