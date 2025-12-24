import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommonModule } from "../../common/common.module";
import { EmailTrackingModule } from "../email-tracking/email-tracking.module";
import { BulkEmailController } from "./bulk-email.controller";
import { BulkEmailService } from "./bulk-email.service";
import { ABTestingController } from "./ab-testing.controller";
import { ABTestingService } from "./ab-testing.service";

@Module({
  imports: [PrismaModule, CommonModule, EmailTrackingModule],
  controllers: [BulkEmailController, ABTestingController],
  providers: [BulkEmailService, ABTestingService],
  exports: [BulkEmailService, ABTestingService],
})
export class BulkEmailModule {}
