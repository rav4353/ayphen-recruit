import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateNoteDto {
  content: string;
  isPrivate?: boolean;
  mentionedUserIds?: string[];
}

interface UpdateNoteDto {
  content?: string;
  isPrivate?: boolean;
}

export interface CandidateNote {
  id: string;
  content: string;
  isPrivate: boolean;
  authorId: string;
  authorName: string;
  mentionedUsers: { id: string; name: string }[];
  createdAt: string;
  updatedAt?: string;
}

@Injectable()
export class CandidateNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNoteId(): string {
    const crypto = require('crypto');
    return `note-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  }

  /**
   * Add a note to a candidate
   */
  async addNote(candidateId: string, dto: CreateNoteDto, userId: string, tenantId: string): Promise<CandidateNote> {
    // Verify candidate exists
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Get author info
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Get mentioned users
    let mentionedUsers: { id: string; name: string }[] = [];
    if (dto.mentionedUserIds?.length) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: dto.mentionedUserIds }, tenantId },
        select: { id: true, firstName: true, lastName: true },
      });
      mentionedUsers = users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));
    }

    const noteId = this.generateNoteId();
    const now = new Date().toISOString();

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_ADDED',
        description: `Note added${dto.isPrivate ? ' (private)' : ''}`,
        userId,
        candidateId,
        metadata: {
          noteId,
          tenantId,
          content: dto.content,
          isPrivate: dto.isPrivate || false,
          authorId: userId,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown',
          mentionedUsers,
          createdAt: now,
          status: 'ACTIVE',
        },
      },
    });

    return {
      id: noteId,
      content: dto.content,
      isPrivate: dto.isPrivate || false,
      authorId: userId,
      authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown',
      mentionedUsers,
      createdAt: now,
    };
  }

  /**
   * Get all notes for a candidate
   */
  async getNotes(candidateId: string, userId: string, tenantId: string): Promise<CandidateNote[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        candidateId,
        action: 'CANDIDATE_NOTE_ADDED',
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const noteMap = new Map<string, CandidateNote>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!noteMap.has(meta.noteId) && meta.status !== 'DELETED') {
        // Skip private notes from other users
        if (meta.isPrivate && meta.authorId !== userId) {
          continue;
        }

        noteMap.set(meta.noteId, {
          id: meta.noteId,
          content: meta.content,
          isPrivate: meta.isPrivate,
          authorId: meta.authorId,
          authorName: meta.authorName,
          mentionedUsers: meta.mentionedUsers || [],
          createdAt: meta.createdAt,
          updatedAt: meta.updatedAt,
        });
      }
    }

    return Array.from(noteMap.values());
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    dto: UpdateNoteDto,
    userId: string,
    tenantId: string,
  ): Promise<CandidateNote> {
    // Find the note
    const noteLog = await this.prisma.activityLog.findFirst({
      where: {
        action: 'CANDIDATE_NOTE_ADDED',
        metadata: {
          path: ['noteId'],
          equals: noteId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!noteLog) {
      throw new NotFoundException('Note not found');
    }

    const meta = noteLog.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException('Note not found');
    }

    if (meta.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    const now = new Date().toISOString();

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_ADDED',
        description: 'Note updated',
        userId,
        candidateId: noteLog.candidateId,
        metadata: {
          ...meta,
          content: dto.content ?? meta.content,
          isPrivate: dto.isPrivate ?? meta.isPrivate,
          updatedAt: now,
        },
      },
    });

    return {
      id: noteId,
      content: dto.content ?? meta.content,
      isPrivate: dto.isPrivate ?? meta.isPrivate,
      authorId: meta.authorId,
      authorName: meta.authorName,
      mentionedUsers: meta.mentionedUsers || [],
      createdAt: meta.createdAt,
      updatedAt: now,
    };
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string, tenantId: string): Promise<{ success: boolean }> {
    const noteLog = await this.prisma.activityLog.findFirst({
      where: {
        action: 'CANDIDATE_NOTE_ADDED',
        metadata: {
          path: ['noteId'],
          equals: noteId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!noteLog) {
      throw new NotFoundException('Note not found');
    }

    const meta = noteLog.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException('Note not found');
    }

    if (meta.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_ADDED',
        description: 'Note deleted',
        userId,
        candidateId: noteLog.candidateId,
        metadata: {
          ...meta,
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  }

  /**
   * Search notes across candidates
   */
  async searchNotes(query: string, userId: string, tenantId: string): Promise<CandidateNote[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'CANDIDATE_NOTE_ADDED',
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const noteMap = new Map<string, CandidateNote & { candidateId: string }>();
    const queryLower = query.toLowerCase();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!noteMap.has(meta.noteId) && meta.status !== 'DELETED') {
        if (meta.isPrivate && meta.authorId !== userId) {
          continue;
        }

        if (meta.content.toLowerCase().includes(queryLower)) {
          noteMap.set(meta.noteId, {
            id: meta.noteId,
            content: meta.content,
            isPrivate: meta.isPrivate,
            authorId: meta.authorId,
            authorName: meta.authorName,
            mentionedUsers: meta.mentionedUsers || [],
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
            candidateId: log.candidateId!,
          });
        }
      }
    }

    return Array.from(noteMap.values());
  }
}
