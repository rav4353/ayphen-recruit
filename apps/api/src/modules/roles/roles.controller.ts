import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new custom role' })
  create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    return this.rolesService.create(createRoleDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles (system + custom)' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.rolesService.update(id, updateRoleDto, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rolesService.remove(id, user.tenantId);
  }
}
