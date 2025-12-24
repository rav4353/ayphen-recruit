import { Module } from "@nestjs/common";
import { InterviewsService } from "./interviews.service";
import {
  InterviewsController,
  InterviewsPublicController,
  InterviewSelfScheduleController,
} from "./interviews.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { CalendarModule } from "../calendar/calendar.module";
import { InterviewReminderService } from "./interview-reminder.service";
import { InterviewKitsService } from "./interview-kits.service";
import { InterviewKitsController } from "./interview-kits.controller";
import { InterviewSchedulingService } from "./interview-scheduling.service";
import {
  InterviewSchedulingController,
  PublicSchedulingController,
} from "./interview-scheduling.controller";
import { InterviewAnalyticsService } from "./interview-analytics.service";
import { InterviewAnalyticsController } from "./interview-analytics.controller";
import { SmsService } from "../../common/services/sms.service";

@Module({
  imports: [PrismaModule, CalendarModule],
  controllers: [
    InterviewsController,
    InterviewsPublicController,
    InterviewSelfScheduleController,
    InterviewKitsController,
    InterviewSchedulingController,
    PublicSchedulingController,
    InterviewAnalyticsController,
  ],
  providers: [
    InterviewsService,
    InterviewReminderService,
    InterviewKitsService,
    InterviewSchedulingService,
    InterviewAnalyticsService,
    SmsService,
  ],
  exports: [
    InterviewsService,
    InterviewKitsService,
    InterviewSchedulingService,
    InterviewReminderService,
    InterviewAnalyticsService,
  ],
})
export class InterviewsModule { }
