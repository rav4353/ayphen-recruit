import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

export interface SemanticSearchResult {
    candidateId: string;
    firstName: string;
    lastName: string;
    email: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    skills: string[];
    matchScore: number;
    matchReason: string;
    highlights: string[];
}

export interface SemanticSearchOptions {
    query: string;
    tenantId: string;
    limit?: number;
    minScore?: number;
    filters?: {
        skills?: string[];
        location?: string;
        experience?: { min?: number; max?: number };
        excludeCandidateIds?: string[];
    };
}

interface EmbeddingResponse {
    embedding: number[];
}

interface CandidateWithEmbedding {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    currentTitle: string | null;
    currentCompany: string | null;
    location: string | null;
    skills: string[];
    summary: string | null;
    resumeText: string | null;
}

@Injectable()
export class SemanticSearchService {
    private readonly logger = new Logger(SemanticSearchService.name);
    private readonly aiServiceUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://127.0.0.1:8000');
    }

    /**
     * Semantic search for candidates using natural language query
     * Example queries:
     * - "React developers with 5+ years experience"
     * - "Marketing managers who worked at Fortune 500 companies"
     * - "Data scientists with Python and machine learning skills"
     */
    async searchCandidates(options: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
        const { query, tenantId, limit = 20, minScore = 0.5, filters } = options;

        try {
            // Step 1: Get query embedding from AI service
            const queryEmbedding = await this.getEmbedding(query);
            const queryEmbeddingArray = `[${queryEmbedding.join(',')}]`;

            // Step 2: Use pgvector similarity search in the database
            // Cosine distance is 1 - cosine similarity. So distance <= (1 - minScore)
            // We use raw query because pgvector operators are not supported in Prisma findMany
            const results: any[] = await this.prisma.$queryRaw`
                SELECT 
                    id as "candidateId",
                    "firstName",
                    "lastName",
                    email,
                    "currentTitle",
                    "currentCompany",
                    location,
                    skills,
                    1 - (embedding <=> ${queryEmbeddingArray}::vector) as "matchScore"
                FROM candidates
                WHERE "tenantId" = ${tenantId}
                AND embedding IS NOT NULL
                AND (1 - (embedding <=> ${queryEmbeddingArray}::vector)) >= ${minScore}
                ORDER BY embedding <=> ${queryEmbeddingArray}::vector ASC
                LIMIT ${limit}
            `;

            if (results.length === 0) {
                // If no embeddings found in DB yet, fallback to original hybrid approach but limited
                return this.fallbackKeywordSearch(options);
            }

            return results.map(r => ({
                ...r,
                matchReason: this.generateMatchReason(query, r),
                highlights: this.extractHighlights(query, r),
            }));
        } catch (error) {
            this.logger.error('Semantic search failed:', error);
            return this.fallbackKeywordSearch(options);
        }
    }

    /**
     * Update a candidate's embedding in the database
     */
    async updateCandidateEmbedding(candidateId: string, tenantId: string): Promise<void> {
        try {
            const candidate = await this.prisma.candidate.findUnique({
                where: { id: candidateId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    currentTitle: true,
                    currentCompany: true,
                    location: true,
                    skills: true,
                    summary: true,
                    resumeText: true,
                }
            });

            if (!candidate) return;

            const text = this.buildCandidateText(candidate as CandidateWithEmbedding);
            const embedding = await this.getEmbedding(text);
            const embeddingArray = `[${embedding.join(',')}]`;

            await this.prisma.$executeRaw`
                UPDATE candidates 
                SET embedding = ${embeddingArray}::vector 
                WHERE id = ${candidateId}
            `;

            this.logger.log(`Updated embedding for candidate ${candidateId}`);
        } catch (error) {
            this.logger.error(`Failed to update candidate embedding for ${candidateId}:`, error);
        }
    }

    /**
     * Find similar candidates to a given candidate
     */
    async findSimilarCandidates(
        candidateId: string,
        tenantId: string,
        limit = 10,
    ): Promise<SemanticSearchResult[]> {
        const candidate = await this.prisma.candidate.findFirst({
            where: { id: candidateId, tenantId },
        });

        if (!candidate) {
            return [];
        }

        const candidateText = this.buildCandidateText(candidate as CandidateWithEmbedding);

        return this.searchCandidates({
            query: candidateText,
            tenantId,
            limit,
            minScore: 0.6,
            filters: {
                excludeCandidateIds: [candidateId],
            },
        });
    }

    /**
     * Match candidates to a job description
     */
    async matchCandidatesToJob(
        jobId: string,
        tenantId: string,
        limit = 50,
    ): Promise<SemanticSearchResult[]> {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, tenantId },
            select: {
                title: true,
                description: true,
                requirements: true,
                skills: true,
                locations: { select: { city: true } },
            },
        });

        if (!job) {
            return [];
        }

        // Build search query from job
        const jobQuery = [
            job.title,
            job.description,
            job.requirements,
            job.skills?.join(', '),
        ].filter(Boolean).join(' ');

        return this.searchCandidates({
            query: jobQuery,
            tenantId,
            limit,
            minScore: 0.4,
            filters: (job as any).locations?.[0]?.city ? { location: (job as any).locations[0].city } : undefined,
        });
    }

    /**
     * AI-powered talent recommendations
     */
    async getTalentRecommendations(
        tenantId: string,
        options: {
            role?: string;
            skills?: string[];
            seniority?: 'junior' | 'mid' | 'senior' | 'lead';
            industry?: string;
        },
    ): Promise<SemanticSearchResult[]> {
        const queryParts: string[] = [];

        if (options.role) {
            queryParts.push(options.role);
        }
        if (options.skills?.length) {
            queryParts.push(`with skills in ${options.skills.join(', ')}`);
        }
        if (options.seniority) {
            queryParts.push(`${options.seniority} level`);
        }
        if (options.industry) {
            queryParts.push(`from ${options.industry} industry`);
        }

        const query = queryParts.join(' ') || 'qualified professional candidates';

        return this.searchCandidates({
            query,
            tenantId,
            limit: 25,
            minScore: 0.5,
        });
    }

    /**
     * Get embedding from AI service
     */
    private async getEmbedding(text: string): Promise<number[]> {
        try {
            const response = await axios.post<EmbeddingResponse>(
                `${this.aiServiceUrl}/embeddings`,
                { text: text.substring(0, 8000) }, // Limit text length
                { timeout: 10000 }
            );
            return response.data.embedding;
        } catch (error) {
            this.logger.error('Failed to get embedding:', error);
            throw error;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Fallback keyword similarity using Jaccard index
     */
    private keywordSimilarity(query: string, text: string): number {
        const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2));

        const intersection = new Set([...queryWords].filter(x => textWords.has(x)));
        const union = new Set([...queryWords, ...textWords]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Build searchable text from candidate data
     */
    private buildCandidateText(candidate: CandidateWithEmbedding): string {
        const parts: string[] = [];

        if (candidate.currentTitle) {
            parts.push(`Current role: ${candidate.currentTitle}`);
        }
        if (candidate.currentCompany) {
            parts.push(`at ${candidate.currentCompany}`);
        }
        if (candidate.location) {
            parts.push(`Location: ${candidate.location}`);
        }
        if (candidate.skills?.length) {
            parts.push(`Skills: ${candidate.skills.join(', ')}`);
        }
        if (candidate.summary) {
            parts.push(candidate.summary);
        }
        if (candidate.resumeText) {
            parts.push(candidate.resumeText.substring(0, 2000));
        }

        return parts.join(' ');
    }

    /**
     * Get candidates for search with optional filters
     */
    private async getCandidatesForSearch(
        tenantId: string,
        filters?: SemanticSearchOptions['filters'],
    ): Promise<CandidateWithEmbedding[]> {
        const where: Record<string, unknown> = { tenantId };

        if (filters?.excludeCandidateIds?.length) {
            where.id = { notIn: filters.excludeCandidateIds };
        }

        if (filters?.skills?.length) {
            where.skills = { hasSome: filters.skills };
        }

        if (filters?.location) {
            where.location = { contains: filters.location, mode: 'insensitive' };
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
                location: true,
                skills: true,
                summary: true,
                resumeText: true,
            },
            take: 500, // Limit for performance
            orderBy: { updatedAt: 'desc' },
        });

        return candidates;
    }

    /**
     * Generate human-readable match reason
     */
    private generateMatchReason(query: string, candidate: CandidateWithEmbedding): string {
        const reasons: string[] = [];
        const queryLower = query.toLowerCase();

        // Check skills match
        const matchedSkills = candidate.skills.filter(skill =>
            queryLower.includes(skill.toLowerCase())
        );
        if (matchedSkills.length > 0) {
            reasons.push(`Has ${matchedSkills.length} matching skill${matchedSkills.length > 1 ? 's' : ''}: ${matchedSkills.slice(0, 3).join(', ')}`);
        }

        // Check title match
        if (candidate.currentTitle && queryLower.includes(candidate.currentTitle.toLowerCase().split(' ')[0])) {
            reasons.push(`Current title matches: ${candidate.currentTitle}`);
        }

        // Check location match
        if (candidate.location && queryLower.includes(candidate.location.toLowerCase())) {
            reasons.push(`Location matches: ${candidate.location}`);
        }

        return reasons.length > 0 ? reasons.join('. ') : 'Profile matches search criteria';
    }

    /**
     * Extract highlighted snippets from candidate profile
     */
    private extractHighlights(query: string, candidate: CandidateWithEmbedding): string[] {
        const highlights: string[] = [];
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        // Add matching skills
        const matchedSkills = candidate.skills.filter(skill =>
            queryWords.some(word => skill.toLowerCase().includes(word))
        );
        if (matchedSkills.length > 0) {
            highlights.push(`Skills: ${matchedSkills.join(', ')}`);
        }

        // Add current position if relevant
        if (candidate.currentTitle) {
            highlights.push(`${candidate.currentTitle}${candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}`);
        }

        // Extract relevant summary snippets
        if (candidate.summary) {
            const sentences = candidate.summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
            const relevantSentences = sentences.filter(sentence =>
                queryWords.some(word => sentence.toLowerCase().includes(word))
            );
            if (relevantSentences.length > 0) {
                highlights.push(relevantSentences[0].trim().substring(0, 150) + '...');
            }
        }

        return highlights.slice(0, 5);
    }

    /**
     * Fallback keyword search when AI service is unavailable
     */
    private async fallbackKeywordSearch(options: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
        const { query, tenantId, limit = 20, filters } = options;

        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        const where: Record<string, unknown> = {
            tenantId,
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { currentTitle: { contains: query, mode: 'insensitive' } },
                { currentCompany: { contains: query, mode: 'insensitive' } },
                { skills: { hasSome: queryWords } },
                { summary: { contains: query, mode: 'insensitive' } },
            ],
        };

        if (filters?.excludeCandidateIds?.length) {
            where.id = { notIn: filters.excludeCandidateIds };
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
                location: true,
                skills: true,
                summary: true,
                resumeText: true,
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        });

        return candidates.map(candidate => ({
            candidateId: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            currentTitle: candidate.currentTitle || undefined,
            currentCompany: candidate.currentCompany || undefined,
            location: candidate.location || undefined,
            skills: candidate.skills,
            matchScore: this.keywordSimilarity(query, this.buildCandidateText(candidate)),
            matchReason: 'Matched by keyword search',
            highlights: this.extractHighlights(query, candidate),
        }));
    }
}
