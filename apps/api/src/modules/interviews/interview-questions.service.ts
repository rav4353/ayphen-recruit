import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateQuestionDto {
  question: string;
  category: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  expectedAnswer?: string;
  skills?: string[];
  timeMinutes?: number;
}

interface UpdateQuestionDto {
  question?: string;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  expectedAnswer?: string;
  skills?: string[];
  timeMinutes?: number;
}

@Injectable()
export class InterviewQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, tenantId: string, userId: string) {
    const crypto = require('crypto');
    const questionId = `iq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    await this.prisma.activityLog.create({
      data: {
        action: 'INTERVIEW_QUESTION_CREATED',
        description: `Interview question created in category: ${dto.category}`,
        userId,
        metadata: {
          type: 'interview_question',
          id: questionId,
          tenantId,
          ...dto,
          difficulty: dto.difficulty || 'MEDIUM',
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
        },
      },
    });

    return {
      id: questionId,
      ...dto,
      difficulty: dto.difficulty || 'MEDIUM',
    };
  }

  async findAll(tenantId: string, filters?: { category?: string; difficulty?: string; skills?: string }) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: { in: ['INTERVIEW_QUESTION_CREATED', 'INTERVIEW_QUESTION_UPDATED'] },
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest state of each question
    const questionMap = new Map<string, any>();
    for (const log of logs) {
      const metadata = log.metadata as any;
      if (metadata.type === 'interview_question' && !questionMap.has(metadata.id)) {
        questionMap.set(metadata.id, metadata);
      }
    }

    let questions = Array.from(questionMap.values());

    // Apply filters
    if (filters?.category) {
      questions = questions.filter(q => q.category === filters.category);
    }
    if (filters?.difficulty) {
      questions = questions.filter(q => q.difficulty === filters.difficulty);
    }
    if (filters?.skills) {
      const skillsFilter = filters.skills.split(',');
      questions = questions.filter(q => 
        q.skills?.some((s: string) => skillsFilter.includes(s))
      );
    }

    return questions.map(q => ({
      id: q.id,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      expectedAnswer: q.expectedAnswer,
      skills: q.skills,
      timeMinutes: q.timeMinutes,
      usageCount: q.usageCount || 0,
      createdAt: q.createdAt,
    }));
  }

  async findOne(questionId: string, tenantId: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: { in: ['INTERVIEW_QUESTION_CREATED', 'INTERVIEW_QUESTION_UPDATED'] },
        metadata: {
          path: ['id'],
          equals: questionId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Interview question not found');
    }

    const metadata = log.metadata as any;
    if (metadata.tenantId !== tenantId) {
      throw new NotFoundException('Interview question not found');
    }

    return {
      id: metadata.id,
      question: metadata.question,
      category: metadata.category,
      difficulty: metadata.difficulty,
      expectedAnswer: metadata.expectedAnswer,
      skills: metadata.skills,
      timeMinutes: metadata.timeMinutes,
      usageCount: metadata.usageCount || 0,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
  }

  async update(questionId: string, dto: UpdateQuestionDto, tenantId: string, userId: string) {
    const existing = await this.findOne(questionId, tenantId);

    const updatedMetadata = {
      type: 'interview_question',
      id: questionId,
      tenantId,
      question: dto.question || existing.question,
      category: dto.category || existing.category,
      difficulty: dto.difficulty || existing.difficulty,
      expectedAnswer: dto.expectedAnswer !== undefined ? dto.expectedAnswer : existing.expectedAnswer,
      skills: dto.skills || existing.skills,
      timeMinutes: dto.timeMinutes !== undefined ? dto.timeMinutes : existing.timeMinutes,
      usageCount: existing.usageCount,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'INTERVIEW_QUESTION_UPDATED',
        description: `Interview question updated: ${updatedMetadata.question.substring(0, 50)}...`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return updatedMetadata;
  }

  async delete(questionId: string, tenantId: string, userId: string) {
    await this.findOne(questionId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: 'INTERVIEW_QUESTION_DELETED',
        description: `Interview question deleted`,
        userId,
        metadata: {
          type: 'interview_question_deleted',
          id: questionId,
          tenantId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  }

  async getCategories(tenantId: string) {
    const questions = await this.findAll(tenantId);
    const categories = [...new Set(questions.map(q => q.category))];
    
    return categories.map(cat => ({
      name: cat,
      count: questions.filter(q => q.category === cat).length,
    }));
  }

  async generateQuestionsForJob(jobId: string, tenantId: string, userId: string, count: number = 5) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { title: true, skills: true, description: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const skills = (job.skills as string[]) || [];
    
    // Generate template questions based on skills and job
    const templates = [
      { q: `Tell me about your experience with ${skills[0] || 'this role'}`, cat: 'Experience', diff: 'EASY' as const },
      { q: `How would you approach a challenging ${job.title} project?`, cat: 'Problem Solving', diff: 'MEDIUM' as const },
      { q: `Describe a time you had to learn a new technology quickly`, cat: 'Adaptability', diff: 'MEDIUM' as const },
      { q: `What's your approach to code review and collaboration?`, cat: 'Teamwork', diff: 'EASY' as const },
      { q: `How do you stay updated with industry trends?`, cat: 'Growth', diff: 'EASY' as const },
      { q: `Explain a complex technical concept to a non-technical stakeholder`, cat: 'Communication', diff: 'HARD' as const },
      { q: `How do you handle tight deadlines and competing priorities?`, cat: 'Time Management', diff: 'MEDIUM' as const },
    ];

    const selectedTemplates = templates.slice(0, count);
    const createdQuestions = [];

    for (const template of selectedTemplates) {
      const question = await this.create(
        {
          question: template.q,
          category: template.cat,
          difficulty: template.diff,
          skills: skills.slice(0, 3),
          timeMinutes: template.diff === 'HARD' ? 10 : template.diff === 'MEDIUM' ? 7 : 5,
        },
        tenantId,
        userId
      );
      createdQuestions.push(question);
    }

    return {
      jobId,
      jobTitle: job.title,
      questionsGenerated: createdQuestions.length,
      questions: createdQuestions,
    };
  }
}
