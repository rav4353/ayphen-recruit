import { Module } from "@nestjs/common";
import { ReferenceController } from "./reference.controller";
import { SkillsController } from "./skills.controller";
import { ReferenceService } from "./reference.service";
import { SkillsService } from "./skills.service";

@Module({
  controllers: [ReferenceController, SkillsController],
  providers: [ReferenceService, SkillsService],
  exports: [ReferenceService, SkillsService],
})
export class ReferenceModule {}
