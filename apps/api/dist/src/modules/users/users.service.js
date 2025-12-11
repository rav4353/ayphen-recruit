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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../common/services/email.service");
let UsersService = class UsersService {
    constructor(prisma, configService, emailService) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
    }
    async create(dto, tenantId) {
        const { departmentId, role, password, customPermissions, roleId, ...userData } = dto;
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email_tenantId: {
                    email: dto.email,
                    tenantId: tenantId,
                },
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException(`User with email ${dto.email} already exists in this organization`);
        }
        let passwordHash = undefined;
        if (password) {
            const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
            const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
            passwordHash = await bcrypt.hash(password, saltRounds);
        }
        const user = await this.prisma.user.create({
            data: {
                ...userData,
                employeeId: this.generateEmployeeId(),
                tenantId,
                ...(passwordHash && { passwordHash }),
                ...(role && { role }),
                ...(departmentId && { departmentId }),
                ...(roleId && { roleId }),
                ...(customPermissions && { customPermissions }),
                status: 'ACTIVE',
                requirePasswordChange: !!password,
            },
        });
        if (password) {
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
            const loginUrl = `${frontendUrl}/login`;
            await this.emailService.sendInvitationEmail(user.email, user.firstName, password, loginUrl, tenantId);
        }
        return user;
    }
    async findAll(tenantId, query) {
        const where = { tenantId };
        if (query.status) {
            where.status = query.status;
        }
        if (query.role) {
            where.role = query.role;
        }
        if (query.departmentId) {
            where.departmentId = query.departmentId;
        }
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const sortField = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        const orderBy = { [sortField]: sortOrder };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy,
                include: {
                    department: true,
                    roleDef: true
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total };
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { department: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email, tenantId) {
        return this.prisma.user.findUnique({
            where: {
                email_tenantId: { email, tenantId },
            },
            include: {
                roleDef: true
            }
        });
    }
    async update(id, dto) {
        const user = await this.findById(id);
        const { departmentId, role, customPermissions, roleId, ...userData } = dto;
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...userData,
                ...(role && { role }),
                ...(roleId !== undefined && { roleId: roleId || null }),
                ...(departmentId !== undefined && { departmentId: departmentId || null }),
                ...(customPermissions && { customPermissions }),
            },
        });
    }
    async remove(id) {
        const user = await this.findById(id);
        return this.prisma.user.delete({
            where: { id: user.id },
        });
    }
    async updateStatus(id, status) {
        const user = await this.findById(id);
        return this.prisma.user.update({
            where: { id: user.id },
            data: { status },
        });
    }
    async getPreferences(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                preferredTheme: true,
                preferredLanguage: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            theme: user.preferredTheme,
            language: user.preferredLanguage,
        };
    }
    async updatePreferences(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.theme && { preferredTheme: dto.theme }),
                ...(dto.language && { preferredLanguage: dto.language }),
            },
            select: {
                preferredTheme: true,
                preferredLanguage: true,
            },
        });
        return {
            theme: updated.preferredTheme,
            language: updated.preferredLanguage,
        };
    }
    async resendPassword(userId) {
        const user = await this.findById(userId);
        const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2);
        const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
        const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
        const passwordHash = await bcrypt.hash(tempPassword, saltRounds);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                requirePasswordChange: true,
                tempPasswordExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
        });
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login`;
        await this.emailService.sendInvitationEmail(user.email, user.firstName, tempPassword, loginUrl, user.tenantId);
    }
    async getPendingActions(userId) {
        const jobApprovals = await this.prisma.jobApproval.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        const actions = [
            ...jobApprovals.map((approval) => ({
                id: approval.id,
                title: `Approve Job Requisition: ${approval.job.title}`,
                type: 'approval',
                entity: 'Job',
                entityId: approval.job.id,
                due: 'Today',
                createdAt: approval.createdAt,
            })),
        ];
        return actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    generateEmployeeId() {
        return `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        email_service_1.EmailService])
], UsersService);
//# sourceMappingURL=users.service.js.map