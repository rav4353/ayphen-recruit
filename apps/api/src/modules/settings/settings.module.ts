import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";
import { DepartmentsService } from "./departments.service";
import { DepartmentsController } from "./departments.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController, DepartmentsController],
  providers: [SettingsService, DepartmentsService],
  exports: [SettingsService, DepartmentsService],
})
export class SettingsModule {}
