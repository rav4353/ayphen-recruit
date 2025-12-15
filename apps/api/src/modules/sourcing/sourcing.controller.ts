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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SourcingService } from './sourcing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import {
  CreateSourcedCandidateDto,
  UpdateSourcedCandidateDto,
  SearchSourcedCandidatesDto,
  RecordOutreachDto,
  AddToPipelineDto,
  BulkOutreachDto,
  SourcingStatus,
  SourcingChannel,
} from './dto';

@ApiTags('sourcing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sourcing')
export class SourcingController {
  constructor(private readonly sourcingService: SourcingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sourced candidate' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSourcedCandidateDto,
  ) {
    return this.sourcingService.create(dto, user.tenantId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sourced candidates with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SourcingStatus })
  @ApiQuery({ name: 'source', required: false, enum: SourcingChannel })
  @ApiQuery({ name: 'skills', required: false, type: [String] })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: SearchSourcedCandidatesDto,
  ) {
    return this.sourcingService.findAll(user.tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sourcing statistics' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.sourcingService.getStats(user.tenantId);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get available sourcing channels' })
  getChannels() {
    return {
      channels: Object.values(SourcingChannel).map(channel => ({
        id: channel,
        name: channel.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      })),
      statuses: Object.values(SourcingStatus).map(status => ({
        id: status,
        name: status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      })),
    };
  }

  @Get('suggested/:jobId')
  @ApiOperation({ summary: 'Get suggested candidates for a job from internal database' })
  getSuggestedCandidates(
    @Param('jobId') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sourcingService.getSuggestedCandidates(jobId, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sourced candidate by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sourcingService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sourced candidate' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSourcedCandidateDto,
  ) {
    return this.sourcingService.update(id, dto, user.tenantId, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sourced candidate' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sourcingService.delete(id, user.tenantId, user.sub);
  }

  @Post('outreach')
  @ApiOperation({ summary: 'Record an outreach attempt' })
  recordOutreach(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordOutreachDto,
  ) {
    return this.sourcingService.recordOutreach(dto, user.tenantId, user.sub);
  }

  @Post('bulk-outreach')
  @ApiOperation({ summary: 'Send bulk outreach to multiple candidates' })
  bulkOutreach(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkOutreachDto,
  ) {
    return this.sourcingService.bulkOutreach(dto, user.tenantId, user.sub);
  }

  @Post('add-to-pipeline')
  @ApiOperation({ summary: 'Add a sourced candidate to job pipeline' })
  addToPipeline(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddToPipelineDto,
  ) {
    return this.sourcingService.addToPipeline(dto, user.tenantId, user.sub);
  }
}
