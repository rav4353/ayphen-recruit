import { Module } from '@nestjs/common';
import { DispositionService } from './disposition.service';
import { DispositionController } from './disposition.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DispositionController],
    providers: [DispositionService],
    exports: [DispositionService],
})
export class DispositionModule { }
