import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface EmailSequenceStep {
  id: string;
  order: number;
  subject: string;
  body: string;
  delayDays: number;
  delayHours: number;
}

interface CreateSequenceDto {
  name: string;
  description?: string;
  triggerType: 'MANUAL' | 'APPLICATION_CREATED' | 'STAGE_ENTERED' | 'OFFER_SENT';
  triggerStageId?: string;
  steps: Omit<EmailSequenceStep, 'id'>[];
}

@Injectable()
export class EmailSequencesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new email sequence
   */
  async create(dto: CreateSequenceDto, tenantId: string, userId: string) {
    const sequenceId = this.generateId('seq');

    const steps = dto.steps.map((step, index) => ({
      ...step,
      id: this.generateId('step'),
      order: index + 1,
    }));

    await this.prisma.activityLog.create({
      data: {
        action: 'EMAIL_SEQUENCE_CREATED',
        description: `Email sequence created: ${dto.name}`,
        userId,
        metadata: {
          sequenceId,
          tenantId,
          name: dto.name,
          description: dto.description,
          triggerType: dto.triggerType,
          triggerStageId: dto.triggerStageId,
          steps,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    return {
      id: sequenceId,
      name: dto.name,
      description: dto.description,
      triggerType: dto.triggerType,
      stepCount: steps.length,
      status: 'ACTIVE',
    };
  }

  /**
   * Get all sequences for tenant
   */
  async findAll(tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'EMAIL_SEQUENCE_CREATED',
        metadata: { path: ['tenantId'], equals: tenantId },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sequenceMap = new Map<string, any>();
    for (const log of logs) {
      const meta = log.metadata as any;
      if (!sequenceMap.has(meta.sequenceId) && meta.status !== 'DELETED') {
        sequenceMap.set(meta.sequenceId, {
          id: meta.sequenceId,
          name: meta.name,
          description: meta.description,
          triggerType: meta.triggerType,
          stepCount: meta.steps?.length || 0,
          status: meta.status,
          createdAt: meta.createdAt,
        });
      }
    }

    return Array.from(sequenceMap.values());
  }

  /**
   * Get sequence by ID
   */
  async findById(sequenceId: string, tenantId: string) {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: 'EMAIL_SEQUENCE_CREATED',
        metadata: { path: ['sequenceId'], equals: sequenceId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) throw new NotFoundException('Sequence not found');

    const meta = log.metadata as any;
    if (meta.tenantId !== tenantId || meta.status === 'DELETED') {
      throw new NotFoundException('Sequence not found');
    }

    return {
      id: meta.sequenceId,
      name: meta.name,
      description: meta.description,
      triggerType: meta.triggerType,
      triggerStageId: meta.triggerStageId,
      steps: meta.steps,
      status: meta.status,
      createdAt: meta.createdAt,
    };
  }

  /**
   * Update sequence
   */
  async update(sequenceId: string, dto: Partial<CreateSequenceDto>, tenantId: string, userId: string) {
    const existing = await this.findById(sequenceId, tenantId);

    const steps = dto.steps
      ? dto.steps.map((step, index) => ({
          ...step,
          id: this.generateId('step'),
          order: index + 1,
        }))
      : (existing as any).steps;

    await this.prisma.activityLog.create({
      data: {
        action: 'EMAIL_SEQUENCE_CREATED',
        description: `Email sequence updated: ${dto.name || existing.name}`,
        userId,
        metadata: {
          sequenceId,
          tenantId,
          name: dto.name || existing.name,
          description: dto.description ?? existing.description,
          triggerType: dto.triggerType || existing.triggerType,
          triggerStageId: dto.triggerStageId ?? existing.triggerStageId,
          steps,
          status: existing.status,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
    });

    return this.findById(sequenceId, tenantId);
  }

  /**
   * Delete sequence
   */
  async delete(sequenceId: string, tenantId: string, userId: string) {
    const existing = await this.findById(sequenceId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: 'EMAIL_SEQUENCE_CREATED',
        description: `Email sequence deleted: ${existing.name}`,
        userId,
        metadata: {
          ...(existing as any),
          sequenceId,
          tenantId,
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
          deletedBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Enroll a candidate in a sequence
   */
  async enrollCandidate(sequenceId: string, candidateId: string, tenantId: string, userId: string) {
    const sequence = await this.findById(sequenceId, tenantId);

    // Check if already enrolled
    const existingEnrollment = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SEQUENCE_ENROLLMENT',
        candidateId,
        metadata: {
          path: ['sequenceId'],
          equals: sequenceId,
        },
      },
    });

    if (existingEnrollment) {
      const meta = existingEnrollment.metadata as any;
      if (meta.status === 'ACTIVE') {
        throw new BadRequestException('Candidate is already enrolled in this sequence');
      }
    }

    const enrollmentId = this.generateId('enroll');

    await this.prisma.activityLog.create({
      data: {
        action: 'SEQUENCE_ENROLLMENT',
        description: `Enrolled in sequence: ${sequence.name}`,
        userId,
        candidateId,
        metadata: {
          enrollmentId,
          sequenceId,
          tenantId,
          candidateId,
          currentStepIndex: 0,
          status: 'ACTIVE',
          enrolledAt: new Date().toISOString(),
          enrolledBy: userId,
          nextSendAt: this.calculateNextSendTime(sequence.steps[0]),
        },
      },
    });

    return { enrollmentId, sequenceId, candidateId, status: 'ACTIVE' };
  }

  /**
   * Unenroll a candidate from a sequence
   */
  async unenrollCandidate(sequenceId: string, candidateId: string, tenantId: string, userId: string) {
    const enrollment = await this.prisma.activityLog.findFirst({
      where: {
        action: 'SEQUENCE_ENROLLMENT',
        candidateId,
        metadata: {
          path: ['sequenceId'],
          equals: sequenceId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const meta = enrollment.metadata as any;

    await this.prisma.activityLog.create({
      data: {
        action: 'SEQUENCE_ENROLLMENT',
        description: 'Unenrolled from sequence',
        userId,
        candidateId,
        metadata: {
          ...meta,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get candidate's sequence enrollments
   */
  async getCandidateEnrollments(candidateId: string, tenantId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'SEQUENCE_ENROLLMENT',
        candidateId,
        metadata: { path: ['tenantId'], equals: tenantId },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrollmentMap = new Map<string, any>();
    for (const log of logs) {
      const meta = log.metadata as any;
      if (!enrollmentMap.has(meta.sequenceId)) {
        enrollmentMap.set(meta.sequenceId, {
          enrollmentId: meta.enrollmentId,
          sequenceId: meta.sequenceId,
          currentStepIndex: meta.currentStepIndex,
          status: meta.status,
          enrolledAt: meta.enrolledAt,
          nextSendAt: meta.nextSendAt,
        });
      }
    }

    return Array.from(enrollmentMap.values());
  }

  /**
   * Process pending sequence emails (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processSequenceEmails() {
    const now = new Date();

    // Find active enrollments with pending emails
    const enrollments = await this.prisma.activityLog.findMany({
      where: {
        action: 'SEQUENCE_ENROLLMENT',
        metadata: { path: ['status'], equals: 'ACTIVE' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const processedEnrollments = new Set<string>();

    for (const log of enrollments) {
      const meta = log.metadata as any;
      
      if (processedEnrollments.has(meta.enrollmentId)) continue;
      processedEnrollments.add(meta.enrollmentId);

      if (meta.nextSendAt && new Date(meta.nextSendAt) <= now) {
        await this.sendSequenceEmail(meta);
      }
    }
  }

  private async sendSequenceEmail(enrollment: any) {
    try {
      const sequence = await this.findById(enrollment.sequenceId, enrollment.tenantId);
      const currentStep = sequence.steps[enrollment.currentStepIndex];

      if (!currentStep) {
        // Sequence complete
        await this.prisma.activityLog.create({
          data: {
            action: 'SEQUENCE_ENROLLMENT',
            description: 'Sequence completed',
            candidateId: enrollment.candidateId,
            metadata: {
              ...enrollment,
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
            },
          },
        });
        return;
      }

      // Get candidate email
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: enrollment.candidateId },
        select: { email: true, firstName: true },
      });

      if (!candidate) return;

      // Log the email send (actual sending would be done by email service)
      await this.prisma.activityLog.create({
        data: {
          action: 'SEQUENCE_EMAIL_SENT',
          description: `Sequence email sent: ${currentStep.subject}`,
          candidateId: enrollment.candidateId,
          metadata: {
            enrollmentId: enrollment.enrollmentId,
            sequenceId: enrollment.sequenceId,
            stepId: currentStep.id,
            stepOrder: currentStep.order,
            subject: currentStep.subject,
            sentAt: new Date().toISOString(),
          },
        },
      });

      // Update enrollment to next step
      const nextStepIndex = enrollment.currentStepIndex + 1;
      const nextStep = sequence.steps[nextStepIndex];

      await this.prisma.activityLog.create({
        data: {
          action: 'SEQUENCE_ENROLLMENT',
          description: nextStep ? 'Advanced to next step' : 'Sequence completed',
          candidateId: enrollment.candidateId,
          metadata: {
            ...enrollment,
            currentStepIndex: nextStepIndex,
            status: nextStep ? 'ACTIVE' : 'COMPLETED',
            nextSendAt: nextStep ? this.calculateNextSendTime(nextStep) : null,
            ...(nextStep ? {} : { completedAt: new Date().toISOString() }),
          },
        },
      });
    } catch (error) {
      console.error('Error sending sequence email:', error);
    }
  }

  private calculateNextSendTime(step: any): string {
    const now = new Date();
    const delayMs = ((step.delayDays || 0) * 24 * 60 + (step.delayHours || 0) * 60) * 60 * 1000;
    return new Date(now.getTime() + delayMs).toISOString();
  }
}
