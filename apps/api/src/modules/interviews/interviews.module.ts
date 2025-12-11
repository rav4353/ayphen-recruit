import { Module } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { InterviewReminderService } from './interview-reminder.service';

@Module({
    imports: [PrismaModule],
    controllers: [InterviewsController],
    providers: [InterviewsService, InterviewReminderService],
    exports: [InterviewsService],
})
export class InterviewsModule { }
