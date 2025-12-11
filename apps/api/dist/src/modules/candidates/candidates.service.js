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
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
const skills_service_1 = require("../reference/skills.service");
const json2csv_1 = require("json2csv");
let CandidatesService = class CandidatesService {
    constructor(prisma, emailService, skillsService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.skillsService = skillsService;
    }
    async create(dto, tenantId, userId) {
        const existing = await this.prisma.candidate.findFirst({
            where: {
                email: { equals: dto.email, mode: 'insensitive' },
                tenantId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Candidate with this email already exists');
        }
        if (dto.phone) {
            const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
            if (!phoneRegex.test(dto.phone.replace(/\s/g, ''))) {
                throw new common_1.ConflictException('Invalid phone number format');
            }
        }
        let skills = dto.skills;
        if (skills && skills.length > 0) {
            skills = await this.skillsService.normalizeSkills(skills, tenantId);
        }
        const candidate = await this.prisma.candidate.create({
            data: {
                ...dto,
                candidateId: this.generateCandidateId(),
                skills,
                tenantId,
                ...(dto.referrerId && { referrerId: dto.referrerId }),
            },
        });
        await this.prisma.activityLog.create({
            data: {
                action: 'CANDIDATE_CREATED',
                description: `Candidate profile created for ${candidate.firstName} ${candidate.lastName}`,
                candidateId: candidate.id,
                userId,
                metadata: {
                    email: candidate.email,
                    source: candidate.source,
                },
            },
        });
        return candidate;
    }
    async createReferral(dto, tenantId, referrerId) {
        const referralDto = {
            ...dto,
            source: 'REFERRAL',
            sourceDetails: `Referred by user ${referrerId}`,
            referrerId,
        };
        return this.create(referralDto, tenantId, referrerId);
    }
    async findAll(tenantId, query) {
        console.log('CandidatesService.findAll called');
        console.log('TenantID:', tenantId);
        console.log('Query:', JSON.stringify(query));
        const { skip, take, search, skills, location, source, status, sortBy = 'createdAt', sortOrder = 'desc', referrerId, } = query;
        const where = {
            tenantId,
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { currentTitle: { contains: search, mode: 'insensitive' } },
                    { currentCompany: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(location && {
                location: { contains: location, mode: 'insensitive' },
            }),
            ...(source && {
                source: { contains: source, mode: 'insensitive' },
            }),
            ...(referrerId && {
                referrerId,
            }),
            ...(skills && skills.length > 0 && {
                skills: {
                    hasSome: skills,
                },
            }),
            ...(status && {
                applications: {
                    some: {
                        status: status,
                    },
                },
            }),
        };
        console.log('Prisma Where:', JSON.stringify(where, null, 2));
        const [candidates, total] = await Promise.all([
            this.prisma.candidate.findMany({
                where,
                skip,
                take,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    _count: {
                        select: { applications: true },
                    },
                    applications: {
                        orderBy: { updatedAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            job: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.candidate.count({ where }),
        ]);
        console.log(`Found ${candidates.length} candidates out of ${total}`);
        return {
            candidates,
            total,
        };
    }
    async getReferrals(tenantId, referrerId) {
        return this.prisma.candidate.findMany({
            where: {
                tenantId,
                referrerId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                applications: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                    select: {
                        status: true,
                        job: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async export(tenantId, query) {
        const { candidates } = await this.findAll(tenantId, { ...query, take: 10000, skip: 0 });
        if (candidates.length === 0) {
            return '';
        }
        const fields = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'currentTitle',
            'currentCompany',
            'location',
            'skills',
            'source',
            'createdAt',
        ];
        const json2csvParser = new json2csv_1.Parser({ fields });
        return json2csvParser.parse(candidates);
    }
    async sendBulkEmail(ids, subject, message, tenantId) {
        const candidates = await this.prisma.candidate.findMany({
            where: {
                id: { in: ids },
                tenantId,
            },
            select: { email: true, firstName: true },
        });
        if (candidates.length === 0) {
            return { count: 0 };
        }
        const results = await Promise.all(candidates.map((candidate) => this.emailService.sendEmail({
            to: candidate.email,
            subject,
            html: `<p>Hi ${candidate.firstName},</p><p>${message.replace(/\n/g, '<br>')}</p>`,
            text: `Hi ${candidate.firstName},\n\n${message}`,
            tenantId,
        })));
        const successCount = results.filter((success) => success).length;
        return { count: successCount, total: candidates.length };
    }
    async merge(primaryId, secondaryId, tenantId) {
        const primary = await this.findById(primaryId);
        const secondary = await this.findById(secondaryId);
        if (primary.tenantId !== tenantId || secondary.tenantId !== tenantId) {
            throw new common_1.ConflictException('Candidates must belong to the same tenant');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.application.updateMany({
                where: { candidateId: secondaryId },
                data: { candidateId: primaryId },
            });
            await tx.activityLog.updateMany({
                where: { candidateId: secondaryId },
                data: { candidateId: primaryId },
            });
            const mergedTags = [...new Set([...primary.tags, ...secondary.tags])];
            await tx.candidate.update({
                where: { id: primaryId },
                data: { tags: mergedTags },
            });
            await tx.candidate.delete({
                where: { id: secondaryId },
            });
            await tx.activityLog.create({
                data: {
                    action: 'CANDIDATE_MERGED',
                    description: `Merged candidate ${secondary.firstName} ${secondary.lastName} into this profile`,
                    candidateId: primaryId,
                    userId: primary.referrerId,
                    metadata: {
                        mergedFromId: secondaryId,
                        mergedFromName: `${secondary.firstName} ${secondary.lastName}`,
                    },
                },
            });
            return tx.candidate.findUnique({ where: { id: primaryId } });
        });
    }
    async bulkDelete(ids, tenantId) {
        return this.prisma.candidate.deleteMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });
    }
    async findById(id) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id },
            include: {
                applications: {
                    include: {
                        job: { select: { id: true, title: true, status: true } },
                        currentStage: true,
                    },
                },
            },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        return candidate;
    }
    async findByEmail(email, tenantId) {
        return this.prisma.candidate.findUnique({
            where: {
                email_tenantId: { email, tenantId },
            },
        });
    }
    async update(id, dto) {
        const candidate = await this.findById(id);
        let skills = dto.skills;
        if (skills && skills.length > 0) {
            skills = await this.skillsService.normalizeSkills(skills, candidate.tenantId);
        }
        return this.prisma.candidate.update({
            where: { id },
            data: {
                ...dto,
                skills: skills || undefined,
            },
        });
    }
    async remove(id) {
        await this.findById(id);
        return this.prisma.candidate.delete({ where: { id } });
    }
    async addTags(id, tags) {
        const candidate = await this.findById(id);
        const uniqueTags = [...new Set([...candidate.tags, ...tags])];
        return this.prisma.candidate.update({
            where: { id },
            data: { tags: uniqueTags },
        });
    }
    async getActivities(candidateId) {
        return this.prisma.activityLog.findMany({
            where: {
                OR: [
                    { candidateId },
                    {
                        application: {
                            candidateId,
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    generateCandidateId() {
        return `CAN-${Math.floor(100000 + Math.random() * 900000)}`;
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        skills_service_1.SkillsService])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map