import { Module } from "@nestjs/common";
import { AssessmentsService } from "./assessments.service";
import { AssessmentsController } from "./assessments.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { EmailService } from "../../common/services/email.service";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, EmailService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
