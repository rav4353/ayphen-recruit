import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CandidateScore {
    candidateId: string;
    jobId: string;
    overallScore: number;
    breakdown: {
        skillsMatch: number;
        experienceMatch: number;
        educationMatch: number;
        locationMatch: number;
        availabilityScore: number;
    };
    matchedSkills: string[];
    missingSkills: string[];
    highlights: string[];
    concerns: string[];
    calculatedAt: string;
}

export interface RankingResult {
    candidateId: string;
    candidateName: string;
    email: string;
    currentTitle?: string;
    score: number;
    rank: number;
    matchedSkills: string[];
    highlights: string[];
}

@Injectable()
export class CandidateScoringService {
    private readonly logger = new Logger(CandidateScoringService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Calculate a comprehensive score for a candidate against a job
     */
    async scoreCandidate(candidateId: string, jobId: string): Promise<CandidateScore> {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found');
        }

        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const breakdown = {
            skillsMatch: this.calculateSkillsMatch(candidate.skills || [], job.skills || []),
            experienceMatch: this.calculateExperienceMatch(candidate, job),
            educationMatch: this.calculateEducationMatch(candidate, job),
            locationMatch: this.calculateLocationMatch(candidate, job),
            availabilityScore: 80, // Default - would be enhanced with availability data
        };

        // Weighted overall score
        const weights = {
            skillsMatch: 0.40,
            experienceMatch: 0.25,
            educationMatch: 0.15,
            locationMatch: 0.10,
            availabilityScore: 0.10,
        };

        const overallScore = Math.round(
            breakdown.skillsMatch * weights.skillsMatch +
            breakdown.experienceMatch * weights.experienceMatch +
            breakdown.educationMatch * weights.educationMatch +
            breakdown.locationMatch * weights.locationMatch +
            breakdown.availabilityScore * weights.availabilityScore
        );

        const jobSkills = (job.skills || []).map(s => s.toLowerCase());
        const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
        
        const matchedSkills = candidateSkills.filter(s => 
            jobSkills.some(js => js.includes(s) || s.includes(js))
        );
        const missingSkills = jobSkills.filter(s => 
            !candidateSkills.some(cs => cs.includes(s) || s.includes(cs))
        );

        const { highlights, concerns } = this.generateInsights(candidate, job, breakdown);

        return {
            candidateId,
            jobId,
            overallScore,
            breakdown,
            matchedSkills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            missingSkills: missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            highlights,
            concerns,
            calculatedAt: new Date().toISOString(),
        };
    }

    /**
     * Rank all candidates for a job
     */
    async rankCandidatesForJob(jobId: string, tenantId: string): Promise<RankingResult[]> {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, tenantId },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        // Get all applications for this job
        const applications = await this.prisma.application.findMany({
            where: { jobId },
            include: {
                candidate: true,
            },
        });

        const rankings: RankingResult[] = [];

        for (const application of applications) {
            const score = await this.scoreCandidate(application.candidateId, jobId);
            
            rankings.push({
                candidateId: application.candidateId,
                candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
                email: application.candidate.email,
                currentTitle: application.candidate.currentTitle || undefined,
                score: score.overallScore,
                rank: 0, // Will be set after sorting
                matchedSkills: score.matchedSkills,
                highlights: score.highlights,
            });
        }

        // Sort by score descending and assign ranks
        rankings.sort((a, b) => b.score - a.score);
        rankings.forEach((r, index) => {
            r.rank = index + 1;
        });

        return rankings;
    }

    /**
     * Get top candidates across all jobs for a tenant
     */
    async getTopCandidates(tenantId: string, limit = 10): Promise<{
        candidateId: string;
        candidateName: string;
        email: string;
        averageScore: number;
        appliedJobs: number;
        topSkills: string[];
    }[]> {
        const candidates = await this.prisma.candidate.findMany({
            where: { tenantId },
            include: {
                applications: {
                    include: { job: true },
                },
            },
            take: 100, // Analyze top 100 candidates
        });

        const results = await Promise.all(candidates.map(async (candidate) => {
            let totalScore = 0;
            let scoredJobs = 0;

            for (const application of candidate.applications) {
                try {
                    const score = await this.scoreCandidate(candidate.id, application.jobId);
                    totalScore += score.overallScore;
                    scoredJobs++;
                } catch {
                    // Skip if scoring fails
                }
            }

            return {
                candidateId: candidate.id,
                candidateName: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email,
                averageScore: scoredJobs > 0 ? Math.round(totalScore / scoredJobs) : 0,
                appliedJobs: candidate.applications.length,
                topSkills: (candidate.skills || []).slice(0, 5),
            };
        }));

        return results
            .filter(r => r.averageScore > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, limit);
    }

    /**
     * Batch score multiple candidates for a job
     */
    async batchScoreCandidates(
        candidateIds: string[],
        jobId: string,
    ): Promise<CandidateScore[]> {
        const scores: CandidateScore[] = [];

        for (const candidateId of candidateIds) {
            try {
                const score = await this.scoreCandidate(candidateId, jobId);
                scores.push(score);
            } catch (error) {
                this.logger.warn(`Failed to score candidate ${candidateId}: ${error}`);
            }
        }

        return scores.sort((a, b) => b.overallScore - a.overallScore);
    }

    // ==================== SCORING CALCULATIONS ====================

    private calculateSkillsMatch(candidateSkills: string[], jobSkills: string[]): number {
        if (jobSkills.length === 0) return 80; // No skills required

        const candidateLower = candidateSkills.map(s => s.toLowerCase());
        const jobLower = jobSkills.map(s => s.toLowerCase());

        let matchCount = 0;
        for (const skill of jobLower) {
            if (candidateLower.some(cs => 
                cs.includes(skill) || skill.includes(cs) ||
                this.areSimilarSkills(cs, skill)
            )) {
                matchCount++;
            }
        }

        return Math.round((matchCount / jobSkills.length) * 100);
    }

    private areSimilarSkills(skill1: string, skill2: string): boolean {
        const synonyms: Record<string, string[]> = {
            'javascript': ['js', 'ecmascript', 'es6'],
            'typescript': ['ts'],
            'react': ['reactjs', 'react.js'],
            'node': ['nodejs', 'node.js'],
            'python': ['py'],
            'postgresql': ['postgres', 'psql'],
            'mongodb': ['mongo'],
            'kubernetes': ['k8s'],
            'amazon web services': ['aws'],
            'google cloud': ['gcp', 'google cloud platform'],
            'microsoft azure': ['azure'],
        };

        for (const [key, values] of Object.entries(synonyms)) {
            const allVariants = [key, ...values];
            if (allVariants.includes(skill1) && allVariants.includes(skill2)) {
                return true;
            }
        }

        return false;
    }

    private calculateExperienceMatch(candidate: any, job: any): number {
        // Extract years from candidate experience
        const candidateYears = this.extractYearsOfExperience(candidate);
        
        // Try to extract required years from job
        const requiredYears = this.extractRequiredYears(job);

        if (requiredYears === 0) return 80; // No specific requirement

        if (candidateYears >= requiredYears) {
            // Bonus for exceeding requirements (up to 2x)
            const bonus = Math.min((candidateYears - requiredYears) * 5, 20);
            return Math.min(100, 80 + bonus);
        } else {
            // Penalty for not meeting requirements
            const deficit = requiredYears - candidateYears;
            return Math.max(20, 80 - deficit * 15);
        }
    }

    private extractYearsOfExperience(candidate: any): number {
        // Try to extract from experience array
        if (candidate.experience && Array.isArray(candidate.experience)) {
            let totalYears = 0;
            for (const exp of candidate.experience) {
                if (exp.startDate && exp.endDate) {
                    const start = new Date(exp.startDate);
                    const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
                    totalYears += (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                }
            }
            return Math.round(totalYears);
        }

        // Fallback: estimate from current title
        const title = (candidate.currentTitle || '').toLowerCase();
        if (title.includes('senior') || title.includes('lead')) return 5;
        if (title.includes('principal') || title.includes('staff')) return 8;
        if (title.includes('junior') || title.includes('associate')) return 1;
        
        return 3; // Default assumption
    }

    private extractRequiredYears(job: any): number {
        const text = `${job.description || ''} ${job.requirements || ''}`.toLowerCase();
        
        // Look for patterns like "5+ years", "3-5 years", "minimum 4 years"
        const patterns = [
            /(\d+)\+?\s*years?/i,
            /minimum\s*(\d+)\s*years?/i,
            /at\s*least\s*(\d+)\s*years?/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseInt(match[1], 10);
            }
        }

        return 0; // No specific requirement found
    }

    private calculateEducationMatch(candidate: any, job: any): number {
        // Simple education matching based on degree level
        const candidateEducation = candidate.education || [];
        const jobText = `${job.description || ''} ${job.requirements || ''}`.toLowerCase();

        const hasPhd = candidateEducation.some((e: any) => 
            (e.degree || '').toLowerCase().includes('phd') || 
            (e.degree || '').toLowerCase().includes('doctorate')
        );
        const hasMasters = candidateEducation.some((e: any) => 
            (e.degree || '').toLowerCase().includes('master')
        );
        const hasBachelors = candidateEducation.some((e: any) => 
            (e.degree || '').toLowerCase().includes('bachelor') ||
            (e.degree || '').toLowerCase().includes('b.s') ||
            (e.degree || '').toLowerCase().includes('b.a')
        );

        const requiresPhd = jobText.includes('phd') || jobText.includes('doctorate');
        const requiresMasters = jobText.includes('master');
        const requiresBachelors = jobText.includes('bachelor') || jobText.includes('degree');

        if (requiresPhd && hasPhd) return 100;
        if (requiresPhd && hasMasters) return 70;
        if (requiresMasters && (hasMasters || hasPhd)) return 100;
        if (requiresMasters && hasBachelors) return 80;
        if (requiresBachelors && (hasBachelors || hasMasters || hasPhd)) return 100;
        if (!requiresPhd && !requiresMasters && !requiresBachelors) return 80; // No specific requirement

        return 50; // Doesn't meet requirements
    }

    private calculateLocationMatch(candidate: any, job: any): number {
        const candidateLocation = (candidate.location || '').toLowerCase();
        const jobLocation = (job.location || '').toLowerCase();
        const workLocation = job.workLocation || '';

        // Remote jobs match everyone
        if (workLocation === 'REMOTE') return 100;

        // Hybrid is flexible
        if (workLocation === 'HYBRID') return 90;

        // Check for location match
        if (!jobLocation || !candidateLocation) return 70;

        if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
            return 100;
        }

        // Check if same country/region (simplified)
        const candidateParts = candidateLocation.split(',').map(p => p.trim());
        const jobParts = jobLocation.split(',').map(p => p.trim());

        const commonParts = candidateParts.filter(cp => 
            jobParts.some(jp => jp.includes(cp) || cp.includes(jp))
        );

        if (commonParts.length > 0) return 80;

        return 50; // Different location
    }

    private generateInsights(candidate: any, job: any, breakdown: CandidateScore['breakdown']): {
        highlights: string[];
        concerns: string[];
    } {
        const highlights: string[] = [];
        const concerns: string[] = [];

        // Skills insights
        if (breakdown.skillsMatch >= 80) {
            highlights.push('Strong skills match with job requirements');
        } else if (breakdown.skillsMatch < 50) {
            concerns.push('Missing several required skills');
        }

        // Experience insights
        if (breakdown.experienceMatch >= 90) {
            highlights.push('Exceeds experience requirements');
        } else if (breakdown.experienceMatch < 60) {
            concerns.push('May not meet experience requirements');
        }

        // Education insights
        if (breakdown.educationMatch >= 90) {
            highlights.push('Education aligns well with requirements');
        }

        // Location insights
        if (breakdown.locationMatch >= 90) {
            highlights.push('Location is a good fit');
        } else if (breakdown.locationMatch < 60) {
            concerns.push('Location may require relocation');
        }

        // Add context-specific insights
        if (candidate.currentCompany) {
            highlights.push(`Currently at ${candidate.currentCompany}`);
        }

        if (candidate.currentTitle && job.title) {
            if (candidate.currentTitle.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])) {
                highlights.push('Current role is highly relevant');
            }
        }

        return { highlights, concerns };
    }
}
