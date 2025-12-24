import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { User } from "@prisma/client";

@Controller("email-templates")
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() body: any) {
    return this.templatesService.create(user.tenantId, user.id, body);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.templatesService.findAll(user.tenantId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: User, @Param("id") id: string) {
    return this.templatesService.findOne(id, user.tenantId);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.templatesService.update(id, user.tenantId, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.templatesService.remove(id, user.tenantId);
  }
}
