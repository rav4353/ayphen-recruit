import { Module } from '@nestjs/common';
import { ScorecardsService } from './scorecards.service';
import { ScorecardsController } from './scorecards.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ScorecardsController],
    providers: [ScorecardsService],
    exports: [ScorecardsService],
})
export class ScorecardsModule { }
