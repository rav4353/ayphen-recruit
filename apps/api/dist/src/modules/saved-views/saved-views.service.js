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
exports.SavedViewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SavedViewsService = class SavedViewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, tenantId, userId) {
        return this.prisma.savedView.create({
            data: {
                ...dto,
                tenantId,
                userId,
            },
        });
    }
    async findAll(tenantId, userId, entity) {
        return this.prisma.savedView.findMany({
            where: {
                tenantId,
                entity,
                OR: [
                    { userId },
                    { isShared: true },
                ],
            },
            orderBy: {
                createdAt: 'desc',
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
        });
    }
    async findOne(id) {
        const view = await this.prisma.savedView.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!view) {
            throw new common_1.NotFoundException('Saved view not found');
        }
        return view;
    }
    async update(id, dto, userId) {
        const view = await this.findOne(id);
        if (view.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own saved views');
        }
        return this.prisma.savedView.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, userId) {
        const view = await this.findOne(id);
        if (view.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own saved views');
        }
        return this.prisma.savedView.delete({
            where: { id },
        });
    }
};
exports.SavedViewsService = SavedViewsService;
exports.SavedViewsService = SavedViewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SavedViewsService);
//# sourceMappingURL=saved-views.service.js.map