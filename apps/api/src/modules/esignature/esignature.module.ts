import { Module } from "@nestjs/common";
import { ESignatureController } from "./esignature.controller";
import { ESignatureService } from "./esignature.service";
import { DocuSignService } from "./providers/docusign.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ESignatureController],
  providers: [ESignatureService, DocuSignService],
  exports: [ESignatureService],
})
export class ESignatureModule {}
