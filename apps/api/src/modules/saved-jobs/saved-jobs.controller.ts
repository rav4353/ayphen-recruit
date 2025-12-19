import { Controller, Post, Delete, Get, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavedJobsService } from './saved-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Saved Jobs')
@Controller('saved-jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedJobsController {
    constructor(private readonly savedJobsService: SavedJobsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all saved jobs for current user' })
    getMySavedJobs(@CurrentUser() user: JwtPayload) {
        return this.savedJobsService.getSavedJobs(user.sub);
    }

    @Post()
    @ApiOperation({ summary: 'Save a job' })
    saveJob(@CurrentUser() user: JwtPayload, @Body('jobId') jobId: string) {
        return this.savedJobsService.saveJob(user.sub, jobId);
    }

    @Delete(':jobId')
    @ApiOperation({ summary: 'Unsave a job' })
    unsaveJob(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
        return this.savedJobsService.unsaveJob(user.sub, jobId);
    }

    @Get(':jobId/check')
    @ApiOperation({ summary: 'Check if a job is saved' })
    checkSaved(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
        return this.savedJobsService.isJobSaved(user.sub, jobId);
    }
}
