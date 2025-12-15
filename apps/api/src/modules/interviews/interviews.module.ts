import { Module } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarModule } from '../calendar/calendar.module';
import { InterviewReminderService } from './interview-reminder.service';
import { InterviewKitsService } from './interview-kits.service';
import { InterviewKitsController } from './interview-kits.controller';
import { InterviewSchedulingService } from './interview-scheduling.service';
import { InterviewSchedulingController, PublicSchedulingController } from './interview-scheduling.controller';

@Module({
    imports: [PrismaModule, CalendarModule],
    controllers: [InterviewsController, InterviewKitsController, InterviewSchedulingController, PublicSchedulingController],
    providers: [InterviewsService, InterviewReminderService, InterviewKitsService, InterviewSchedulingService],
    exports: [InterviewsService, InterviewKitsService, InterviewSchedulingService],
})
export class InterviewsModule { }
