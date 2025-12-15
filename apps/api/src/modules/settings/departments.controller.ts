import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name: string;
      code?: string;
      parentId?: string;
    },
  ) {
    return this.departmentsService.create(body, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('hierarchy') hierarchy?: string,
  ) {
    return this.departmentsService.findAll(user.tenantId, hierarchy === 'true');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get department statistics' })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getStats(@CurrentUser() user: JwtPayload) {
    return this.departmentsService.getStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.departmentsService.findById(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update department' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name?: string;
      code?: string;
      parentId?: string;
    },
  ) {
    return this.departmentsService.update(id, body, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.departmentsService.delete(id, user.tenantId);
  }

  @Post(':id/move-users')
  @ApiOperation({ summary: 'Move users from this department to another' })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  moveUsers(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { toDepartmentId: string; userIds: string[] },
  ) {
    return this.departmentsService.moveUsers(id, body.toDepartmentId, body.userIds, user.tenantId);
  }
}
