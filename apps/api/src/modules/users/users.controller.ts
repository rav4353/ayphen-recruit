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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    const newUser = await this.usersService.create(dto, user.tenantId);
    return ApiResponse.created(newUser, 'User created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(user.tenantId, query);
    return ApiResponse.paginated(
      result.users,
      result.total,
      query.page || 1,
      query.limit || 25,
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ApiResponse.success(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return ApiResponse.updated(user, 'User updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return ApiResponse.deleted('User deleted successfully');
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update user status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ) {
    const user = await this.usersService.updateStatus(id, status);
    return ApiResponse.updated(user, 'User status updated successfully');
  }

  @Post(':id/resend-password')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Resend temporary password to user' })
  async resendPassword(@Param('id') id: string) {
    await this.usersService.resendPassword(id);
    return ApiResponse.success(null, 'Temporary password sent successfully');
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  async getPreferences(@CurrentUser() user: JwtPayload) {
    const preferences = await this.usersService.getPreferences(user.sub);
    return ApiResponse.success(preferences, 'Preferences retrieved successfully');
  }

  @Put('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const preferences = await this.usersService.updatePreferences(user.sub, dto);
    return ApiResponse.updated(preferences, 'Preferences updated successfully');
  }
  @Get('me/actions')
  @ApiOperation({ summary: 'Get pending actions for current user' })
  async getPendingActions(@CurrentUser() user: JwtPayload) {
    const actions = await this.usersService.getPendingActions(user.sub);
    return ApiResponse.success(actions, 'Pending actions retrieved successfully');
  }
}
