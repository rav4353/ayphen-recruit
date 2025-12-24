import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

export interface Comment {
  id: string;
  tenantId: string;
  entityType: "candidate" | "application" | "job" | "interview";
  entityId: string;
  authorId: string;
  authorName?: string;
  content: string;
  mentions: string[];
  parentId?: string;
  replies?: Comment[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedNote {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  sharedWith: string[];
  entityType?: string;
  entityId?: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const COMMENT_KEY = "collab_comment";
const SHARED_NOTE_KEY = "shared_note";

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private newId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==================== COMMENTS ====================

  async createComment(
    tenantId: string,
    userId: string,
    dto: {
      entityType: Comment["entityType"];
      entityId: string;
      content: string;
      parentId?: string;
    },
  ): Promise<Comment> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Extract mentions from content
    const mentions = this.extractMentions(dto.content);

    const comment: Comment = {
      id: this.newId("cmt"),
      tenantId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      authorId: userId,
      authorName: user ? `${user.firstName} ${user.lastName}` : undefined,
      content: dto.content,
      mentions,
      parentId: dto.parentId,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const metadata = {
      type: COMMENT_KEY,
      id: comment.id,
      tenantId: comment.tenantId,
      entityType: comment.entityType,
      entityId: comment.entityId,
      authorId: comment.authorId,
      authorName: comment.authorName ?? null,
      content: comment.content,
      mentions: comment.mentions,
      parentId: comment.parentId ?? null,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    await this.prisma.activityLog.create({
      data: {
        action: "COMMENT_CREATED",
        description: `Comment added on ${dto.entityType}`,
        userId,
        ...(dto.entityType === "candidate"
          ? { candidateId: dto.entityId }
          : {}),
        ...(dto.entityType === "application"
          ? { applicationId: dto.entityId }
          : {}),
        metadata,
      },
    });

    // Notify mentioned users
    await this.notifyMentions(
      tenantId,
      userId,
      mentions,
      dto.entityType,
      dto.entityId,
      dto.content,
    );

    return comment;
  }

  async getComments(
    tenantId: string,
    entityType: Comment["entityType"],
    entityId: string,
  ): Promise<Comment[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: "COMMENT_CREATED",
        metadata: {
          path: ["type"],
          equals: COMMENT_KEY,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const comments = logs
      .map((log) => log.metadata as unknown as Comment)
      .filter(
        (c) =>
          c.tenantId === tenantId &&
          c.entityType === entityType &&
          c.entityId === entityId,
      );

    // Build thread structure
    const rootComments = comments.filter((c) => !c.parentId);
    for (const root of rootComments) {
      root.replies = comments.filter((c) => c.parentId === root.id);
    }

    return rootComments;
  }

  async updateComment(
    tenantId: string,
    commentId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: "COMMENT_CREATED",
        metadata: {
          path: ["id"],
          equals: commentId,
        },
      },
    });

    if (!log) {
      throw new NotFoundException("Comment not found");
    }

    const comment = log.metadata as unknown as Comment;
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to edit this comment");
    }

    const updatedComment: Comment = {
      ...comment,
      content,
      mentions: this.extractMentions(content),
      isEdited: true,
      updatedAt: new Date().toISOString(),
    };

    const updatedMetadata = {
      type: COMMENT_KEY,
      id: updatedComment.id,
      tenantId: updatedComment.tenantId,
      entityType: updatedComment.entityType,
      entityId: updatedComment.entityId,
      authorId: updatedComment.authorId,
      authorName: updatedComment.authorName ?? null,
      content: updatedComment.content,
      mentions: updatedComment.mentions,
      parentId: updatedComment.parentId ?? null,
      isEdited: updatedComment.isEdited,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
    };

    await this.prisma.activityLog.update({
      where: { id: log.id },
      data: { metadata: updatedMetadata },
    });

    return updatedComment;
  }

  async deleteComment(
    tenantId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: "COMMENT_CREATED",
        metadata: {
          path: ["id"],
          equals: commentId,
        },
      },
    });

    if (!log) {
      throw new NotFoundException("Comment not found");
    }

    const comment = log.metadata as unknown as Comment;
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to delete this comment");
    }

    await this.prisma.activityLog.delete({ where: { id: log.id } });
  }

  // ==================== SHARED NOTES ====================

  async createNote(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      content: string;
      sharedWith?: string[];
      entityType?: string;
      entityId?: string;
      tags?: string[];
    },
  ): Promise<SharedNote> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const note: SharedNote = {
      id: this.newId("note"),
      tenantId,
      title: dto.title,
      content: dto.content,
      authorId: userId,
      authorName: user ? `${user.firstName} ${user.lastName}` : undefined,
      sharedWith: dto.sharedWith || [],
      entityType: dto.entityType,
      entityId: dto.entityId,
      isPinned: false,
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${SHARED_NOTE_KEY}_${note.id}`,
        value: note as any,
        category: "COLLABORATION",
        isPublic: false,
      },
    });

    // Notify shared users
    for (const sharedUserId of dto.sharedWith || []) {
      try {
        await this.notificationsService.create({
          userId: sharedUserId,
          tenantId,
          type: "SYSTEM" as any,
          title: "Note Shared With You",
          message: `${note.authorName} shared a note: "${note.title}"`,
          link: `/notes/${note.id}`,
        });
      } catch (error) {
        this.logger.warn("Failed to notify shared user:", error);
      }
    }

    return note;
  }

  async getNotes(
    tenantId: string,
    userId: string,
    filters?: {
      entityType?: string;
      entityId?: string;
      tags?: string[];
    },
  ): Promise<SharedNote[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${SHARED_NOTE_KEY}_` },
      },
    });

    let notes = settings
      .map((s) => s.value as unknown as SharedNote)
      .filter((n) => n.authorId === userId || n.sharedWith.includes(userId));

    if (filters?.entityType) {
      notes = notes.filter((n) => n.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      notes = notes.filter((n) => n.entityId === filters.entityId);
    }
    if (filters?.tags?.length) {
      notes = notes.filter((n) =>
        filters.tags!.some((tag) => n.tags.includes(tag)),
      );
    }

    return notes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async getNote(
    tenantId: string,
    noteId: string,
    userId: string,
  ): Promise<SharedNote> {
    const setting = await this.prisma.setting.findUnique({
      where: {
        tenantId_key: { tenantId, key: `${SHARED_NOTE_KEY}_${noteId}` },
      },
    });

    if (!setting) {
      throw new NotFoundException("Note not found");
    }

    const note = setting.value as unknown as SharedNote;
    if (note.authorId !== userId && !note.sharedWith.includes(userId)) {
      throw new Error("Not authorized to view this note");
    }

    return note;
  }

  async updateNote(
    tenantId: string,
    noteId: string,
    userId: string,
    dto: Partial<{
      title: string;
      content: string;
      sharedWith: string[];
      tags: string[];
      isPinned: boolean;
    }>,
  ): Promise<SharedNote> {
    const note = await this.getNote(tenantId, noteId, userId);

    if (note.authorId !== userId) {
      throw new Error("Only the author can edit this note");
    }

    const updated: SharedNote = {
      ...note,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: {
        tenantId_key: { tenantId, key: `${SHARED_NOTE_KEY}_${noteId}` },
      },
      data: { value: updated as any },
    });

    return updated;
  }

  async deleteNote(
    tenantId: string,
    noteId: string,
    userId: string,
  ): Promise<void> {
    const note = await this.getNote(tenantId, noteId, userId);

    if (note.authorId !== userId) {
      throw new Error("Only the author can delete this note");
    }

    await this.prisma.setting.delete({
      where: {
        tenantId_key: { tenantId, key: `${SHARED_NOTE_KEY}_${noteId}` },
      },
    });
  }

  // ==================== MENTIONS ====================

  async getMentionSuggestions(
    tenantId: string,
    query: string,
  ): Promise<
    {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }[]
  > {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      avatar: u.avatar || undefined,
    }));
  }

  async getMyMentions(
    tenantId: string,
    userId: string,
  ): Promise<
    {
      commentId: string;
      entityType: string;
      entityId: string;
      mentionedBy: string;
      content: string;
      createdAt: string;
    }[]
  > {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: "COMMENT_CREATED",
        metadata: {
          path: ["mentions"],
          array_contains: [userId],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return logs.map((log) => {
      const comment = log.metadata as unknown as Comment;
      return {
        commentId: comment.id,
        entityType: comment.entityType,
        entityId: comment.entityId,
        mentionedBy: comment.authorName || "Unknown",
        content: comment.content.substring(0, 200),
        createdAt: comment.createdAt,
      };
    });
  }

  // ==================== HELPERS ====================

  private extractMentions(content: string): string[] {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // Extract user ID from @[Name](userId)
    }

    return mentions;
  }

  private async notifyMentions(
    tenantId: string,
    authorId: string,
    mentionedUserIds: string[],
    entityType: string,
    entityId: string,
    content: string,
  ): Promise<void> {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { firstName: true, lastName: true },
    });

    const authorName = author
      ? `${author.firstName} ${author.lastName}`
      : "Someone";

    for (const userId of mentionedUserIds) {
      if (userId === authorId) continue;

      try {
        await this.notificationsService.create({
          userId,
          tenantId,
          type: "SYSTEM" as any,
          title: "You were mentioned",
          message: `${authorName} mentioned you in a comment`,
          link: `/${entityType}s/${entityId}`,
        });
      } catch (error) {
        this.logger.warn(`Failed to notify mentioned user ${userId}:`, error);
      }
    }
  }
}
