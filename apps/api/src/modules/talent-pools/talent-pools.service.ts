import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateTalentPoolDto {
  name: string;
  description?: string;
  criteria?: {
    skills?: string[];
    locations?: string[];
    experience?: { min?: number; max?: number };
    sources?: string[];
    titles?: string[];
    companies?: string[];
  };
  isPublic?: boolean;
  isDynamic?: boolean; // If true, auto-updates based on criteria
  autoRefreshHours?: number; // How often to refresh (default 24)
}

interface UpdateTalentPoolDto {
  name?: string;
  description?: string;
  criteria?: {
    skills?: string[];
    locations?: string[];
    experience?: { min?: number; max?: number };
    sources?: string[];
    titles?: string[];
    companies?: string[];
  };
  isPublic?: boolean;
  isDynamic?: boolean;
  autoRefreshHours?: number;
}

@Injectable()
export class TalentPoolsService {
  private readonly logger = new Logger(TalentPoolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTalentPoolDto, tenantId: string, userId: string) {
    const poolId = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const poolData = {
      type: 'talent_pool',
      id: poolId,
      tenantId,
      name: dto.name,
      description: dto.description,
      criteria: dto.criteria,
      isPublic: dto.isPublic || false,
      isDynamic: dto.isDynamic || false,
      autoRefreshHours: dto.autoRefreshHours || 24,
      candidateIds: [] as string[],
      lastRefreshedAt: null as string | null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If dynamic, populate with matching candidates immediately
    if (dto.isDynamic && dto.criteria) {
      const matchingCandidates = await this.findCandidatesMatchingCriteria(tenantId, dto.criteria);
      poolData.candidateIds = matchingCandidates.map(c => c.id);
      poolData.lastRefreshedAt = new Date().toISOString();
    }

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_CREATED',
        description: `Talent pool created: ${dto.name}${dto.isDynamic ? ' (dynamic)' : ''}`,
        userId,
        metadata: poolData,
      },
    });

    return { id: poolId, ...poolData };
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

  // ==================== DYNAMIC POOL FUNCTIONALITY ====================

  /**
   * Find candidates matching given criteria
   */
  async findCandidatesMatchingCriteria(
    tenantId: string,
    criteria: CreateTalentPoolDto['criteria'],
  ): Promise<{ id: string }[]> {
    if (!criteria) return [];

    const where: any = { tenantId };

    // Skills filter
    if (criteria.skills?.length > 0) {
      where.skills = { hasSome: criteria.skills };
    }

    // Location filter
    if (criteria.locations?.length > 0) {
      where.location = { in: criteria.locations, mode: 'insensitive' };
    }

    // Source filter
    if (criteria.sources?.length > 0) {
      where.source = { in: criteria.sources };
    }

    // Title filter
    if (criteria.titles?.length > 0) {
      where.OR = criteria.titles.map(title => ({
        currentTitle: { contains: title, mode: 'insensitive' },
      }));
    }

    // Company filter
    if (criteria.companies?.length > 0) {
      where.currentCompany = { in: criteria.companies, mode: 'insensitive' };
    }

    const candidates = await this.prisma.candidate.findMany({
      where,
      select: { id: true },
      take: 1000, // Limit to prevent huge pools
    });

    return candidates;
  }

  /**
   * Refresh a dynamic pool with candidates matching its criteria
   */
  async refreshDynamicPool(poolId: string, tenantId: string): Promise<{
    poolId: string;
    previousCount: number;
    newCount: number;
    added: number;
    removed: number;
  }> {
    const pool = await this.findOne(poolId, tenantId);
    
    if (!(pool as any).isDynamic) {
      throw new BadRequestException('Pool is not a dynamic pool');
    }

    const previousIds = pool.candidates.map((c: any) => c.id);
    const matchingCandidates = await this.findCandidatesMatchingCriteria(tenantId, pool.criteria);
    const newIds = matchingCandidates.map(c => c.id);

    const added = newIds.filter(id => !previousIds.includes(id)).length;
    const removed = previousIds.filter((id: string) => !newIds.includes(id)).length;

    const updatedMetadata = {
      type: 'talent_pool',
      id: poolId,
      tenantId,
      name: pool.name,
      description: pool.description,
      criteria: pool.criteria,
      isPublic: pool.isPublic,
      isDynamic: true,
      autoRefreshHours: (pool as any).autoRefreshHours || 24,
      candidateIds: newIds,
      lastRefreshedAt: new Date().toISOString(),
      createdBy: (pool as any).createdBy,
      createdAt: pool.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.activityLog.create({
      data: {
        action: 'TALENT_POOL_UPDATED',
        description: `Dynamic pool refreshed: ${pool.name} (added ${added}, removed ${removed})`,
        metadata: updatedMetadata,
      },
    });

    return {
      poolId,
      previousCount: previousIds.length,
      newCount: newIds.length,
      added,
      removed,
    };
  }

  /**
   * Cron job to auto-refresh dynamic pools
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoRefreshDynamicPools(): Promise<void> {
    this.logger.log('Checking dynamic pools for auto-refresh...');

    try {
      // Get all dynamic pools that need refreshing
      const poolLogs = await this.prisma.activityLog.findMany({
        where: {
          action: { in: ['TALENT_POOL_CREATED', 'TALENT_POOL_UPDATED'] },
          metadata: {
            path: ['isDynamic'],
            equals: true,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get latest state of each dynamic pool
      const poolMap = new Map<string, any>();
      for (const log of poolLogs) {
        const metadata = log.metadata as any;
        if (metadata.type === 'talent_pool' && !poolMap.has(metadata.id)) {
          poolMap.set(metadata.id, metadata);
        }
      }

      const now = Date.now();

      for (const [poolId, pool] of poolMap.entries()) {
        const lastRefresh = pool.lastRefreshedAt ? new Date(pool.lastRefreshedAt).getTime() : 0;
        const refreshInterval = (pool.autoRefreshHours || 24) * 60 * 60 * 1000;

        if (now - lastRefresh >= refreshInterval) {
          try {
            const result = await this.refreshDynamicPool(poolId, pool.tenantId);
            this.logger.log(`Refreshed pool ${pool.name}: +${result.added}, -${result.removed}`);
          } catch (error) {
            this.logger.error(`Failed to refresh pool ${poolId}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in auto-refresh job:', error);
    }
  }

  /**
   * Manually trigger refresh for a dynamic pool
   */
  async triggerRefresh(poolId: string, tenantId: string, userId: string) {
    return this.refreshDynamicPool(poolId, tenantId);
  }
}
