import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface InterviewKitQuestion {
  id: string;
  question: string;
  category: string;
  expectedAnswer?: string;
  duration?: number;
  order?: number;
}

interface InterviewKitScorecard {
  id: string;
  name: string;
  criteria: { name: string; weight: number; description?: string }[];
}

interface CreateInterviewKitDto {
  name: string;
  description?: string;
  interviewType: string;
  duration?: number;
  questions?: Omit<InterviewKitQuestion, "id">[];
  scorecard?: Omit<InterviewKitScorecard, "id">;
  tips?: string[];
  resources?: { title: string; url: string }[];
}

@Injectable()
export class InterviewKitsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateId(prefix: string): string {
    const crypto = require("crypto");
    return `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  }

  /**
   * Create a new interview kit
   */
  async create(dto: CreateInterviewKitDto, tenantId: string, userId: string) {
    const kitId = this.generateId("kit");

    const questions = (dto.questions || []).map((q, index) => ({
      ...q,
      id: this.generateId("q"),
      order: index + 1,
    }));

    const scorecard = dto.scorecard
      ? {
          ...dto.scorecard,
          id: this.generateId("sc"),
        }
      : null;

    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_KIT_CREATED",
        description: `Interview kit created: ${dto.name}`,
        userId,
        metadata: {
          kitId,
          tenantId,
          name: dto.name,
          description: dto.description,
          interviewType: dto.interviewType,
          duration: dto.duration || 60,
          questions,
          scorecard,
          tips: dto.tips || [],
          resources: dto.resources || [],
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    return {
      id: kitId,
      name: dto.name,
      description: dto.description,
      interviewType: dto.interviewType,
      duration: dto.duration || 60,
      questionCount: questions.length,
      hasScorecard: !!scorecard,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get all interview kits for tenant
   */
  async findAll(tenantId: string, interviewType?: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: "INTERVIEW_KIT_CREATED",
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const kitMap = new Map<string, any>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!kitMap.has(meta.kitId) && meta.status !== "DELETED") {
        if (!interviewType || meta.interviewType === interviewType) {
          kitMap.set(meta.kitId, {
            id: meta.kitId,
            name: meta.name,
            description: meta.description,
            interviewType: meta.interviewType,
            duration: meta.duration,
            questionCount: meta.questions?.length || 0,
            hasScorecard: !!meta.scorecard,
            status: meta.status,
            createdAt: meta.createdAt,
          });
        }
      }
    }

    return Array.from(kitMap.values());
  }

  /**
   * Get interview kit by ID
   */
  async findById(kitId: string, tenantId: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: "INTERVIEW_KIT_CREATED",
        metadata: {
          path: ["kitId"],
          equals: kitId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!log) {
      throw new NotFoundException("Interview kit not found");
    }

    const meta = log.metadata as any;

    if (meta.tenantId !== tenantId || meta.status === "DELETED") {
      throw new NotFoundException("Interview kit not found");
    }

    return {
      id: meta.kitId,
      name: meta.name,
      description: meta.description,
      interviewType: meta.interviewType,
      duration: meta.duration,
      questions: meta.questions,
      scorecard: meta.scorecard,
      tips: meta.tips,
      resources: meta.resources,
      status: meta.status,
      createdAt: meta.createdAt,
    };
  }

  /**
   * Update interview kit
   */
  async update(
    kitId: string,
    dto: Partial<CreateInterviewKitDto>,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.findById(kitId, tenantId);

    const questions = dto.questions
      ? dto.questions.map((q, index) => ({
          ...q,
          id: this.generateId("q"),
          order: index + 1,
        }))
      : (existing as any).questions;

    const scorecard =
      dto.scorecard !== undefined
        ? dto.scorecard
          ? { ...dto.scorecard, id: this.generateId("sc") }
          : null
        : (existing as any).scorecard;

    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_KIT_CREATED",
        description: `Interview kit updated: ${dto.name || existing.name}`,
        userId,
        metadata: {
          kitId,
          tenantId,
          name: dto.name || existing.name,
          description: dto.description ?? existing.description,
          interviewType: dto.interviewType || existing.interviewType,
          duration: dto.duration || existing.duration,
          questions,
          scorecard,
          tips: dto.tips || (existing as any).tips,
          resources: dto.resources || (existing as any).resources,
          status: existing.status,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
    });

    return this.findById(kitId, tenantId);
  }

  /**
   * Delete interview kit
   */
  async delete(kitId: string, tenantId: string, userId: string) {
    const existing = await this.findById(kitId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_KIT_CREATED",
        description: `Interview kit deleted: ${existing.name}`,
        userId,
        metadata: {
          ...(existing as any),
          kitId,
          tenantId,
          status: "DELETED",
          deletedAt: new Date().toISOString(),
          deletedBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Duplicate interview kit
   */
  async duplicate(
    kitId: string,
    newName: string,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.findById(kitId, tenantId);

    return this.create(
      {
        name: newName,
        description: existing.description,
        interviewType: existing.interviewType,
        duration: existing.duration,
        questions: (existing as any).questions?.map((q: any) => ({
          question: q.question,
          category: q.category,
          expectedAnswer: q.expectedAnswer,
          duration: q.duration,
          order: q.order,
        })),
        scorecard: (existing as any).scorecard
          ? {
              name: (existing as any).scorecard.name,
              criteria: (existing as any).scorecard.criteria,
            }
          : undefined,
        tips: (existing as any).tips,
        resources: (existing as any).resources,
      },
      tenantId,
      userId,
    );
  }

  /**
   * Get interview types
   */
  getInterviewTypes() {
    return [
      { value: "PHONE_SCREEN", label: "Phone Screen" },
      { value: "TECHNICAL", label: "Technical Interview" },
      { value: "BEHAVIORAL", label: "Behavioral Interview" },
      { value: "CASE_STUDY", label: "Case Study" },
      { value: "CULTURE_FIT", label: "Culture Fit" },
      { value: "HIRING_MANAGER", label: "Hiring Manager Interview" },
      { value: "PANEL", label: "Panel Interview" },
      { value: "FINAL", label: "Final Interview" },
    ];
  }

  /**
   * Assign kit to interview
   */
  async assignToInterview(
    kitId: string,
    interviewId: string,
    tenantId: string,
    userId: string,
  ) {
    const kit = await this.findById(kitId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: "INTERVIEW_KIT_ASSIGNED",
        description: `Interview kit "${kit.name}" assigned to interview`,
        userId,
        metadata: {
          kitId,
          interviewId,
          tenantId,
          assignedAt: new Date().toISOString(),
          assignedBy: userId,
        },
      },
    });

    return { success: true, kitId, interviewId };
  }
}
