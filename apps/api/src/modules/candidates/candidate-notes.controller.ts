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
import { CandidateNotesService } from './candidate-notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Permission } from '../../common/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('candidate-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('candidates/:candidateId/notes')
export class CandidateNotesController {
  constructor(private readonly notesService: CandidateNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a note to a candidate' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  addNote(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      content: string;
      isPrivate?: boolean;
      mentionedUserIds?: string[];
    },
  ) {
    return this.notesService.addNote(candidateId, body, user.sub, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for a candidate' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  getNotes(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.getNotes(candidateId, user.sub, user.tenantId);
  }

  @Put(':noteId')
  @ApiOperation({ summary: 'Update a note' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  updateNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      content?: string;
      isPrivate?: boolean;
    },
  ) {
    return this.notesService.updateNote(noteId, body, user.sub, user.tenantId);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete a note' })
  @RequirePermissions(Permission.CANDIDATE_EDIT)
  deleteNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.deleteNote(noteId, user.sub, user.tenantId);
  }
}

@ApiTags('notes-search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notes')
export class NotesSearchController {
  constructor(private readonly notesService: CandidateNotesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search notes across all candidates' })
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  searchNotes(
    @Query('q') query: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.searchNotes(query || '', user.sub, user.tenantId);
  }
}
