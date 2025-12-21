import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateDedupService } from './candidate-dedup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('candidate-dedup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('candidate-dedup')
export class CandidateDedupController {
    constructor(private readonly dedupService: CandidateDedupService) {}

    @Get('duplicates')
    @ApiOperation({ summary: 'Find potential duplicate candidates' })
    findDuplicates(
        @CurrentUser() user: JwtPayload,
        @Query('minScore') minScore?: string,
        @Query('limit') limit?: string,
    ) {
        return this.dedupService.findDuplicates(user.tenantId, {
            minScore: minScore ? parseInt(minScore, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get('duplicates/:candidateId')
    @ApiOperation({ summary: 'Find duplicates for a specific candidate' })
    findDuplicatesForCandidate(
        @CurrentUser() user: JwtPayload,
        @Param('candidateId') candidateId: string,
    ) {
        return this.dedupService.findDuplicatesForCandidate(candidateId, user.tenantId);
    }

    @Post('check')
    @ApiOperation({ summary: 'Check for duplicates before creating a candidate' })
    checkForDuplicates(
        @CurrentUser() user: JwtPayload,
        @Body() candidateData: {
            email: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
        },
    ) {
        return this.dedupService.checkForDuplicates(user.tenantId, candidateData);
    }

    @Post('merge')
    @ApiOperation({ summary: 'Merge duplicate candidates' })
    mergeCandidates(
        @CurrentUser() user: JwtPayload,
        @Body() body: {
            primaryCandidateId: string;
            duplicateCandidateIds: string[];
        },
    ) {
        return this.dedupService.mergeCandidates(
            user.tenantId,
            body.primaryCandidateId,
            body.duplicateCandidateIds,
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get duplicate detection statistics' })
    getStats(@CurrentUser() user: JwtPayload) {
        return this.dedupService.getDuplicateStats(user.tenantId);
    }
}
