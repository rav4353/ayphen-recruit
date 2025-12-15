import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateTalentPoolDto {
  name: string;
  description?: string;
  criteria?: {
    skills?: string[];
    locations?: string[];
    experience?: { min?: number; max?: number };
    sources?: string[];
  };
  isPublic?: boolean;
}

interface UpdateTalentPoolDto {
  name?: string;
  description?: string;
  criteria?: {
    skills?: string[];
    locations?: string[];
    experience?: { min?: number; max?: number };
    sources?: string[];
  };
  isPublic?: boolean;
}

@Injectable()
export class TalentPoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalentPoolDto, tenantId: string, userId: string) {
    return this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_CREATED',
        description: `Talent pool created: ${dto.name}`,
        userId,
        metadata: {
          type: 'talent_pool',
          id: `pool-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          tenantId,
          ...dto,
          candidateIds: [],
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  async findAll(tenantId: string, userId: string) {
    const poolLogs = await this.prisma.activityLog.findMany({
      where: {
        action: { in: ['TALENT_POOL_CREATED', 'TALENT_POOL_UPDATED'] },
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest state of each pool
    const poolMap = new Map<string, any>();
    for (const log of poolLogs) {
      const metadata = log.metadata as any;
      if (metadata.type === 'talent_pool' && !poolMap.has(metadata.id)) {
        poolMap.set(metadata.id, metadata);
      }
    }

    // Filter pools user can access
    const pools = Array.from(poolMap.values()).filter(
      (p) => p.isPublic || p.createdBy === userId
    );

    // Get candidate counts
    const poolsWithCounts = await Promise.all(
      pools.map(async (pool) => {
        const candidateCount = pool.candidateIds?.length || 0;
        return {
          id: pool.id,
          name: pool.name,
          description: pool.description,
          criteria: pool.criteria,
          isPublic: pool.isPublic,
          candidateCount,
          createdAt: pool.createdAt,
          updatedAt: pool.updatedAt,
        };
      })
    );

    return poolsWithCounts;
  }

  async findOne(poolId: string, tenantId: string) {
    const poolLog = await this.prisma.activityLog.findFirst({
      where: {
        action: { in: ['TALENT_POOL_CREATED', 'TALENT_POOL_UPDATED'] },
        metadata: {
          path: ['id'],
          equals: poolId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!poolLog) {
      throw new NotFoundException('Talent pool not found');
    }

    const metadata = poolLog.metadata as any;
    if (metadata.tenantId !== tenantId) {
      throw new NotFoundException('Talent pool not found');
    }

    // Get candidates in the pool
    const candidateIds = metadata.candidateIds || [];
    let candidates: any[] = [];

    if (candidateIds.length > 0) {
      candidates = await this.prisma.candidate.findMany({
        where: { id: { in: candidateIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          currentTitle: true,
          currentCompany: true,
          skills: true,
          location: true,
          source: true,
        },
      });
    }

    return {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      criteria: metadata.criteria,
      isPublic: metadata.isPublic,
      candidates,
      candidateCount: candidates.length,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
  }

  async update(poolId: string, dto: UpdateTalentPoolDto, tenantId: string, userId: string) {
    const existing = await this.findOne(poolId, tenantId);

    const updatedMetadata = {
      type: 'talent_pool',
      id: poolId,
      tenantId,
      name: dto.name || existing.name,
      description: dto.description !== undefined ? dto.description : existing.description,
      criteria: dto.criteria || existing.criteria,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : existing.isPublic,
      candidateIds: existing.candidates.map((c: any) => c.id),
      createdBy: (existing as any).createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_UPDATED',
        description: `Talent pool updated: ${updatedMetadata.name}`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return { id: poolId, ...updatedMetadata };
  }

  async addCandidates(poolId: string, candidateIds: string[], tenantId: string, userId: string) {
    const existing = await this.findOne(poolId, tenantId);
    const existingIds = existing.candidates.map((c: any) => c.id);
    
    // Verify candidates exist and belong to tenant
    const candidates = await this.prisma.candidate.findMany({
      where: {
        id: { in: candidateIds },
        tenantId,
      },
    });

    const validIds = candidates.map((c) => c.id);
    const newIds = [...new Set([...existingIds, ...validIds])];

    const updatedMetadata = {
      type: 'talent_pool',
      id: poolId,
      tenantId,
      name: existing.name,
      description: existing.description,
      criteria: existing.criteria,
      isPublic: existing.isPublic,
      candidateIds: newIds,
      createdBy: (existing as any).createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_UPDATED',
        description: `Added ${validIds.length} candidates to pool: ${existing.name}`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return {
      id: poolId,
      addedCount: validIds.length,
      totalCount: newIds.length,
    };
  }

  async removeCandidates(poolId: string, candidateIds: string[], tenantId: string, userId: string) {
    const existing = await this.findOne(poolId, tenantId);
    const existingIds = existing.candidates.map((c: any) => c.id);
    const newIds = existingIds.filter((id: string) => !candidateIds.includes(id));

    const updatedMetadata = {
      type: 'talent_pool',
      id: poolId,
      tenantId,
      name: existing.name,
      description: existing.description,
      criteria: existing.criteria,
      isPublic: existing.isPublic,
      candidateIds: newIds,
      createdBy: (existing as any).createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_UPDATED',
        description: `Removed ${existingIds.length - newIds.length} candidates from pool: ${existing.name}`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return {
      id: poolId,
      removedCount: existingIds.length - newIds.length,
      totalCount: newIds.length,
    };
  }

  async delete(poolId: string, tenantId: string, userId: string) {
    const existing = await this.findOne(poolId, tenantId);

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_DELETED',
        description: `Talent pool deleted: ${existing.name}`,
        userId,
        metadata: {
          type: 'talent_pool_deleted',
          id: poolId,
          tenantId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  }

  async searchCandidatesForPool(poolId: string, tenantId: string, query?: string) {
    const pool = await this.findOne(poolId, tenantId);
    const criteria = pool.criteria || {};

    const where: any = {
      tenantId,
      id: { notIn: pool.candidates.map((c: any) => c.id) },
    };

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (criteria.skills?.length > 0) {
      where.skills = { hasSome: criteria.skills };
    }

    if (criteria.locations?.length > 0) {
      where.location = { in: criteria.locations };
    }

    if (criteria.sources?.length > 0) {
      where.source = { in: criteria.sources };
    }

    const candidates = await this.prisma.candidate.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        currentTitle: true,
        currentCompany: true,
        skills: true,
        location: true,
        source: true,
      },
      take: 50,
    });

    return candidates;
  }

  async getPoolStats(tenantId: string) {
    const pools = await this.findAll(tenantId, '');

    const totalCandidates = pools.reduce((sum, p) => sum + p.candidateCount, 0);

    return {
      totalPools: pools.length,
      totalCandidates,
      publicPools: pools.filter((p) => p.isPublic).length,
      privatePools: pools.filter((p) => !p.isPublic).length,
    };
  }
}
