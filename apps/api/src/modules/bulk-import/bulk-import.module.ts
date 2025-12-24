import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { PrismaModule } from "../../prisma/prisma.module";
import { BulkImportService } from "./bulk-import.service";
import { BulkImportController } from "./bulk-import.controller";
import { AiModule } from "../ai/ai.module";
import { StorageModule } from "../storage/storage.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [
    PrismaModule,
    AiModule,
    StorageModule,
    SettingsModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 50, // Max 50 files at once
      },
    }),
  ],
  controllers: [BulkImportController],
  providers: [BulkImportService],
  exports: [BulkImportService],
})
export class BulkImportModule {}
