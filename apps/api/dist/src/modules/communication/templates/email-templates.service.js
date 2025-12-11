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
exports.EmailTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let EmailTemplatesService = class EmailTemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, userId, data) {
        return this.prisma.emailTemplate.create({
            data: {
                ...data,
                tenantId,
                userId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.emailTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
    }
    async findOne(id, tenantId) {
        return this.prisma.emailTemplate.findFirst({
            where: { id, tenantId },
        });
    }
    async update(id, tenantId, data) {
        return this.prisma.emailTemplate.updateMany({
            where: { id, tenantId },
            data,
        });
    }
    async remove(id, tenantId) {
        return this.prisma.emailTemplate.deleteMany({
            where: { id, tenantId },
        });
    }
};
exports.EmailTemplatesService = EmailTemplatesService;
exports.EmailTemplatesService = EmailTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailTemplatesService);
//# sourceMappingURL=email-templates.service.js.map