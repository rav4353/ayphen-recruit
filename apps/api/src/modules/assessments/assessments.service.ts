import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../../common/services/email.service';
import { ConfigService } from '@nestjs/config';

interface AssessmentQuestion {
  id: string;
  question: string;
  type?: 'MULTIPLE_CHOICE' | 'TEXT' | 'CODE' | 'RATING';
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

interface CreateAssessmentDto {
  name: string;
  description?: string;
  skills: string[];
  duration?: number;
  passingScore?: number;
  questions?: Omit<AssessmentQuestion, 'id'>[];
}

interface SubmitAnswersDto {
  candidateId: string;
  answers: Record<string, string>;
  timeTaken?: number;
}

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private generateAssessmentId(): string {
    return `assess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQuestionId(): string {
    return `q-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new skill assessment
   */
  async create(dto: CreateAssessmentDto, tenantId: string, userId: string) {
    const assessmentId = this.generateAssessmentId();

    const questions = (dto.questions || []).map(q => ({
      ...q,
      id: this.generateQuestionId(),
      points: q.points || 10,
    }));

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    await this.prisma.activityLog.create({
      data: {
        action: 'ASSESSMENT_CREATED',
        description: `Skill assessment created: ${dto.name}`,
        userId,
        metadata: {
          assessmentId,
          tenantId,
          name: dto.name,
          description: dto.description,
          skills: dto.skills,
          duration: dto.duration || 60,
          passingScore: dto.passingScore || 70,
          questions,
          totalPoints,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    return {
      id: assessmentId,
      name: dto.name,
      description: dto.description,
      skills: dto.skills,
      duration: dto.duration || 60,
      passingScore: dto.passingScore || 70,
      questionCount: questions.length,
      totalPoints,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get all assessments for tenant
   */
  async findAll(tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'ASSESSMENT_CREATED',
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const assessmentMap = new Map<string, any>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!assessmentMap.has(meta.assessmentId)) {
        assessmentMap.set(meta.assessmentId, {
          id: meta.assessmentId,
          name: meta.name,
          description: meta.description,
          skills: meta.skills,
          duration: meta.duration,
          passingScore: meta.passingScore,
          questionCount: meta.questions?.length || 0,
          totalPoints: meta.totalPoints,
          status: meta.status,
          createdAt: meta.createdAt,
        });
      }
    }

    return Array.from(assessmentMap.values());
  }

  /**
   * Get assessment by ID
   */
  async findById(assessmentId: string, tenantId: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'ASSESSMENT_CREATED',
        metadata: {
          path: ['assessmentId'],
          equals: assessmentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException('Assessment not found');
    }

    const meta = log.metadata as any;

    if (meta.tenantId !== tenantId) {
      throw new NotFoundException('Assessment not found');
    }

    return {
      id: meta.assessmentId,
      name: meta.name,
      description: meta.description,
      skills: meta.skills,
      duration: meta.duration,
      passingScore: meta.passingScore,
      questions: meta.questions,
      totalPoints: meta.totalPoints,
      status: meta.status,
      createdAt: meta.createdAt,
    };
  }

  /**
   * Update assessment
   */
  async update(assessmentId: string, tenantId: string, userId: string, updates: Partial<CreateAssessmentDto>) {
    const existing = await this.findById(assessmentId, tenantId);

    const questions = updates.questions
      ? updates.questions.map(q => ({
          ...q,
          id: this.generateQuestionId(),
          points: q.points || 10,
        }))
      : (existing as any).questions;

    const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);

    await this.prisma.activityLog.create({
      data: {
        action: 'ASSESSMENT_CREATED',
        description: `Assessment updated: ${updates.name || existing.name}`,
        userId,
        metadata: {
          assessmentId,
          tenantId,
          name: updates.name || existing.name,
          description: updates.description ?? existing.description,
          skills: updates.skills || existing.skills,
          duration: updates.duration || existing.duration,
          passingScore: updates.passingScore || existing.passingScore,
          questions,
          totalPoints,
          status: existing.status,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
    });

    return this.findById(assessmentId, tenantId);
  }

  /**
   * Delete assessment (soft delete by marking inactive)
   */
  async delete(assessmentId: string, tenantId: string, userId: string) {
    const existing = await this.findById(assessmentId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: 'ASSESSMENT_CREATED',
        description: `Assessment deleted: ${existing.name}`,
        userId,
        metadata: {
          ...(existing as any),
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
          deletedBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Send assessment to candidate
   */
  async sendToCandidate(
    assessmentId: string,
    candidateId: string,
    tenantId: string,
    userId: string,
    applicationId?: string,
  ) {
    const assessment = await this.findById(assessmentId, tenantId);
    
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const inviteId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.activityLog.create({
      data: {
        action: 'ASSESSMENT_INVITED',
        description: `Assessment "${assessment.name}" sent to ${candidate.firstName} ${candidate.lastName}`,
        userId,
        candidateId,
        metadata: {
          inviteId,
          assessmentId,
          assessmentName: assessment.name,
          candidateId,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          candidateEmail: candidate.email,
          applicationId,
          tenantId,
          status: 'PENDING',
          sentAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    // Send email notification to candidate
    try {
      const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:5173';
      const assessmentLink = `${appUrl}/assessments/${inviteId}`;
      const candidateName = `${candidate.firstName} ${candidate.lastName}`;

      await this.emailService.sendAssessmentInvitationEmail(
        candidate.email,
        candidateName,
        assessment.name,
        assessmentLink,
        expiresAt.toISOString(),
        tenantId,
      );

      this.logger.log(`Assessment invitation email sent to ${candidate.email} for assessment ${assessment.name}`);
    } catch (error) {
      this.logger.error(`Failed to send assessment invitation email to ${candidate.email}:`, error);
      // Don't throw - we still want to return success as the invite was created
    }

    return {
      inviteId,
      assessmentId,
      candidateId,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Get assessment results for a candidate
   */
  async getResults(assessmentId: string, candidateId: string, tenantId: string) {
    const resultLog = await this.prisma.activityLog.findFirst({
      where: {
        action: 'ASSESSMENT_COMPLETED',
        candidateId,
        metadata: {
          path: ['assessmentId'],
          equals: assessmentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resultLog) {
      // Check if invited but not completed
      const inviteLog = await this.prisma.activityLog.findFirst({
        where: {
          action: 'ASSESSMENT_INVITED',
          candidateId,
          metadata: {
            path: ['assessmentId'],
            equals: assessmentId,
          },
        },
      });

      if (inviteLog) {
        return {
          status: 'PENDING',
          invitedAt: (inviteLog.metadata as any).sentAt,
        };
      }

      throw new NotFoundException('Assessment results not found');
    }

    const meta = resultLog.metadata as any;

    return {
      assessmentId,
      candidateId,
      score: meta.score,
      totalPoints: meta.totalPoints,
      percentage: meta.percentage,
      passed: meta.passed,
      timeTaken: meta.timeTaken,
      completedAt: meta.completedAt,
      answers: meta.answers,
      questionResults: meta.questionResults,
    };
  }

  /**
   * Submit assessment answers
   */
  async submitResults(
    assessmentId: string,
    tenantId: string,
    dto: SubmitAnswersDto,
  ) {
    const assessment = await this.findById(assessmentId, tenantId);
    const questions = (assessment as any).questions || [];

    let score = 0;
    const questionResults: any[] = [];

    for (const question of questions) {
      const answer = dto.answers[question.id];
      let correct = false;
      let pointsEarned = 0;

      if (question.type === 'MULTIPLE_CHOICE' && question.correctAnswer) {
        correct = answer === question.correctAnswer;
        pointsEarned = correct ? question.points : 0;
      } else if (question.type === 'TEXT' || question.type === 'CODE') {
        // For text/code questions, award partial points for non-empty answers
        pointsEarned = answer && answer.trim() ? Math.floor(question.points * 0.5) : 0;
      } else if (question.type === 'RATING') {
        pointsEarned = answer ? parseInt(answer) || 0 : 0;
      }

      score += pointsEarned;
      questionResults.push({
        questionId: question.id,
        question: question.question,
        answer,
        correctAnswer: question.correctAnswer,
        correct,
        pointsEarned,
        maxPoints: question.points,
      });
    }

    const percentage = assessment.totalPoints > 0 
      ? Math.round((score / assessment.totalPoints) * 100) 
      : 0;
    const passed = percentage >= assessment.passingScore;

    await this.prisma.activityLog.create({
      data: {
        action: 'ASSESSMENT_COMPLETED',
        description: `Assessment "${assessment.name}" completed with ${percentage}%`,
        candidateId: dto.candidateId,
        metadata: {
          assessmentId,
          assessmentName: assessment.name,
          candidateId: dto.candidateId,
          tenantId,
          score,
          totalPoints: assessment.totalPoints,
          percentage,
          passed,
          passingScore: assessment.passingScore,
          timeTaken: dto.timeTaken,
          completedAt: new Date().toISOString(),
          answers: dto.answers,
          questionResults,
        },
      },
    });

    return {
      assessmentId,
      candidateId: dto.candidateId,
      score,
      totalPoints: assessment.totalPoints,
      percentage,
      passed,
      timeTaken: dto.timeTaken,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all results for an assessment
   */
  async getAllResults(assessmentId: string, tenantId: string) {
    await this.findById(assessmentId, tenantId); // Verify access

    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'ASSESSMENT_COMPLETED',
        metadata: {
          path: ['assessmentId'],
          equals: assessmentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const candidateIds = logs.map(l => (l.metadata as any).candidateId).filter(Boolean);
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const candidateMap = new Map(candidates.map(c => [c.id, c]));

    return logs.map(log => {
      const meta = log.metadata as any;
      const candidate = candidateMap.get(meta.candidateId);
      return {
        candidateId: meta.candidateId,
        candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown',
        candidateEmail: candidate?.email,
        score: meta.score,
        totalPoints: meta.totalPoints,
        percentage: meta.percentage,
        passed: meta.passed,
        timeTaken: meta.timeTaken,
        completedAt: meta.completedAt,
      };
    });
  }
}
