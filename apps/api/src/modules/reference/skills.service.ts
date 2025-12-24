import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async normalizeSkills(skills: string[], tenantId: string): Promise<string[]> {
    if (!skills || skills.length === 0) return [];

    // Fetch all skills for the tenant
    // Optimization: In a real app, we might want to cache this or search specifically for the input skills
    // For now, fetching all is fine as the list won't be huge initially.
    const definedSkills = await this.prisma.skill.findMany({
      where: { tenantId },
    });

    const normalizedSkills = new Set<string>();

    for (const inputSkill of skills) {
      const trimmedSkill = inputSkill.trim();
      const lowerSkill = trimmedSkill.toLowerCase();
      let found = false;

      for (const definedSkill of definedSkills) {
        // Check canonical name
        if (definedSkill.name.toLowerCase() === lowerSkill) {
          normalizedSkills.add(definedSkill.name);
          found = true;
          break;
        }

        // Check synonyms
        if (
          definedSkill.synonyms.some(
            (s: string) => s.toLowerCase() === lowerSkill,
          )
        ) {
          normalizedSkills.add(definedSkill.name);
          found = true;
          break;
        }
      }

      if (!found) {
        // If not found in DB, keep the original input (capitalized nicely if possible, but raw for now)
        normalizedSkills.add(trimmedSkill);
      }
    }

    return Array.from(normalizedSkills);
  }

  async create(
    name: string,
    synonyms: string[],
    category: string,
    tenantId: string,
  ) {
    return this.prisma.skill.create({
      data: {
        name,
        synonyms,
        category,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.skill.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }
}
