import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateSourcedCandidateDto,
  UpdateSourcedCandidateDto,
  SearchSourcedCandidatesDto,
  RecordOutreachDto,
  AddToPipelineDto,
  BulkOutreachDto,
  SourcingStatus,
  SourcingChannel,
} from "./dto";

export interface SourcedCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  location?: string;
  skills: string[];
  experience?: string;
  profileUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  summary?: string;
  source: SourcingChannel;
  sourceDetails?: string;
  status: SourcingStatus;
  rating?: number;
  notes?: string;
  targetJobId?: string;
  outreachHistory: OutreachRecord[];
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachRecord {
  id: string;
  type: string;
  subject?: string;
  message?: string;
  notes?: string;
  sentAt: string;
  sentBy: string;
}

@Injectable()
export class SourcingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateSourcedCandidateDto,
    tenantId: string,
    userId: string,
  ): Promise<SourcedCandidate> {
    // Check for duplicate email in sourced candidates
    const existingSourced = await this.findByEmail(dto.email, tenantId);
    if (existingSourced) {
      throw new ConflictException(
        "A sourced candidate with this email already exists",
      );
    }

    // Check if candidate already exists in main candidate database
    const existingCandidate = await this.prisma.candidate.findFirst({
      where: { email: dto.email, tenantId },
    });

    const sourcedCandidate: SourcedCandidate = {
      id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      currentTitle: dto.currentTitle,
      currentCompany: dto.currentCompany,
      location: dto.location,
      skills: dto.skills || [],
      experience: dto.experience,
      profileUrl: dto.profileUrl,
      linkedinUrl: dto.linkedinUrl,
      resumeUrl: dto.resumeUrl,
      summary: dto.summary,
      source: dto.source || SourcingChannel.OTHER,
      sourceDetails: dto.sourceDetails,
      status: SourcingStatus.NEW,
      rating: dto.rating,
      notes: dto.notes,
      targetJobId: dto.targetJobId,
      outreachHistory: [],
      tenantId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in activity log (using JSON metadata for sourced candidates)
    await this.prisma.activityLog.create({
      data: {
        action: "SOURCED_CANDIDATE_CREATED",
        description: `Sourced candidate created: ${dto.firstName} ${dto.lastName}`,
        userId,
        metadata: JSON.parse(
          JSON.stringify({
            type: "sourced_candidate",
            ...sourcedCandidate,
            existsInCandidateDb: !!existingCandidate,
            existingCandidateId: existingCandidate?.id,
          }),
        ),
      },
    });

    return sourcedCandidate;
  }

  async findAll(tenantId: string, query: SearchSourcedCandidatesDto) {
    const {
      search,
      status,
      source,
      skills,
      location,
      page = 1,
      take = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Get all sourced candidate logs for this tenant
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: {
          in: ["SOURCED_CANDIDATE_CREATED", "SOURCED_CANDIDATE_UPDATED"],
        },
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build map of latest state for each sourced candidate
    const candidateMap = new Map<string, SourcedCandidate>();
    for (const log of logs) {
      const metadata = log.metadata as any;
      if (
        metadata.type === "sourced_candidate" &&
        !candidateMap.has(metadata.id)
      ) {
        // Check if deleted
        const deletedLog = await this.prisma.activityLog.findFirst({
          where: {
            action: "SOURCED_CANDIDATE_DELETED",
            metadata: {
              path: ["id"],
              equals: metadata.id,
            },
          },
        });
        if (!deletedLog) {
          candidateMap.set(metadata.id, metadata as SourcedCandidate);
        }
      }
    }

    let candidates = Array.from(candidateMap.values());

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.currentTitle?.toLowerCase().includes(searchLower) ||
          c.currentCompany?.toLowerCase().includes(searchLower) ||
          c.skills.some((s) => s.toLowerCase().includes(searchLower)),
      );
    }

    if (status) {
      candidates = candidates.filter((c) => c.status === status);
    }

    if (source) {
      candidates = candidates.filter((c) => c.source === source);
    }

    if (skills && skills.length > 0) {
      candidates = candidates.filter((c) =>
        skills.some((skill) =>
          c.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
        ),
      );
    }

    if (location) {
      candidates = candidates.filter((c) =>
        c.location?.toLowerCase().includes(location.toLowerCase()),
      );
    }

    // Sort
    candidates.sort((a, b) => {
      const aVal = (a as any)[sortBy] || "";
      const bVal = (b as any)[sortBy] || "";
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Paginate
    const total = candidates.length;
    const skip = (page - 1) * take;
    const paginatedCandidates = candidates.slice(skip, skip + take);

    return {
      data: paginatedCandidates,
      meta: {
        total,
        page,
        take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<SourcedCandidate> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        action: {
          in: ["SOURCED_CANDIDATE_CREATED", "SOURCED_CANDIDATE_UPDATED"],
        },
        metadata: {
          path: ["id"],
          equals: id,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!log) {
      throw new NotFoundException("Sourced candidate not found");
    }

    const metadata = log.metadata as any;
    if (metadata.tenantId !== tenantId) {
      throw new NotFoundException("Sourced candidate not found");
    }

    // Check if deleted
    const deletedLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "SOURCED_CANDIDATE_DELETED",
        metadata: {
          path: ["id"],
          equals: id,
        },
      },
    });

    if (deletedLog) {
      throw new NotFoundException("Sourced candidate not found");
    }

    return metadata as SourcedCandidate;
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<SourcedCandidate | null> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: {
          in: ["SOURCED_CANDIDATE_CREATED", "SOURCED_CANDIDATE_UPDATED"],
        },
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const log of logs) {
      const metadata = log.metadata as any;
      if (metadata.type === "sourced_candidate" && metadata.email === email) {
        // Check if deleted
        const deletedLog = await this.prisma.activityLog.findFirst({
          where: {
            action: "SOURCED_CANDIDATE_DELETED",
            metadata: {
              path: ["id"],
              equals: metadata.id,
            },
          },
        });
        if (!deletedLog) {
          return metadata as SourcedCandidate;
        }
      }
    }

    return null;
  }

  async update(
    id: string,
    dto: UpdateSourcedCandidateDto,
    tenantId: string,
    userId: string,
  ): Promise<SourcedCandidate> {
    const existing = await this.findOne(id, tenantId);

    const updated: SourcedCandidate = {
      ...existing,
      ...dto,
      skills: dto.skills || existing.skills,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: "SOURCED_CANDIDATE_UPDATED",
        description: `Sourced candidate updated: ${updated.firstName} ${updated.lastName}`,
        userId,
        metadata: JSON.parse(
          JSON.stringify({
            type: "sourced_candidate",
            ...updated,
          }),
        ),
      },
    });

    return updated;
  }

  async delete(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.findOne(id, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: "SOURCED_CANDIDATE_DELETED",
        description: `Sourced candidate deleted: ${existing.firstName} ${existing.lastName}`,
        userId,
        metadata: JSON.parse(
          JSON.stringify({
            type: "sourced_candidate_deleted",
            id,
            tenantId,
            deletedAt: new Date().toISOString(),
          }),
        ),
      },
    });

    return { success: true };
  }

  async recordOutreach(
    dto: RecordOutreachDto,
    tenantId: string,
    userId: string,
  ): Promise<SourcedCandidate> {
    const existing = await this.findOne(dto.sourcedCandidateId, tenantId);

    const outreachRecord: OutreachRecord = {
      id: `out-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: dto.type,
      subject: dto.subject,
      message: dto.message,
      notes: dto.notes,
      sentAt: new Date().toISOString(),
      sentBy: userId,
    };

    const updated: SourcedCandidate = {
      ...existing,
      status:
        existing.status === SourcingStatus.NEW
          ? SourcingStatus.CONTACTED
          : existing.status,
      outreachHistory: [...existing.outreachHistory, outreachRecord],
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: "SOURCED_CANDIDATE_UPDATED",
        description: `Outreach recorded for: ${updated.firstName} ${updated.lastName}`,
        userId,
        metadata: JSON.parse(
          JSON.stringify({
            type: "sourced_candidate",
            ...updated,
          }),
        ),
      },
    });

    return updated;
  }

  async addToPipeline(dto: AddToPipelineDto, tenantId: string, userId: string) {
    const sourcedCandidate = await this.findOne(
      dto.sourcedCandidateId,
      tenantId,
    );

    // Check if job exists
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, tenantId },
      include: {
        pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
      },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Check if candidate already exists in main database
    let candidate = await this.prisma.candidate.findFirst({
      where: { email: sourcedCandidate.email, tenantId },
    });

    // Create candidate if doesn't exist
    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          tenantId,
          email: sourcedCandidate.email,
          firstName: sourcedCandidate.firstName,
          lastName: sourcedCandidate.lastName,
          phone: sourcedCandidate.phone,
          currentTitle: sourcedCandidate.currentTitle,
          currentCompany: sourcedCandidate.currentCompany,
          location: sourcedCandidate.location,
          skills: sourcedCandidate.skills,
          linkedinUrl: sourcedCandidate.linkedinUrl,
          resumeUrl: sourcedCandidate.resumeUrl,
          summary: sourcedCandidate.summary,
          source: sourcedCandidate.source,
          sourceDetails: `Sourced: ${sourcedCandidate.sourceDetails || sourcedCandidate.source}`,
        },
      });
    }

    // Check for existing application
    const existingApplication = await this.prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId: dto.jobId },
    });

    if (existingApplication) {
      throw new ConflictException(
        "Candidate already has an application for this job",
      );
    }

    // Get first pipeline stage
    const firstStage = job.pipeline?.stages?.[0];

    // Create application
    const application = await this.prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: dto.jobId,
        currentStageId: firstStage?.id,
        coverLetter: dto.coverLetter,
        notes: `Added from sourcing. Original source: ${sourcedCandidate.source}`,
      },
    });

    // Update sourced candidate status
    await this.update(
      dto.sourcedCandidateId,
      { status: SourcingStatus.ADDED_TO_PIPELINE },
      tenantId,
      userId,
    );

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: "SOURCED_CANDIDATE_ADDED_TO_PIPELINE",
        description: `${sourcedCandidate.firstName} ${sourcedCandidate.lastName} added to pipeline for ${job.title}`,
        userId,
        applicationId: application.id,
        candidateId: candidate.id,
        metadata: {
          sourcedCandidateId: dto.sourcedCandidateId,
          jobId: dto.jobId,
          jobTitle: job.title,
        },
      },
    });

    return {
      success: true,
      candidateId: candidate.id,
      applicationId: application.id,
      message: `Successfully added ${sourcedCandidate.firstName} ${sourcedCandidate.lastName} to ${job.title}`,
    };
  }

  async bulkOutreach(dto: BulkOutreachDto, tenantId: string, userId: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of dto.sourcedCandidateIds) {
      try {
        const candidate = await this.findOne(id, tenantId);

        // Record outreach
        await this.recordOutreach(
          {
            sourcedCandidateId: id,
            type: "EMAIL",
            subject: dto.subject,
            message: dto.message,
          },
          tenantId,
          userId,
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed for ${id}: ${error.message}`);
      }
    }

    return results;
  }

  async getStats(tenantId: string) {
    const result = await this.findAll(tenantId, { take: 1000 });
    const candidates = result.data;

    const statusCounts = {
      [SourcingStatus.NEW]: 0,
      [SourcingStatus.CONTACTED]: 0,
      [SourcingStatus.RESPONDED]: 0,
      [SourcingStatus.INTERESTED]: 0,
      [SourcingStatus.NOT_INTERESTED]: 0,
      [SourcingStatus.ADDED_TO_PIPELINE]: 0,
    };

    const sourceCounts: Record<string, number> = {};

    for (const c of candidates) {
      statusCounts[c.status]++;
      sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
    }

    const totalOutreach = candidates.reduce(
      (sum, c) => sum + c.outreachHistory.length,
      0,
    );
    const responseRate =
      candidates.length > 0
        ? (
            ((statusCounts[SourcingStatus.RESPONDED] +
              statusCounts[SourcingStatus.INTERESTED]) /
              candidates.length) *
            100
          ).toFixed(1)
        : "0";
    const conversionRate =
      candidates.length > 0
        ? (
            (statusCounts[SourcingStatus.ADDED_TO_PIPELINE] /
              candidates.length) *
            100
          ).toFixed(1)
        : "0";

    return {
      total: candidates.length,
      statusCounts,
      sourceCounts,
      totalOutreach,
      responseRate: `${responseRate}%`,
      conversionRate: `${conversionRate}%`,
    };
  }

  async getSuggestedCandidates(jobId: string, tenantId: string) {
    // Get job details
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Get candidates from internal database that haven't applied to this job
    const existingApplications = await this.prisma.application.findMany({
      where: { jobId },
      select: { candidateId: true },
    });
    const appliedCandidateIds = existingApplications.map((a) => a.candidateId);

    const candidates = await this.prisma.candidate.findMany({
      where: {
        tenantId,
        id: { notIn: appliedCandidateIds },
      },
      take: 50,
    });

    // Calculate match scores based on skills
    const jobSkills = job.skills.map((s) => s.toLowerCase());

    const scoredCandidates = candidates.map((c) => {
      const candidateSkills = c.skills.map((s) => s.toLowerCase());
      const matchingSkills = candidateSkills.filter((s) =>
        jobSkills.some((js) => s.includes(js) || js.includes(s)),
      );
      const matchScore =
        jobSkills.length > 0
          ? (matchingSkills.length / jobSkills.length) * 100
          : 0;

      return {
        ...c,
        matchScore: Math.round(matchScore),
        matchingSkills: matchingSkills.length,
        totalJobSkills: jobSkills.length,
      };
    });

    // Sort by match score
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    return scoredCandidates.slice(0, 20);
  }
}
