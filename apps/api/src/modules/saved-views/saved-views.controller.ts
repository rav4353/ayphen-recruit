import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SavedViewsService } from "./saved-views.service";
import { CreateSavedViewDto } from "./dto/create-saved-view.dto";
import { UpdateSavedViewDto } from "./dto/update-saved-view.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { ApiResponse } from "../../common/dto/api-response.dto";

@ApiTags("saved-views")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("saved-views")
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new saved view" })
  async create(
    @Body() dto: CreateSavedViewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const view = await this.savedViewsService.create(
      dto,
      user.tenantId,
      user.sub,
    );
    return ApiResponse.created(view, "Saved view created successfully");
  }

  @Get()
  @ApiOperation({ summary: "Get all saved views for an entity" })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query("entity") entity: string,
  ) {
    const views = await this.savedViewsService.findAll(
      user.tenantId,
      user.sub,
      entity,
    );
    return ApiResponse.success(views, "Saved views retrieved successfully");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get saved view by ID" })
  async findOne(@Param("id") id: string) {
    const view = await this.savedViewsService.findOne(id);
    return ApiResponse.success(view, "Saved view retrieved successfully");
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update saved view" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateSavedViewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const view = await this.savedViewsService.update(id, dto, user.sub);
    return ApiResponse.updated(view, "Saved view updated successfully");
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete saved view" })
  async remove(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    await this.savedViewsService.remove(id, user.sub);
    return ApiResponse.deleted("Saved view deleted successfully");
  }
}
