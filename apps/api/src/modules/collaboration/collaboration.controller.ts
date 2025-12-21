import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationService, Comment } from './collaboration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
    constructor(private readonly collaborationService: CollaborationService) {}

    // ==================== COMMENTS ====================

    @Post('comments')
    @ApiOperation({ summary: 'Create a comment' })
    createComment(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            entityType: Comment['entityType'];
            entityId: string;
            content: string;
            parentId?: string;
        },
    ) {
        return this.collaborationService.createComment(user.tenantId, user.sub, dto);
    }

    @Get('comments/:entityType/:entityId')
    @ApiOperation({ summary: 'Get comments for an entity' })
    getComments(
        @CurrentUser() user: JwtPayload,
        @Param('entityType') entityType: Comment['entityType'],
        @Param('entityId') entityId: string,
    ) {
        return this.collaborationService.getComments(user.tenantId, entityType, entityId);
    }

    @Patch('comments/:commentId')
    @ApiOperation({ summary: 'Update a comment' })
    updateComment(
        @CurrentUser() user: JwtPayload,
        @Param('commentId') commentId: string,
        @Body() body: { content: string },
    ) {
        return this.collaborationService.updateComment(user.tenantId, commentId, user.sub, body.content);
    }

    @Delete('comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment' })
    deleteComment(
        @CurrentUser() user: JwtPayload,
        @Param('commentId') commentId: string,
    ) {
        return this.collaborationService.deleteComment(user.tenantId, commentId, user.sub);
    }

    // ==================== SHARED NOTES ====================

    @Post('notes')
    @ApiOperation({ summary: 'Create a shared note' })
    createNote(
        @CurrentUser() user: JwtPayload,
        @Body() dto: {
            title: string;
            content: string;
            sharedWith?: string[];
            entityType?: string;
            entityId?: string;
            tags?: string[];
        },
    ) {
        return this.collaborationService.createNote(user.tenantId, user.sub, dto);
    }

    @Get('notes')
    @ApiOperation({ summary: 'Get notes' })
    getNotes(
        @CurrentUser() user: JwtPayload,
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('tags') tags?: string,
    ) {
        return this.collaborationService.getNotes(user.tenantId, user.sub, {
            entityType,
            entityId,
            tags: tags ? tags.split(',') : undefined,
        });
    }

    @Get('notes/:noteId')
    @ApiOperation({ summary: 'Get a note by ID' })
    getNote(@CurrentUser() user: JwtPayload, @Param('noteId') noteId: string) {
        return this.collaborationService.getNote(user.tenantId, noteId, user.sub);
    }

    @Patch('notes/:noteId')
    @ApiOperation({ summary: 'Update a note' })
    updateNote(
        @CurrentUser() user: JwtPayload,
        @Param('noteId') noteId: string,
        @Body() dto: Partial<{
            title: string;
            content: string;
            sharedWith: string[];
            tags: string[];
            isPinned: boolean;
        }>,
    ) {
        return this.collaborationService.updateNote(user.tenantId, noteId, user.sub, dto);
    }

    @Delete('notes/:noteId')
    @ApiOperation({ summary: 'Delete a note' })
    deleteNote(@CurrentUser() user: JwtPayload, @Param('noteId') noteId: string) {
        return this.collaborationService.deleteNote(user.tenantId, noteId, user.sub);
    }

    // ==================== MENTIONS ====================

    @Get('mentions/suggestions')
    @ApiOperation({ summary: 'Get mention suggestions' })
    getMentionSuggestions(
        @CurrentUser() user: JwtPayload,
        @Query('query') query: string,
    ) {
        return this.collaborationService.getMentionSuggestions(user.tenantId, query || '');
    }

    @Get('mentions/my')
    @ApiOperation({ summary: 'Get my mentions' })
    getMyMentions(@CurrentUser() user: JwtPayload) {
        return this.collaborationService.getMyMentions(user.tenantId, user.sub);
    }
}
