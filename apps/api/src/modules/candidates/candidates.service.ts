import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EmailService } from '../../common/services/email.service';
import { SkillsService } from '../reference/skills.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateQueryDto } from './dto/candidate-query.dto';
import { Parser } from 'json2csv';
import * as crypto from 'crypto';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly skillsService: SkillsService,
  ) { }

  private generateCandidateId() {
    const randomNum = crypto.randomInt(100000, 999999);
    return `CAND-${randomNum}`;
  }

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

  private async generateJobCode() {
    const randomNum = crypto.randomInt(100000, 999999);
    return `JOB-${randomNum}`;
  }

  // ==================== CANDIDATE NOTES ====================

  async createNote(
    candidateId: string,
    tenantId: string,
    userId: string,
    data: { content: string; isPrivate?: boolean; mentionedUserIds?: string[] }
  ) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const noteId = `note-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_CREATED',
        description: `Note added to candidate`,
        userId,
        candidateId,
        metadata: {
          type: 'candidate_note',
          id: noteId,
          tenantId,
          candidateId,
          content: data.content,
          isPrivate: data.isPrivate || false,
          mentionedUserIds: data.mentionedUserIds || [],
          isPinned: false,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    // Notify mentioned users
    if (data.mentionedUserIds?.length) {
      // Could trigger notifications here
    }

    return {
      id: noteId,
      content: data.content,
      isPrivate: data.isPrivate || false,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
  }

  async getNotes(candidateId: string, tenantId: string, userId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const noteLogs = await this.prisma.activityLog.findMany({
      where: {
        action: { in: ['CANDIDATE_NOTE_CREATED', 'CANDIDATE_NOTE_UPDATED'] },
        candidateId,
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest state of each note
    const noteMap = new Map<string, any>();
    for (const log of noteLogs) {
      const metadata = log.metadata as any;
      if (metadata.type === 'candidate_note' && !noteMap.has(metadata.id)) {
        noteMap.set(metadata.id, {
          ...metadata,
          author: log.user,
        });
      }
    }

    // Filter based on visibility
    const notes = Array.from(noteMap.values()).filter(
      (n) => !n.isPrivate || n.createdBy === userId
    );

    // Sort: pinned first, then by date
    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return notes.map((n) => ({
      id: n.id,
      content: n.content,
      isPrivate: n.isPrivate,
      isPinned: n.isPinned,
      author: n.author,
      mentionedUserIds: n.mentionedUserIds,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }

  async updateNote(
    candidateId: string,
    noteId: string,
    tenantId: string,
    userId: string,
    data: { content?: string; isPrivate?: boolean }
  ) {
    const notes = await this.getNotes(candidateId, tenantId, userId);
    const existing = notes.find((n) => n.id === noteId);

    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    const updatedMetadata = {
      type: 'candidate_note',
      id: noteId,
      tenantId,
      candidateId,
      content: data.content !== undefined ? data.content : existing.content,
      isPrivate: data.isPrivate !== undefined ? data.isPrivate : existing.isPrivate,
      isPinned: existing.isPinned,
      mentionedUserIds: existing.mentionedUserIds,
      createdBy: (existing as any).createdBy || userId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_UPDATED',
        description: `Note updated`,
        userId,
        candidateId,
        metadata: updatedMetadata,
      },
    });

    return {
      id: noteId,
      content: updatedMetadata.content,
      isPrivate: updatedMetadata.isPrivate,
      isPinned: updatedMetadata.isPinned,
      updatedAt: updatedMetadata.updatedAt,
    };
  }

  async deleteNote(candidateId: string, noteId: string, tenantId: string, userId: string) {
    const notes = await this.getNotes(candidateId, tenantId, userId);
    const existing = notes.find((n) => n.id === noteId);

    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_DELETED',
        description: `Note deleted`,
        userId,
        candidateId,
        metadata: {
          type: 'candidate_note_deleted',
          id: noteId,
          tenantId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  }

  async pinNote(candidateId: string, noteId: string, tenantId: string, userId: string) {
    return this.toggleNotePin(candidateId, noteId, tenantId, userId, true);
  }

  async unpinNote(candidateId: string, noteId: string, tenantId: string, userId: string) {
    return this.toggleNotePin(candidateId, noteId, tenantId, userId, false);
  }

  private async toggleNotePin(
    candidateId: string,
    noteId: string,
    tenantId: string,
    userId: string,
    pinned: boolean
  ) {
    const notes = await this.getNotes(candidateId, tenantId, userId);
    const existing = notes.find((n) => n.id === noteId);

    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    const updatedMetadata = {
      type: 'candidate_note',
      id: noteId,
      tenantId,
      candidateId,
      content: existing.content,
      isPrivate: existing.isPrivate,
      isPinned: pinned,
      mentionedUserIds: existing.mentionedUserIds,
      createdBy: (existing as any).createdBy || userId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_NOTE_UPDATED',
        description: pinned ? 'Note pinned' : 'Note unpinned',
        userId,
        candidateId,
        metadata: updatedMetadata,
      },
    });

    return { id: noteId, isPinned: pinned };
  }

  /**
   * Find potential duplicate candidates based on email, phone, or name
   */
  async findDuplicates(
    tenantId: string,
    criteria: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      excludeId?: string;
    },
  ) {
    const duplicates: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      matchType: 'exact_email' | 'exact_phone' | 'fuzzy_name';
      confidence: number;
    }> = [];

    const excludeFilter = criteria.excludeId ? { id: { not: criteria.excludeId } } : {};

    // 1. Exact email match (highest confidence)
    if (criteria.email) {
      const emailMatches = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          email: { equals: criteria.email, mode: 'insensitive' },
          ...excludeFilter,
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });

      for (const match of emailMatches) {
        duplicates.push({
          ...match,
          matchType: 'exact_email',
          confidence: 100,
        });
      }
    }

    // 2. Exact phone match (high confidence)
    if (criteria.phone) {
      const normalizedPhone = criteria.phone.replace(/[\s\-\(\)]/g, '');
      const phoneMatches = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          phone: { not: null },
          ...excludeFilter,
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });

      for (const match of phoneMatches) {
        if (match.phone) {
          const matchPhone = match.phone.replace(/[\s\-\(\)]/g, '');
          if (matchPhone === normalizedPhone || matchPhone.endsWith(normalizedPhone.slice(-10))) {
            if (!duplicates.some(d => d.id === match.id)) {
              duplicates.push({
                ...match,
                matchType: 'exact_phone',
                confidence: 95,
              });
            }
          }
        }
      }
    }

    // 3. Fuzzy name match (lower confidence)
    if (criteria.firstName && criteria.lastName) {
      const nameMatches = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          firstName: { equals: criteria.firstName, mode: 'insensitive' },
          lastName: { equals: criteria.lastName, mode: 'insensitive' },
          ...excludeFilter,
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });

      for (const match of nameMatches) {
        if (!duplicates.some(d => d.id === match.id)) {
          duplicates.push({
            ...match,
            matchType: 'fuzzy_name',
            confidence: 70,
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Update GDPR consent for a candidate
   */
  async updateGdprConsent(
    id: string,
    consent: {
      dataProcessingConsent: boolean;
      marketingConsent?: boolean;
      consentSource?: string;
    },
    userId?: string,
  ) {
    const candidate = await this.findById(id);

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        gdprConsent: consent.dataProcessingConsent,
        gdprConsentAt: consent.dataProcessingConsent ? new Date() : null,
      },
    });

    // Log the consent update
    await this.prisma.activityLog.create({
      data: {
        action: 'GDPR_CONSENT_UPDATED',
        description: `GDPR consent ${consent.dataProcessingConsent ? 'granted' : 'revoked'} via ${consent.consentSource || 'manual update'}`,
        candidateId: id,
        userId,
        metadata: {
          dataProcessingConsent: consent.dataProcessingConsent,
          marketingConsent: consent.marketingConsent,
          consentSource: consent.consentSource,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  /**
   * Anonymize candidate data (GDPR Right to be Forgotten)
   */
  async anonymizeCandidate(id: string, userId: string) {
    const candidate = await this.findById(id);

    // Anonymize personal data
    const anonymized = await this.prisma.candidate.update({
      where: { id },
      data: {
        firstName: 'ANONYMIZED',
        lastName: 'USER',
        email: `anonymized-${id}@deleted.local`,
        phone: null,
        resumeUrl: null,
        resumeText: null,
        location: null,
        linkedinUrl: null,
        currentTitle: null,
        currentCompany: null,
        summary: 'This candidate data has been anonymized per GDPR request.',
        skills: [],
        experience: null,
        education: null,
        gdprConsent: false,
        gdprConsentAt: null,
        tags: ['ANONYMIZED'],
      },
    });

    // Log the anonymization
    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_ANONYMIZED',
        description: 'Candidate data anonymized per GDPR Right to be Forgotten request',
        candidateId: id,
        userId,
        metadata: {
          originalEmail: candidate.email,
          anonymizedAt: new Date().toISOString(),
        },
      },
    });

    return anonymized;
  }

  /**
   * Import candidates from CSV data
   */
  async importFromCsv(
    tenantId: string,
    userId: string,
    csvData: string,
    options?: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      jobId?: string;
      source?: string;
      tags?: string[];
    },
  ) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { success: false, error: 'CSV must have header row and at least one data row' };
    }

    // Parse header row
    const headers = this.parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredFields = ['email'];
    const missingFields = requiredFields.filter(f => !headers.includes(f));

    if (missingFields.length > 0) {
      return { success: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    const results: {
      total: number;
      imported: number;
      skipped: number;
      updated: number;
      errors: { row: number; email: string; error: string }[];
    } = {
      total: lines.length - 1,
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [],
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index]?.trim() || '';
      });

      const email = rowData['email'];
      if (!email) {
        results.errors.push({ row: i + 1, email: '', error: 'Email is required' });
        continue;
      }

      try {
        // Check for existing candidate
        const existing = await this.prisma.candidate.findFirst({
          where: { email: { equals: email, mode: 'insensitive' }, tenantId },
        });

        if (existing) {
          if (options?.skipDuplicates) {
            results.skipped++;
            continue;
          }

          if (options?.updateExisting) {
            // Update existing candidate
            await this.prisma.candidate.update({
              where: { id: existing.id },
              data: this.mapCsvRowToCandidate(rowData, options),
            });
            results.updated++;
            continue;
          }

          results.skipped++;
          results.errors.push({ row: i + 1, email, error: 'Duplicate email' });
          continue;
        }

        // Create new candidate
        const candidateData = this.mapCsvRowToCandidate(rowData, options);
        const candidate = await this.prisma.candidate.create({
          data: {
            ...candidateData,
            candidateId: this.generateCandidateId(),
            tenantId,
          },
        });

        // Create application if jobId provided
        if (options?.jobId) {
          const job = await this.prisma.job.findFirst({
            where: { id: options.jobId, tenantId },
            include: {
              pipeline: {
                include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
              },
            },
          });

          if (job) {
            await this.prisma.application.create({
              data: {
                candidateId: candidate.id,
                jobId: options.jobId,
                currentStageId: job.pipeline?.stages[0]?.id,
                status: 'APPLIED',
              },
            });
          }
        }

        results.imported++;
      } catch (error: any) {
        results.errors.push({ row: i + 1, email, error: error.message });
      }
    }

    // Log the import
    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATES_IMPORTED',
        description: `Imported ${results.imported} candidates from CSV`,
        userId,
        metadata: {
          total: results.total,
          imported: results.imported,
          skipped: results.skipped,
          updated: results.updated,
          errorCount: results.errors.length,
          source: options?.source || 'CSV Import',
          jobId: options?.jobId,
        },
      },
    });

    return {
      success: true,
      ...results,
    };
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  /**
   * Map CSV row data to candidate fields
   */
  private mapCsvRowToCandidate(
    rowData: Record<string, string>,
    options?: { source?: string; tags?: string[] },
  ): any {
    const skills = rowData['skills']
      ? rowData['skills'].split(/[,;]/).map(s => s.trim()).filter(Boolean)
      : [];

    return {
      email: rowData['email'],
      firstName: rowData['firstname'] || rowData['first_name'] || rowData['first name'] || '',
      lastName: rowData['lastname'] || rowData['last_name'] || rowData['last name'] || '',
      phone: rowData['phone'] || rowData['phonenumber'] || rowData['phone_number'] || null,
      location: rowData['location'] || rowData['city'] || null,
      currentTitle: rowData['title'] || rowData['currenttitle'] || rowData['current_title'] || rowData['job_title'] || null,
      currentCompany: rowData['company'] || rowData['currentcompany'] || rowData['current_company'] || null,
      linkedinUrl: rowData['linkedin'] || rowData['linkedinurl'] || rowData['linkedin_url'] || null,
      skills: skills.length > 0 ? skills : [],
      summary: rowData['summary'] || rowData['bio'] || rowData['about'] || null,
      source: options?.source || rowData['source'] || 'CSV_IMPORT',
      sourceDetails: 'Imported from CSV',
      tags: options?.tags || [],
    };
  }

  /**
   * Generate import template CSV
   */
  getImportTemplate(): string {
    const headers = [
      'email',
      'firstName',
      'lastName',
      'phone',
      'location',
      'currentTitle',
      'currentCompany',
      'linkedin',
      'skills',
      'summary',
      'source',
    ];

    const sampleRow = [
      'john.doe@example.com',
      'John',
      'Doe',
      '+1-555-123-4567',
      'New York, NY',
      'Software Engineer',
      'Tech Corp',
      'https://linkedin.com/in/johndoe',
      'JavaScript, TypeScript, React',
      'Experienced software engineer with 5+ years',
      'LinkedIn',
    ];

    return [headers.join(','), sampleRow.join(',')].join('\n');
  }

  /**
   * Validate CSV before import
   */
  validateCsvForImport(csvData: string): {
    valid: boolean;
    rowCount: number;
    headers: string[];
    errors: string[];
  } {
    const lines = csvData.split('\n').filter(line => line.trim());
    const errors: string[] = [];

    if (lines.length < 1) {
      return { valid: false, rowCount: 0, headers: [], errors: ['CSV file is empty'] };
    }

    const headers = this.parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());

    if (!headers.includes('email')) {
      errors.push('Missing required column: email');
    }

    // Check for common column names
    const hasName = headers.includes('firstname') || headers.includes('first_name') ||
                   headers.includes('first name') || headers.includes('name');
    if (!hasName) {
      errors.push('Warning: No name columns found (firstname, first_name, name)');
    }

    // Validate data rows
    let validRows = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const emailIndex = headers.indexOf('email');
      const email = values[emailIndex]?.trim();

      if (email && this.isValidEmail(email)) {
        validRows++;
      } else if (email) {
        errors.push(`Row ${i + 1}: Invalid email format - ${email}`);
      }
    }

    return {
      valid: errors.filter(e => !e.startsWith('Warning')).length === 0,
      rowCount: lines.length - 1,
      headers,
      errors,
    };
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
