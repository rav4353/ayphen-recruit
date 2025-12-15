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
import { JobTemplatesService } from './job-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { EmploymentType } from '@prisma/client';

@ApiTags('job-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('job-templates')
export class JobTemplatesController {
  constructor(private readonly jobTemplatesService: JobTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job template' })
  @RequirePermissions(Permission.JOB_CREATE)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name: string;
      title: string;
      description: string;
      requirements?: string;
      responsibilities?: string;
      benefits?: string;
      employmentType?: EmploymentType;
      skills?: string[];
    },
  ) {
    return this.jobTemplatesService.create(body, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job templates' })
  @RequirePermissions(Permission.JOB_VIEW)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.jobTemplatesService.findAll(user.tenantId, includeInactive === 'true');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job template statistics' })
  @RequirePermissions(Permission.JOB_VIEW)
  getStats(@CurrentUser() user: JwtPayload) {
    return this.jobTemplatesService.getStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job template by ID' })
  @RequirePermissions(Permission.JOB_VIEW)
  findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.jobTemplatesService.findById(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job template' })
  @RequirePermissions(Permission.JOB_EDIT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name?: string;
      title?: string;
      description?: string;
      requirements?: string;
      responsibilities?: string;
      benefits?: string;
      employmentType?: EmploymentType;
      skills?: string[];
      isActive?: boolean;
    },
  ) {
    return this.jobTemplatesService.update(id, body, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job template' })
  @RequirePermissions(Permission.JOB_DELETE)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.jobTemplatesService.delete(id, user.tenantId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a job template' })
  @RequirePermissions(Permission.JOB_CREATE)
  duplicate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string },
  ) {
    return this.jobTemplatesService.duplicate(id, body.name, user.tenantId);
  }

  @Post(':id/create-job')
  @ApiOperation({ summary: 'Create a job from template' })
  @RequirePermissions(Permission.JOB_CREATE)
  createJobFromTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      title?: string;
      description?: string;
      departmentId?: string;
      locationId?: string;
      hiringManagerId?: string;
      pipelineId?: string;
    },
  ) {
    return this.jobTemplatesService.createJobFromTemplate(id, user.tenantId, user.sub, body);
  }
}
