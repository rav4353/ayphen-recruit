import { Module } from "@nestjs/common";
import { VideoMeetingService } from "./video-meeting.service";
import { VideoMeetingController } from "./video-meeting.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [VideoMeetingController],
  providers: [VideoMeetingService],
  exports: [VideoMeetingService],
})
export class VideoMeetingModule {}
