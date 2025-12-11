"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SkillsService = class SkillsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async normalizeSkills(skills, tenantId) {
        if (!skills || skills.length === 0)
            return [];
        const definedSkills = await this.prisma.skill.findMany({
            where: { tenantId },
        });
        const normalizedSkills = new Set();
        for (const inputSkill of skills) {
            const trimmedSkill = inputSkill.trim();
            const lowerSkill = trimmedSkill.toLowerCase();
            let found = false;
            for (const definedSkill of definedSkills) {
                if (definedSkill.name.toLowerCase() === lowerSkill) {
                    normalizedSkills.add(definedSkill.name);
                    found = true;
                    break;
                }
                if (definedSkill.synonyms.some((s) => s.toLowerCase() === lowerSkill)) {
                    normalizedSkills.add(definedSkill.name);
                    found = true;
                    break;
                }
            }
            if (!found) {
                normalizedSkills.add(trimmedSkill);
            }
        }
        return Array.from(normalizedSkills);
    }
    async create(name, synonyms, category, tenantId) {
        return this.prisma.skill.create({
            data: {
                name,
                synonyms,
                category,
                tenantId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.skill.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkillsService);
//# sourceMappingURL=skills.service.js.map