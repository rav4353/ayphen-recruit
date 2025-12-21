import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateTaggingService, TagCondition } from './candidate-tagging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('candidate-tagging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('candidate-tagging')
export class CandidateTaggingController {
    constructor(private readonly taggingService: CandidateTaggingService) {}

    @Post('rules')
    @ApiOperation({ summary: 'Create a new tagging rule' })
    createRule(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            name: string;
            tag: string;
            conditions: TagCondition[];
            conditionLogic?: 'AND' | 'OR';
            priority?: number;
        },
    ) {
        return this.taggingService.createRule(user.tenantId, dto);
    }

    @Get('rules')
    @ApiOperation({ summary: 'Get all tagging rules' })
    getRules(@CurrentUser() user: JwtPayload) {
        return this.taggingService.getRules(user.tenantId);
    }

    @Patch('rules/:id')
    @ApiOperation({ summary: 'Update a tagging rule' })
    updateRule(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: Partial<{
            name: string;
            tag: string;
            conditions: TagCondition[];
            conditionLogic: 'AND' | 'OR';
            isActive: boolean;
            priority: number;
        }>,
    ) {
        return this.taggingService.updateRule(user.tenantId, id, dto);
    }

    @Delete('rules/:id')
    @ApiOperation({ summary: 'Delete a tagging rule' })
    deleteRule(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.taggingService.deleteRule(user.tenantId, id);
    }

    @Post('tag/:candidateId')
    @ApiOperation({ summary: 'Apply tags to a single candidate' })
    tagCandidate(
        @CurrentUser() user: JwtPayload,
        @Param('candidateId') candidateId: string,
    ) {
        return this.taggingService.tagCandidate(candidateId, user.tenantId);
    }

    @Post('tag-all')
    @ApiOperation({ summary: 'Apply tags to all candidates' })
    tagAllCandidates(@CurrentUser() user: JwtPayload) {
        return this.taggingService.tagAllCandidates(user.tenantId);
    }

    @Post('preset-rules')
    @ApiOperation({ summary: 'Create preset tagging rules' })
    createPresetRules(@CurrentUser() user: JwtPayload) {
        return this.taggingService.createPresetRules(user.tenantId);
    }
}
