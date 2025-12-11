import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EmailService } from '../../common/services/email.service';
import { SkillsService } from '../reference/skills.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-query.dto';
import { Parser } from 'json2csv';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly skillsService: SkillsService,
  ) { }

  async create(dto: CreateCandidateDto, tenantId: string, userId?: string) {
    // Check for duplicate email
    const existing = await this.prisma.candidate.findFirst({
      where: {
        email: { equals: dto.email, mode: 'insensitive' },
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Candidate with this email already exists');
    }

    // Validate phone number if provided
    if (dto.phone) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(dto.phone.replace(/\s/g, ''))) {
        throw new ConflictException('Invalid phone number format');
      }
    }

    // Normalize skills
    let skills = dto.skills;
    if (skills && skills.length > 0) {
      skills = await this.skillsService.normalizeSkills(skills, tenantId);
    }

    // Create candidate
    const candidate = await this.prisma.candidate.create({
      data: {
        ...dto,
        candidateId: this.generateCandidateId(),
        skills,
        tenantId,
        ...(dto.referrerId && { referrerId: dto.referrerId }),
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_CREATED',
        description: `Candidate profile created for ${candidate.firstName} ${candidate.lastName}`,
        candidateId: candidate.id,
        userId,
        metadata: {
          email: candidate.email,
          source: candidate.source,
        },
      },
    });

    return candidate;
  }

  async createReferral(dto: CreateCandidateDto, tenantId: string, referrerId: string) {
    // Ensure source is set to REFERRAL
    const referralDto = {
      ...dto,
      source: 'REFERRAL',
      sourceDetails: `Referred by user ${referrerId}`,
      referrerId,
    };

    return this.create(referralDto, tenantId, referrerId);
  }

  async findAll(tenantId: string, query: CandidateQueryDto) {
    console.log('CandidatesService.findAll called');
    console.log('TenantID:', tenantId);
    console.log('Query:', JSON.stringify(query));

    const {
      skip,
      take,
      search,
      skills,
      location,
      source,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      referrerId, // Add this
    } = query;

    const where: Prisma.CandidateWhereInput = {
      tenantId,
      // Filter by search term (name, email, currentTitle, currentCompany)
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { currentTitle: { contains: search, mode: 'insensitive' } },
          { currentCompany: { contains: search, mode: 'insensitive' } },
        ],
      }),
      // Filter by location
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      // Filter by source
      ...(source && {
        source: { contains: source, mode: 'insensitive' },
      }),
      // Filter by referrerId
      ...(referrerId && {
        referrerId,
      }),
      // Filter by skills (array of strings)
      ...(skills && skills.length > 0 && {
        skills: {
          hasSome: skills,
        },
      }),
      // Filter by application status
      ...(status && {
        applications: {
          some: {
            status: status as any, // Cast to match enum if needed
          },
        },
      }),
    };

    console.log('Prisma Where:', JSON.stringify(where, null, 2));

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          _count: {
            select: { applications: true },
          },
          // Include the most recent application status
          applications: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              job: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    console.log(`Found ${candidates.length} candidates out of ${total}`);

    return {
      candidates,
      total,
    };
  }

  async getReferrals(tenantId: string, referrerId: string) {
    return this.prisma.candidate.findMany({
      where: {
        tenantId,
        referrerId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            status: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async export(tenantId: string, query: CandidateQueryDto) {
    const { candidates } = await this.findAll(tenantId, { ...query, take: 10000, skip: 0 });

    if (candidates.length === 0) {
      return '';
    }

    const fields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'currentTitle',
      'currentCompany',
      'location',
      'skills',
      'source',
      'createdAt',
    ];

    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(candidates);
  }

  async sendBulkEmail(ids: string[], subject: string, message: string, tenantId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      select: { email: true, firstName: true },
    });

    if (candidates.length === 0) {
      return { count: 0 };
    }

    // Send emails in parallel (SES can handle it, but maybe limit concurrency if needed)
    // For now, simple Promise.all
    const results = await Promise.all(
      candidates.map((candidate) =>
        this.emailService.sendEmail({
          to: candidate.email,
          subject,
          html: `<p>Hi ${candidate.firstName},</p><p>${message.replace(/\n/g, '<br>')}</p>`,
          text: `Hi ${candidate.firstName},\n\n${message}`,
          tenantId,
        })
      )
    );

    const successCount = results.filter((success) => success).length;
    return { count: successCount, total: candidates.length };
  }

  async merge(primaryId: string, secondaryId: string, tenantId: string) {
    const primary = await this.findById(primaryId);
    const secondary = await this.findById(secondaryId);

    if (primary.tenantId !== tenantId || secondary.tenantId !== tenantId) {
      throw new ConflictException('Candidates must belong to the same tenant');
    }

    // Transaction to ensure data integrity
    return this.prisma.$transaction(async (tx) => {
      // 1. Move Applications
      await tx.application.updateMany({
        where: { candidateId: secondaryId },
        data: { candidateId: primaryId },
      });

      // 2. Move Activity Logs
      await tx.activityLog.updateMany({
        where: { candidateId: secondaryId },
        data: { candidateId: primaryId },
      });

      // 3. Move Interviews (via Application usually, but if direct relation exists)
      // Interviews are linked to Application, so moving Application is enough.
      // But wait, Interview schema:
      // model Interview { ... applicationId String ... }
      // So moving application handles it.

      // 4. Merge Tags
      const mergedTags = [...new Set([...primary.tags, ...secondary.tags])];
      await tx.candidate.update({
        where: { id: primaryId },
        data: { tags: mergedTags },
      });

      // 5. Delete Secondary
      await tx.candidate.delete({
        where: { id: secondaryId },
      });

      // 6. Log Merge Activity
      await tx.activityLog.create({
        data: {
          action: 'CANDIDATE_MERGED',
          description: `Merged candidate ${secondary.firstName} ${secondary.lastName} into this profile`,
          candidateId: primaryId,
          userId: primary.referrerId, // Best guess for now, or pass userId from controller
          metadata: {
            mergedFromId: secondaryId,
            mergedFromName: `${secondary.firstName} ${secondary.lastName}`,
          },
        },
      });

      return tx.candidate.findUnique({ where: { id: primaryId } });
    });
  }

  async bulkDelete(ids: string[], tenantId: string) {
    return this.prisma.candidate.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });
  }

  async findById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            job: { select: { id: true, title: true, status: true } },
            currentStage: true,
          },
        },
      },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.candidate.findUnique({
      where: {
        email_tenantId: { email, tenantId },
      },
    });
  }

  async update(id: string, dto: UpdateCandidateDto) {
    const candidate = await this.findById(id);

    let skills = dto.skills;
    if (skills && skills.length > 0) {
      skills = await this.skillsService.normalizeSkills(skills, candidate.tenantId);
    }

    return this.prisma.candidate.update({
      where: { id },
      data: {
        ...dto,
        skills: skills || undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.candidate.delete({ where: { id } });
  }

  async addTags(id: string, tags: string[]) {
    const candidate = await this.findById(id);
    const uniqueTags = [...new Set([...candidate.tags, ...tags])];
    return this.prisma.candidate.update({
      where: { id },
      data: { tags: uniqueTags },
    });
  }

  async getActivities(candidateId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        OR: [
          { candidateId },
          {
            application: {
              candidateId,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private generateCandidateId(): string {
    return `CAN-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
