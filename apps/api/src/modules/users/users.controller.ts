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
  Put,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserQueryDto } from "./dto/user-query.dto";
import { UpdatePreferencesDto } from "./dto/preferences.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { ApiResponse } from "../../common/dto/api-response.dto";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Create a new user" })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    const newUser = await this.usersService.create(dto, user.tenantId);
    return ApiResponse.created(newUser, "User created successfully");
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(user.tenantId, query);
    return ApiResponse.paginated(
      result.users,
      result.total,
      query.page || 1,
      query.limit || 25,
      "Users retrieved successfully",
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    return ApiResponse.success(user, "User retrieved successfully");
  }

  @Patch(":id")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Update user" })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return ApiResponse.updated(user, "User updated successfully");
  }

  @Delete(":id")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Delete user" })
  async remove(@Param("id") id: string) {
    await this.usersService.remove(id);
    return ApiResponse.deleted("User deleted successfully");
  }

  @Patch(":id/status")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Update user status" })
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ) {
    const user = await this.usersService.updateStatus(id, status);
    return ApiResponse.updated(user, "User status updated successfully");
  }

  @Post(":id/resend-password")
  @Roles("ADMIN", "SUPER_ADMIN")
  @ApiOperation({ summary: "Resend temporary password to user" })
  async resendPassword(@Param("id") id: string) {
    await this.usersService.resendPassword(id);
    return ApiResponse.success(null, "Temporary password sent successfully");
  }

  @Get("me/preferences")
  @ApiOperation({ summary: "Get current user preferences" })
  async getPreferences(@CurrentUser() user: JwtPayload) {
    const preferences = await this.usersService.getPreferences(user.sub);
    return ApiResponse.success(
      preferences,
      "Preferences retrieved successfully",
    );
  }

  @Put("me/preferences")
  @ApiOperation({ summary: "Update current user preferences" })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const preferences = await this.usersService.updatePreferences(
      user.sub,
      dto,
    );
    return ApiResponse.updated(preferences, "Preferences updated successfully");
  }
  @Get("me/actions")
  @ApiOperation({ summary: "Get pending actions for current user" })
  async getPendingActions(@CurrentUser() user: JwtPayload) {
    const actions = await this.usersService.getPendingActions(user.sub);
    return ApiResponse.success(
      actions,
      "Pending actions retrieved successfully",
    );
  }

  @Get("me/availability")
  @ApiOperation({ summary: "Get current user availability for scheduling" })
  async getAvailability(@CurrentUser() user: JwtPayload) {
    const availability = await this.usersService.getAvailability(user.sub);
    return ApiResponse.success(
      availability,
      "Availability retrieved successfully",
    );
  }

  @Put("me/availability")
  @ApiOperation({ summary: "Update current user availability" })
  async updateAvailability(
    @CurrentUser() user: JwtPayload,
    @Body()
    data: {
      timezone?: string;
      slots?: { dayOfWeek: number; startTime: string; endTime: string }[];
      bufferMinutes?: number;
      maxMeetingsPerDay?: number;
    },
  ) {
    const availability = await this.usersService.updateAvailability(
      user.sub,
      data,
    );
    return ApiResponse.updated(
      availability,
      "Availability updated successfully",
    );
  }

  @Get("me/availability/slots")
  @ApiOperation({ summary: "Get available time slots for a specific date" })
  async getAvailableTimeslots(
    @CurrentUser() user: JwtPayload,
    @Query("date") date: string,
    @Query("duration") duration?: string,
  ) {
    const slots = await this.usersService.getAvailableTimeslots(
      user.sub,
      date,
      duration ? parseInt(duration, 10) : 60,
    );
    return ApiResponse.success(slots, "Available slots retrieved successfully");
  }

  @Post("me/availability/block")
  @ApiOperation({ summary: "Block specific dates" })
  async blockDates(
    @CurrentUser() user: JwtPayload,
    @Body("dates") dates: string[],
  ) {
    const availability = await this.usersService.blockDates(user.sub, dates);
    return ApiResponse.updated(availability, "Dates blocked successfully");
  }

  @Post("me/availability/unblock")
  @ApiOperation({ summary: "Unblock specific dates" })
  async unblockDates(
    @CurrentUser() user: JwtPayload,
    @Body("dates") dates: string[],
  ) {
    const availability = await this.usersService.unblockDates(user.sub, dates);
    return ApiResponse.updated(availability, "Dates unblocked successfully");
  }

  @Get(":id/availability")
  @ApiOperation({ summary: "Get user availability by ID" })
  async getUserAvailability(@Param("id") id: string) {
    const availability = await this.usersService.getAvailability(id);
    return ApiResponse.success(
      availability,
      "Availability retrieved successfully",
    );
  }

  @Get(":id/availability/slots")
  @ApiOperation({
    summary: "Get available time slots for a user on a specific date",
  })
  async getUserAvailableTimeslots(
    @Param("id") id: string,
    @Query("date") date: string,
    @Query("duration") duration?: string,
  ) {
    const slots = await this.usersService.getAvailableTimeslots(
      id,
      date,
      duration ? parseInt(duration, 10) : 60,
    );
    return ApiResponse.success(slots, "Available slots retrieved successfully");
  }
}
