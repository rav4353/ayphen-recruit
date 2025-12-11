import { Module } from '@nestjs/common';
import { JobBoardsService } from './job-boards.service';
import { JobBoardsController } from './job-boards.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [JobBoardsController],
    providers: [JobBoardsService],
    exports: [JobBoardsService],
})
export class IntegrationsModule { }
