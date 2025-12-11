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
exports.ScorecardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ScorecardsService = class ScorecardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, tenantId) {
        return this.prisma.scorecardTemplate.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.scorecardTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const template = await this.prisma.scorecardTemplate.findUnique({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Scorecard template not found');
        }
        return template;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.scorecardTemplate.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.scorecardTemplate.delete({
            where: { id },
        });
    }
};
exports.ScorecardsService = ScorecardsService;
exports.ScorecardsService = ScorecardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScorecardsService);
//# sourceMappingURL=scorecards.service.js.map