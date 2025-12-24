import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";

export interface TagRule {
  id: string;
  tenantId: string;
  name: string;
  tag: string;
  conditions: TagCondition[];
  conditionLogic: "AND" | "OR";
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagCondition {
  field:
    | "skills"
    | "experience_years"
    | "title"
    | "company"
    | "location"
    | "education"
    | "source";
  operator:
    | "contains"
    | "equals"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: string | number | string[];
}

const TAG_RULE_KEY = "candidate_tag_rule";

@Injectable()
export class CandidateTaggingService {
  private readonly logger = new Logger(CandidateTaggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private newId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==================== RULE MANAGEMENT ====================

  async createRule(
    tenantId: string,
    dto: {
      name: string;
      tag: string;
      conditions: TagCondition[];
      conditionLogic?: "AND" | "OR";
      priority?: number;
    },
  ): Promise<TagRule> {
    const rule: TagRule = {
      id: this.newId(),
      tenantId,
      name: dto.name,
      tag: dto.tag,
      conditions: dto.conditions,
      conditionLogic: dto.conditionLogic || "AND",
      isActive: true,
      priority: dto.priority || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.create({
      data: {
        tenantId,
        key: `${TAG_RULE_KEY}_${rule.id}`,
        value: rule as any,
        category: "AUTO_TAGGING",
        isPublic: false,
      },
    });

    return rule;
  }

  async getRules(tenantId: string): Promise<TagRule[]> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId,
        key: { startsWith: `${TAG_RULE_KEY}_` },
      },
    });

    return settings
      .map((s) => s.value as unknown as TagRule)
      .sort((a, b) => b.priority - a.priority);
  }

  async updateRule(
    tenantId: string,
    ruleId: string,
    dto: Partial<{
      name: string;
      tag: string;
      conditions: TagCondition[];
      conditionLogic: "AND" | "OR";
      isActive: boolean;
      priority: number;
    }>,
  ): Promise<TagRule> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: `${TAG_RULE_KEY}_${ruleId}` } },
    });

    if (!setting) {
      throw new Error("Rule not found");
    }

    const rule = setting.value as unknown as TagRule;
    const updated: TagRule = {
      ...rule,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: `${TAG_RULE_KEY}_${ruleId}` } },
      data: { value: updated as any },
    });

    return updated;
  }

  async deleteRule(tenantId: string, ruleId: string): Promise<void> {
    await this.prisma.setting.delete({
      where: { tenantId_key: { tenantId, key: `${TAG_RULE_KEY}_${ruleId}` } },
    });
  }

  // ==================== AUTO-TAGGING ====================

  /**
   * Apply tags to a single candidate based on rules
   */
  async tagCandidate(candidateId: string, tenantId: string): Promise<string[]> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate || candidate.tenantId !== tenantId) {
      return [];
    }

    const rules = await this.getRules(tenantId);
    const activeRules = rules.filter((r) => r.isActive);

    const tagsToAdd: string[] = [];

    for (const rule of activeRules) {
      if (this.evaluateRule(candidate, rule)) {
        tagsToAdd.push(rule.tag);
      }
    }

    if (tagsToAdd.length > 0) {
      const existingTags = candidate.tags || [];
      const newTags = [...new Set([...existingTags, ...tagsToAdd])];

      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { tags: newTags },
      });

      // Log the auto-tagging
      await this.prisma.activityLog.create({
        data: {
          action: "CANDIDATE_AUTO_TAGGED",
          description: `Auto-tagged candidate with: ${tagsToAdd.join(", ")}`,
          candidateId,
          metadata: {
            tagsAdded: tagsToAdd,
            rulesApplied: activeRules.map((r) => r.name),
          },
        },
      });
    }

    return tagsToAdd;
  }

  /**
   * Batch tag all candidates for a tenant
   */
  async tagAllCandidates(tenantId: string): Promise<{
    processed: number;
    tagged: number;
    tagsApplied: Record<string, number>;
  }> {
    const candidates = await this.prisma.candidate.findMany({
      where: { tenantId },
      select: { id: true },
    });

    const rules = await this.getRules(tenantId);
    const activeRules = rules.filter((r) => r.isActive);

    let processed = 0;
    let tagged = 0;
    const tagsApplied: Record<string, number> = {};

    for (const candidate of candidates) {
      const tags = await this.tagCandidateWithRules(candidate.id, activeRules);
      processed++;

      if (tags.length > 0) {
        tagged++;
        for (const tag of tags) {
          tagsApplied[tag] = (tagsApplied[tag] || 0) + 1;
        }
      }
    }

    return { processed, tagged, tagsApplied };
  }

  /**
   * Tag candidate using provided rules (internal)
   */
  private async tagCandidateWithRules(
    candidateId: string,
    rules: TagRule[],
  ): Promise<string[]> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) return [];

    const tagsToAdd: string[] = [];

    for (const rule of rules) {
      if (this.evaluateRule(candidate, rule)) {
        tagsToAdd.push(rule.tag);
      }
    }

    if (tagsToAdd.length > 0) {
      const existingTags = candidate.tags || [];
      const newTags = [...new Set([...existingTags, ...tagsToAdd])];

      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { tags: newTags },
      });
    }

    return tagsToAdd;
  }

  /**
   * Scheduled job to auto-tag new candidates
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoTagNewCandidates(): Promise<void> {
    this.logger.log("Running auto-tagging job...");

    try {
      // Get candidates created in the last hour without tags
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const candidates = await this.prisma.candidate.findMany({
        where: {
          createdAt: { gte: oneHourAgo },
          OR: [{ tags: { isEmpty: true } }, { tags: { equals: [] } }],
        },
        select: { id: true, tenantId: true },
      });

      this.logger.log(`Found ${candidates.length} new candidates to tag`);

      // Group by tenant
      const byTenant = new Map<string, string[]>();
      for (const c of candidates) {
        if (!byTenant.has(c.tenantId)) {
          byTenant.set(c.tenantId, []);
        }
        byTenant.get(c.tenantId)!.push(c.id);
      }

      // Process each tenant
      for (const [tenantId, candidateIds] of byTenant.entries()) {
        const rules = await this.getRules(tenantId);
        const activeRules = rules.filter((r) => r.isActive);

        if (activeRules.length === 0) continue;

        for (const candidateId of candidateIds) {
          await this.tagCandidateWithRules(candidateId, activeRules);
        }
      }

      this.logger.log("Auto-tagging job completed");
    } catch (error) {
      this.logger.error("Error in auto-tagging job:", error);
    }
  }

  // ==================== RULE EVALUATION ====================

  private evaluateRule(candidate: any, rule: TagRule): boolean {
    const results = rule.conditions.map((condition) =>
      this.evaluateCondition(candidate, condition),
    );

    if (rule.conditionLogic === "AND") {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private evaluateCondition(candidate: any, condition: TagCondition): boolean {
    const { field, operator, value } = condition;

    let fieldValue: any;

    switch (field) {
      case "skills":
        fieldValue = (candidate.skills || []).map((s: string) =>
          s.toLowerCase(),
        );
        break;
      case "experience_years":
        fieldValue = this.extractYearsOfExperience(candidate);
        break;
      case "title":
        fieldValue = (candidate.currentTitle || "").toLowerCase();
        break;
      case "company":
        fieldValue = (candidate.currentCompany || "").toLowerCase();
        break;
      case "location":
        fieldValue = (candidate.location || "").toLowerCase();
        break;
      case "education":
        fieldValue = (candidate.education || [])
          .map((e: any) =>
            `${e.degree || ""} ${e.institution || ""}`.toLowerCase(),
          )
          .join(" ");
        break;
      case "source":
        fieldValue = (candidate.source || "").toLowerCase();
        break;
      default:
        return false;
    }

    return this.compareValues(fieldValue, operator, value);
  }

  private compareValues(
    fieldValue: any,
    operator: TagCondition["operator"],
    value: any,
  ): boolean {
    const normalizedValue =
      typeof value === "string" ? value.toLowerCase() : value;

    switch (operator) {
      case "contains":
        if (Array.isArray(fieldValue)) {
          return fieldValue.some((v) => v.includes(normalizedValue));
        }
        return String(fieldValue).includes(normalizedValue);

      case "equals":
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(normalizedValue);
        }
        return fieldValue === normalizedValue;

      case "greater_than":
        return Number(fieldValue) > Number(value);

      case "less_than":
        return Number(fieldValue) < Number(value);

      case "in":
        const inValues = Array.isArray(value)
          ? value.map((v) => String(v).toLowerCase())
          : [normalizedValue];
        if (Array.isArray(fieldValue)) {
          return fieldValue.some((v) => inValues.includes(v));
        }
        return inValues.includes(String(fieldValue).toLowerCase());

      case "not_in":
        const notInValues = Array.isArray(value)
          ? value.map((v) => String(v).toLowerCase())
          : [normalizedValue];
        if (Array.isArray(fieldValue)) {
          return !fieldValue.some((v) => notInValues.includes(v));
        }
        return !notInValues.includes(String(fieldValue).toLowerCase());

      default:
        return false;
    }
  }

  private extractYearsOfExperience(candidate: any): number {
    if (candidate.experience && Array.isArray(candidate.experience)) {
      let totalYears = 0;
      for (const exp of candidate.experience) {
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          const end =
            exp.endDate === "Present" || !exp.endDate
              ? new Date()
              : new Date(exp.endDate);
          totalYears +=
            (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        }
      }
      return Math.round(totalYears);
    }

    // Fallback: estimate from title
    const title = (candidate.currentTitle || "").toLowerCase();
    if (title.includes("senior") || title.includes("lead")) return 5;
    if (title.includes("principal") || title.includes("staff")) return 8;
    if (title.includes("junior") || title.includes("associate")) return 1;

    return 3;
  }

  // ==================== PRESET RULES ====================

  async createPresetRules(tenantId: string): Promise<TagRule[]> {
    const presets = [
      {
        name: "Senior Developer",
        tag: "senior",
        conditions: [
          {
            field: "experience_years" as const,
            operator: "greater_than" as const,
            value: 5,
          },
        ],
      },
      {
        name: "Frontend Specialist",
        tag: "frontend",
        conditions: [
          {
            field: "skills" as const,
            operator: "in" as const,
            value: ["react", "vue", "angular", "javascript", "typescript"],
          },
        ],
      },
      {
        name: "Backend Specialist",
        tag: "backend",
        conditions: [
          {
            field: "skills" as const,
            operator: "in" as const,
            value: ["node", "python", "java", "go", "rust", "c#"],
          },
        ],
      },
      {
        name: "Full Stack Developer",
        tag: "fullstack",
        conditions: [
          {
            field: "title" as const,
            operator: "contains" as const,
            value: "full stack",
          },
        ],
      },
      {
        name: "DevOps Engineer",
        tag: "devops",
        conditions: [
          {
            field: "skills" as const,
            operator: "in" as const,
            value: [
              "docker",
              "kubernetes",
              "aws",
              "terraform",
              "jenkins",
              "ci/cd",
            ],
          },
        ],
      },
      {
        name: "Data Professional",
        tag: "data",
        conditions: [
          {
            field: "skills" as const,
            operator: "in" as const,
            value: [
              "python",
              "sql",
              "machine learning",
              "data science",
              "pandas",
              "tensorflow",
            ],
          },
        ],
      },
      {
        name: "FAANG Experience",
        tag: "faang",
        conditions: [
          {
            field: "company" as const,
            operator: "in" as const,
            value: [
              "google",
              "meta",
              "amazon",
              "apple",
              "netflix",
              "microsoft",
              "facebook",
            ],
          },
        ],
      },
      {
        name: "Remote Candidate",
        tag: "remote",
        conditions: [
          {
            field: "location" as const,
            operator: "contains" as const,
            value: "remote",
          },
        ],
      },
    ];

    const created: TagRule[] = [];
    for (const preset of presets) {
      try {
        const rule = await this.createRule(tenantId, preset);
        created.push(rule);
      } catch (error) {
        this.logger.warn(`Failed to create preset rule ${preset.name}:`, error);
      }
    }

    return created;
  }
}
