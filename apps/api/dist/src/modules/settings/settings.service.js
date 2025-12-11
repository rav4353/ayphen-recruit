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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const default_status_colors_1 = require("./constants/default-status-colors");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(tenantId) {
        return this.prisma.setting.findMany({
            where: { tenantId },
        });
    }
    async getSettingByKey(tenantId, key) {
        const setting = await this.prisma.setting.findUnique({
            where: {
                tenantId_key: {
                    tenantId,
                    key,
                },
            },
        });
        if (!setting) {
            throw new common_1.NotFoundException(`Setting with key ${key} not found`);
        }
        return setting;
    }
    async updateSetting(tenantId, key, value, category = 'GENERAL', isPublic = false) {
        return this.prisma.setting.upsert({
            where: {
                tenantId_key: {
                    tenantId,
                    key,
                },
            },
            update: {
                value,
                category,
                isPublic,
            },
            create: {
                tenantId,
                key,
                value,
                category,
                isPublic,
            },
        });
    }
    async getPublicSettings(tenantId) {
        return this.prisma.setting.findMany({
            where: {
                tenantId,
                isPublic: true,
            },
        });
    }
    async getStatusColors(tenantId) {
        try {
            const setting = await this.prisma.setting.findUnique({
                where: {
                    tenantId_key: {
                        tenantId,
                        key: 'status_colors',
                    },
                },
            });
            if (!setting) {
                return default_status_colors_1.DEFAULT_STATUS_COLORS;
            }
            return setting.value;
        }
        catch (error) {
            return default_status_colors_1.DEFAULT_STATUS_COLORS;
        }
    }
    async resetStatusColors(tenantId) {
        return this.prisma.setting.upsert({
            where: {
                tenantId_key: {
                    tenantId,
                    key: 'status_colors',
                },
            },
            update: {
                value: default_status_colors_1.DEFAULT_STATUS_COLORS,
                category: 'APPEARANCE',
                isPublic: true,
            },
            create: {
                tenantId,
                key: 'status_colors',
                value: default_status_colors_1.DEFAULT_STATUS_COLORS,
                category: 'APPEARANCE',
                isPublic: true,
            },
        });
    }
    async createScorecard(tenantId, data) {
        return this.prisma.scorecardTemplate.create({
            data: { ...data, tenantId },
        });
    }
    async getScorecards(tenantId) {
        return this.prisma.scorecardTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getScorecard(id) {
        const template = await this.prisma.scorecardTemplate.findUnique({
            where: { id },
        });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return template;
    }
    async updateScorecard(id, data) {
        return this.prisma.scorecardTemplate.update({
            where: { id },
            data,
        });
    }
    async deleteScorecard(id) {
        return this.prisma.scorecardTemplate.delete({
            where: { id },
        });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map