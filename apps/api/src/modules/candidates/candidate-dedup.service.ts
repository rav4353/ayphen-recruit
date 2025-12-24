import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface DuplicateCandidate {
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  matchScore: number;
  matchReasons: string[];
  createdAt: string;
  applicationCount: number;
}

export interface DuplicateGroup {
  primaryCandidate: DuplicateCandidate;
  duplicates: DuplicateCandidate[];
  totalMatchScore: number;
}

export interface MergeResult {
  primaryCandidateId: string;
  mergedCandidateIds: string[];
  applicationsTransferred: number;
  notesTransferred: number;
  tagsmerged: number;
}

@Injectable()
export class CandidateDedupService {
  private readonly logger = new Logger(CandidateDedupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find potential duplicate candidates for a tenant
   */
  async findDuplicates(
    tenantId: string,
    options?: {
      minScore?: number;
      limit?: number;
    },
  ): Promise<DuplicateGroup[]> {
    const minScore = options?.minScore || 70;
    const limit = options?.limit || 100;

    const candidates = await this.prisma.candidate.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Analyze recent candidates
    });

    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (processedIds.has(candidate.id)) continue;

      const duplicates: DuplicateCandidate[] = [];

      for (let j = i + 1; j < candidates.length; j++) {
        const other = candidates[j];
        if (processedIds.has(other.id)) continue;

        const { score, reasons } = this.calculateMatchScore(candidate, other);

        if (score >= minScore) {
          duplicates.push({
            candidateId: other.id,
            name: `${other.firstName} ${other.lastName}`,
            email: other.email,
            phone: other.phone || undefined,
            matchScore: score,
            matchReasons: reasons,
            createdAt: other.createdAt.toISOString(),
            applicationCount: other._count.applications,
          });
          processedIds.add(other.id);
        }
      }

      if (duplicates.length > 0) {
        processedIds.add(candidate.id);
        duplicateGroups.push({
          primaryCandidate: {
            candidateId: candidate.id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            phone: candidate.phone || undefined,
            matchScore: 100,
            matchReasons: ["Primary candidate"],
            createdAt: candidate.createdAt.toISOString(),
            applicationCount: candidate._count.applications,
          },
          duplicates: duplicates.sort((a, b) => b.matchScore - a.matchScore),
          totalMatchScore:
            duplicates.reduce((sum, d) => sum + d.matchScore, 0) /
            duplicates.length,
        });
      }

      if (duplicateGroups.length >= limit) break;
    }

    return duplicateGroups.sort(
      (a, b) => b.totalMatchScore - a.totalMatchScore,
    );
  }

  /**
   * Find duplicates for a specific candidate
   */
  async findDuplicatesForCandidate(
    candidateId: string,
    tenantId: string,
  ): Promise<DuplicateCandidate[]> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) {
      throw new BadRequestException("Candidate not found");
    }

    const otherCandidates = await this.prisma.candidate.findMany({
      where: { tenantId, id: { not: candidateId } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    });

    const duplicates: DuplicateCandidate[] = [];

    for (const other of otherCandidates) {
      const { score, reasons } = this.calculateMatchScore(candidate, other);

      if (score >= 50) {
        duplicates.push({
          candidateId: other.id,
          name: `${other.firstName} ${other.lastName}`,
          email: other.email,
          phone: other.phone || undefined,
          matchScore: score,
          matchReasons: reasons,
          createdAt: other.createdAt.toISOString(),
          applicationCount: other._count.applications,
        });
      }
    }

    return duplicates.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Check if a new candidate would be a duplicate before creation
   */
  async checkForDuplicates(
    tenantId: string,
    candidateData: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<DuplicateCandidate[]> {
    const potentialDuplicates = await this.prisma.candidate.findMany({
      where: {
        tenantId,
        OR: [
          { email: candidateData.email },
          candidateData.phone ? { phone: candidateData.phone } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    });

    return potentialDuplicates
      .map((c) => {
        const { score, reasons } = this.calculateMatchScore(
          candidateData as any,
          c,
        );
        return {
          candidateId: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone || undefined,
          matchScore: score,
          matchReasons: reasons,
          createdAt: c.createdAt.toISOString(),
          applicationCount: c._count.applications,
        };
      })
      .filter((d) => d.matchScore >= 50);
  }

  /**
   * Merge duplicate candidates into one
   */
  async mergeCandidates(
    tenantId: string,
    primaryCandidateId: string,
    duplicateCandidateIds: string[],
  ): Promise<MergeResult> {
    // Verify all candidates belong to tenant
    const candidates = await this.prisma.candidate.findMany({
      where: {
        id: { in: [primaryCandidateId, ...duplicateCandidateIds] },
        tenantId,
      },
      include: {
        applications: true,
      },
    });

    if (candidates.length !== duplicateCandidateIds.length + 1) {
      throw new BadRequestException("One or more candidates not found");
    }

    const primary = candidates.find((c) => c.id === primaryCandidateId);
    if (!primary) {
      throw new BadRequestException("Primary candidate not found");
    }

    let applicationsTransferred = 0;
    let notesTransferred = 0;
    let tagsmerged = 0;

    // Collect all tags from duplicates
    const allTags = new Set<string>(primary.tags || []);

    for (const duplicateId of duplicateCandidateIds) {
      const duplicate = candidates.find((c) => c.id === duplicateId);
      if (!duplicate) continue;

      // Add tags from duplicate
      (duplicate.tags || []).forEach((tag) => allTags.add(tag));
      tagsmerged += (duplicate.tags || []).length;

      // Transfer applications
      const transferred = await this.prisma.application.updateMany({
        where: { candidateId: duplicateId },
        data: { candidateId: primaryCandidateId },
      });
      applicationsTransferred += transferred.count;

      // Transfer activity logs
      const logsTransferred = await this.prisma.activityLog.updateMany({
        where: { candidateId: duplicateId },
        data: { candidateId: primaryCandidateId },
      });
      notesTransferred += logsTransferred.count;

      // Log the merge
      await this.prisma.activityLog.create({
        data: {
          action: "CANDIDATE_MERGED",
          description: `Merged candidate ${duplicate.firstName} ${duplicate.lastName} (${duplicate.email}) into primary`,
          candidateId: primaryCandidateId,
          metadata: {
            mergedCandidateId: duplicateId,
            mergedCandidateName: `${duplicate.firstName} ${duplicate.lastName}`,
            mergedCandidateEmail: duplicate.email,
          },
        },
      });

      // Delete the duplicate
      await this.prisma.candidate.delete({
        where: { id: duplicateId },
      });
    }

    // Update primary with merged tags
    await this.prisma.candidate.update({
      where: { id: primaryCandidateId },
      data: { tags: Array.from(allTags) },
    });

    return {
      primaryCandidateId,
      mergedCandidateIds: duplicateCandidateIds,
      applicationsTransferred,
      notesTransferred,
      tagsmerged,
    };
  }

  /**
   * Get duplicate detection statistics
   */
  async getDuplicateStats(tenantId: string): Promise<{
    totalCandidates: number;
    potentialDuplicates: number;
    duplicateGroups: number;
    estimatedSavings: number;
  }> {
    const totalCandidates = await this.prisma.candidate.count({
      where: { tenantId },
    });

    const duplicateGroups = await this.findDuplicates(tenantId, { limit: 500 });

    const potentialDuplicates = duplicateGroups.reduce(
      (sum, group) => sum + group.duplicates.length,
      0,
    );

    return {
      totalCandidates,
      potentialDuplicates,
      duplicateGroups: duplicateGroups.length,
      estimatedSavings: potentialDuplicates, // Each merged duplicate saves one record
    };
  }

  // ==================== SCORING ====================

  private calculateMatchScore(
    candidate1: any,
    candidate2: any,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Email match (exact) - highest weight
    if (candidate1.email && candidate2.email) {
      if (candidate1.email.toLowerCase() === candidate2.email.toLowerCase()) {
        score += 50;
        reasons.push("Exact email match");
      } else {
        // Check email similarity (same domain, similar local part)
        const [local1, domain1] = candidate1.email.toLowerCase().split("@");
        const [local2, domain2] = candidate2.email.toLowerCase().split("@");

        if (
          domain1 === domain2 &&
          this.stringSimilarity(local1, local2) > 0.8
        ) {
          score += 25;
          reasons.push("Similar email addresses");
        }
      }
    }

    // Phone match (normalized)
    if (candidate1.phone && candidate2.phone) {
      const phone1 = this.normalizePhone(candidate1.phone);
      const phone2 = this.normalizePhone(candidate2.phone);

      if (phone1 === phone2) {
        score += 30;
        reasons.push("Exact phone match");
      } else if (
        phone1.slice(-10) === phone2.slice(-10) &&
        phone1.length >= 10
      ) {
        score += 20;
        reasons.push("Phone number match (last 10 digits)");
      }
    }

    // Name match
    const name1 = `${candidate1.firstName || ""} ${candidate1.lastName || ""}`
      .toLowerCase()
      .trim();
    const name2 = `${candidate2.firstName || ""} ${candidate2.lastName || ""}`
      .toLowerCase()
      .trim();

    if (name1 && name2) {
      if (name1 === name2) {
        score += 20;
        reasons.push("Exact name match");
      } else {
        const nameSimilarity = this.stringSimilarity(name1, name2);
        if (nameSimilarity > 0.85) {
          score += 15;
          reasons.push("Very similar names");
        } else if (nameSimilarity > 0.7) {
          score += 10;
          reasons.push("Similar names");
        }

        // Check for transposed names
        const parts1 = name1.split(" ").filter((p) => p);
        const parts2 = name2.split(" ").filter((p) => p);
        if (parts1.length >= 2 && parts2.length >= 2) {
          const reversed1 = parts1.reverse().join(" ");
          if (this.stringSimilarity(reversed1, name2) > 0.9) {
            score += 10;
            reasons.push("Transposed name match");
          }
        }
      }
    }

    return { score: Math.min(score, 100), reasons };
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private stringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}
