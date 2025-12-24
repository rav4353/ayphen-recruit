import { Module } from "@nestjs/common";
import { SourcingController } from "./sourcing.controller";
import { SourcingService } from "./sourcing.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SourcingController],
  providers: [SourcingService],
  exports: [SourcingService],
})
export class SourcingModule {}
