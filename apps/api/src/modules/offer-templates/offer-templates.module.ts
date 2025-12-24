import { Module } from "@nestjs/common";
import { OfferTemplatesService } from "./offer-templates.service";
import { OfferTemplatesController } from "./offer-templates.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [OfferTemplatesController],
  providers: [OfferTemplatesService],
  exports: [OfferTemplatesService],
})
export class OfferTemplatesModule {}
