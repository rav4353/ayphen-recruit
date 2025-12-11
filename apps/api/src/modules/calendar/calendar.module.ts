import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { GoogleCalendarService } from './providers/google-calendar.service';
import { OutlookCalendarService } from './providers/outlook-calendar.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CalendarController],
    providers: [
        CalendarService,
        GoogleCalendarService,
        OutlookCalendarService,
    ],
    exports: [CalendarService],
})
export class CalendarModule { }
