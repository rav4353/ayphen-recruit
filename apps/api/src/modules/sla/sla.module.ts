import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SlaService } from "./sla.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), SettingsModule],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
