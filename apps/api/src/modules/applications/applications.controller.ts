import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePublicApplicationDto } from './dto/create-public-application.dto';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Public()
  @Post('public/apply')
  @ApiOperation({ summary: 'Public application submission' })
  applyPublic(@Body() dto: CreatePublicApplicationDto) {
    return this.applicationsService.createPublic(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications for tenant' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.findAll(user.tenantId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get applications for a job' })
  findByJob(
    @Param('jobId') jobId: string,
    @Query('status') status?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.applicationsService.findByJob(jobId, { status, stageId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findById(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move application to a different stage' })
  moveToStage(
    @Param('id') id: string,
    @Body('stageId') stageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.moveToStage(id, stageId, user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update application status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    return this.applicationsService.updateStatus(id, status, reason);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign application to a user' })
  assignTo(@Param('id') id: string, @Body('userId') userId: string) {
    return this.applicationsService.assignTo(id, userId);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Calculate AI Match Score' })
  async calculateMatch(@Param('id') id: string) {
    await this.applicationsService.calculateMatch(id);
    return { success: true, message: 'Match calculation triggered' };
  }
  @Post('copy')
  @ApiOperation({ summary: 'Copy applications to another job' })
  copyToJob(
    @Body('applicationIds') applicationIds: string[],
    @Body('targetJobId') targetJobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.copyToJob(applicationIds, targetJobId, user.sub);
  }
}
