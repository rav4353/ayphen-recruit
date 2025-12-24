import { Module } from "@nestjs/common";
import { DripCampaignsController } from "./drip-campaigns.controller";
import { DripCampaignsService } from "./drip-campaigns.service";

@Module({
  controllers: [DripCampaignsController],
  providers: [DripCampaignsService],
  exports: [DripCampaignsService],
})
export class DripCampaignsModule {}
