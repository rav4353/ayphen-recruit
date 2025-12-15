import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface AdvancedSearchQuery {
  // Boolean search
  query?: string; // Supports AND, OR, NOT operators
  
  // Field-specific filters
  skills?: string[];
  skillsMatch?: 'ALL' | 'ANY'; // Match all skills or any skill
  locations?: string[];
  experience?: { min?: number; max?: number };
  education?: string[];
  companies?: string[];
  titles?: string[];
  sources?: string[];
  tags?: string[];
  
  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  lastActivityAfter?: string;
  
  // Status filters
  hasApplications?: boolean;
  applicationStatus?: string[];
  excludeJobIds?: string[];
  
  // Sorting and pagination
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'name' | 'matchScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  candidates: any[];
  total: number;
  page: number;
  limit: number;
  facets: {
    skills: { value: string; count: number }[];
    locations: { value: string; count: number }[];
    sources: { value: string; count: number }[];
    tags: { value: string; count: number }[];
  };
}

@Injectable()
export class CandidateSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Advanced candidate search with boolean query support
   */
  async search(tenantId: string, query: AdvancedSearchQuery): Promise<SearchResult> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CandidateWhereInput = {
      tenantId,
      ...this.buildBooleanQuery(query.query),
      ...this.buildFieldFilters(query),
    };

    // Get total count
    const total = await this.prisma.candidate.count({ where });

    // Build orderBy
    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    // Execute search
    const candidates = await this.prisma.candidate.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        candidateId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentTitle: true,
        currentCompany: true,
        location: true,
        skills: true,
        tags: true,
        source: true,
        summary: true,
        linkedinUrl: true,
        resumeUrl: true,
        createdAt: true,
        updatedAt: true,
        applications: {
          select: {
            id: true,
            status: true,
            matchScore: true,
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Generate facets for filtering UI
    const facets = await this.generateFacets(tenantId, where);

    return {
      candidates,
      total,
      page,
      limit,
      facets,
    };
  }

  /**
   * Parse boolean query string (supports AND, OR, NOT, quotes for exact phrases)
   */
  private buildBooleanQuery(queryString?: string): Prisma.CandidateWhereInput {
    if (!queryString?.trim()) {
      return {};
    }

    const query = queryString.trim();

    // Handle quoted phrases
    const phrases: string[] = [];
    let processedQuery = query.replace(/"([^"]+)"/g, (_, phrase) => {
      phrases.push(phrase);
      return `__PHRASE_${phrases.length - 1}__`;
    });

    // Split by OR (case insensitive)
    const orParts = processedQuery.split(/\s+OR\s+/i);

    if (orParts.length > 1) {
      return {
        OR: orParts.map(part => this.parseAndNotTerms(part, phrases)),
      };
    }

    return this.parseAndNotTerms(processedQuery, phrases);
  }

  /**
   * Parse AND and NOT terms
   */
  private parseAndNotTerms(query: string, phrases: string[]): Prisma.CandidateWhereInput {
    const notTerms: string[] = [];
    const andTerms: string[] = [];

    // Extract NOT terms
    let processedQuery = query.replace(/NOT\s+(\S+)/gi, (_, term) => {
      notTerms.push(this.resolveTerm(term, phrases));
      return '';
    });

    // Extract AND terms (or implicit AND)
    const parts = processedQuery.split(/\s+AND\s+|\s+/i).filter(p => p.trim());
    for (const part of parts) {
      const term = this.resolveTerm(part, phrases);
      if (term) andTerms.push(term);
    }

    const conditions: Prisma.CandidateWhereInput[] = [];

    // Build AND conditions
    for (const term of andTerms) {
      conditions.push(this.buildTermSearch(term));
    }

    // Build NOT conditions
    for (const term of notTerms) {
      conditions.push({
        NOT: this.buildTermSearch(term),
      });
    }

    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }

  /**
   * Resolve placeholder terms back to phrases
   */
  private resolveTerm(term: string, phrases: string[]): string {
    const match = term.match(/__PHRASE_(\d+)__/);
    if (match) {
      return phrases[parseInt(match[1])];
    }
    return term.trim();
  }

  /**
   * Build search condition for a single term across multiple fields
   */
  private buildTermSearch(term: string): Prisma.CandidateWhereInput {
    const searchTerm = term.toLowerCase();
    return {
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { currentTitle: { contains: searchTerm, mode: 'insensitive' } },
        { currentCompany: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { skills: { has: searchTerm } },
        { tags: { has: searchTerm } },
      ],
    };
  }

  /**
   * Build field-specific filters
   */
  private buildFieldFilters(query: AdvancedSearchQuery): Prisma.CandidateWhereInput {
    const filters: Prisma.CandidateWhereInput = {};

    // Skills filter
    if (query.skills?.length) {
      if (query.skillsMatch === 'ALL') {
        filters.skills = { hasEvery: query.skills };
      } else {
        filters.skills = { hasSome: query.skills };
      }
    }

    // Location filter
    if (query.locations?.length) {
      filters.OR = query.locations.map(loc => ({
        location: { contains: loc, mode: 'insensitive' as const },
      }));
    }

    // Companies filter
    if (query.companies?.length) {
      filters.currentCompany = {
        in: query.companies,
        mode: 'insensitive',
      };
    }

    // Titles filter
    if (query.titles?.length) {
      filters.OR = [
        ...(filters.OR || []),
        ...query.titles.map(title => ({
          currentTitle: { contains: title, mode: 'insensitive' as const },
        })),
      ];
    }

    // Sources filter
    if (query.sources?.length) {
      filters.source = { in: query.sources };
    }

    // Tags filter
    if (query.tags?.length) {
      filters.tags = { hasSome: query.tags };
    }

    // Date filters
    if (query.createdAfter) {
      filters.createdAt = { ...filters.createdAt as any, gte: new Date(query.createdAfter) };
    }
    if (query.createdBefore) {
      filters.createdAt = { ...filters.createdAt as any, lte: new Date(query.createdBefore) };
    }

    // Application status filter
    if (query.hasApplications !== undefined) {
      if (query.hasApplications) {
        filters.applications = { some: {} };
      } else {
        filters.applications = { none: {} };
      }
    }

    if (query.applicationStatus?.length) {
      filters.applications = {
        some: {
          status: { in: query.applicationStatus as any },
        },
      };
    }

    // Exclude candidates already applied to specific jobs
    if (query.excludeJobIds?.length) {
      filters.applications = {
        ...filters.applications as any,
        none: {
          jobId: { in: query.excludeJobIds },
        },
      };
    }

    return filters;
  }

  /**
   * Build orderBy clause
   */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.CandidateOrderByWithRelationInput[] {
    const order = sortOrder || 'desc';

    switch (sortBy) {
      case 'name':
        return [{ firstName: order }, { lastName: order }];
      case 'createdAt':
        return [{ createdAt: order }];
      case 'updatedAt':
        return [{ updatedAt: order }];
      case 'relevance':
      default:
        return [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
    }
  }

  /**
   * Generate facets for search results
   */
  private async generateFacets(
    tenantId: string,
    baseWhere: Prisma.CandidateWhereInput,
  ) {
    // Get all candidates matching base criteria for facet generation
    const candidates = await this.prisma.candidate.findMany({
      where: baseWhere,
      select: {
        skills: true,
        location: true,
        source: true,
        tags: true,
      },
      take: 1000, // Limit for performance
    });

    const skillCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    for (const candidate of candidates) {
      // Skills
      for (const skill of candidate.skills || []) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }

      // Location
      if (candidate.location) {
        locationCounts.set(candidate.location, (locationCounts.get(candidate.location) || 0) + 1);
      }

      // Source
      if (candidate.source) {
        sourceCounts.set(candidate.source, (sourceCounts.get(candidate.source) || 0) + 1);
      }

      // Tags
      for (const tag of candidate.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const sortByCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

    return {
      skills: Array.from(skillCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 20),
      locations: Array.from(locationCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 20),
      sources: Array.from(sourceCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 10),
      tags: Array.from(tagCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 20),
    };
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(tenantId: string, query: string, field?: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const suggestions: Set<string> = new Set();

    if (!field || field === 'skills') {
      const skillCandidates = await this.prisma.candidate.findMany({
        where: { tenantId },
        select: { skills: true },
        take: 100,
      });

      for (const c of skillCandidates) {
        for (const skill of c.skills || []) {
          if (skill.toLowerCase().includes(searchTerm)) {
            suggestions.add(skill);
          }
        }
      }
    }

    if (!field || field === 'location') {
      const locations = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          location: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { location: true },
        distinct: ['location'],
        take: 10,
      });

      for (const l of locations) {
        if (l.location) suggestions.add(l.location);
      }
    }

    if (!field || field === 'company') {
      const companies = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          currentCompany: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { currentCompany: true },
        distinct: ['currentCompany'],
        take: 10,
      });

      for (const c of companies) {
        if (c.currentCompany) suggestions.add(c.currentCompany);
      }
    }

    if (!field || field === 'title') {
      const titles = await this.prisma.candidate.findMany({
        where: {
          tenantId,
          currentTitle: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { currentTitle: true },
        distinct: ['currentTitle'],
        take: 10,
      });

      for (const t of titles) {
        if (t.currentTitle) suggestions.add(t.currentTitle);
      }
    }

    return Array.from(suggestions).slice(0, 20);
  }

  /**
   * Save a search query for later use
   */
  async saveSearch(
    tenantId: string,
    userId: string,
    name: string,
    query: AdvancedSearchQuery,
  ) {
    await this.prisma.activityLog.create({
      data: {
        action: 'SAVED_SEARCH_CREATED',
        description: `Saved search: ${name}`,
        userId,
        metadata: {
          searchId: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          name,
          query: JSON.parse(JSON.stringify(query)),
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(tenantId: string, userId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'SAVED_SEARCH_CREATED',
        userId,
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map(log => {
      const meta = log.metadata as any;
      return {
        id: meta.searchId,
        name: meta.name,
        query: meta.query,
        createdAt: meta.createdAt,
      };
    });
  }
}
