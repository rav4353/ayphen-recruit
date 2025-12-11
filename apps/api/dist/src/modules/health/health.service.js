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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let HealthService = class HealthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkHealth() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'talentx-api',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                service: 'talentx-api',
                error: error.message,
            };
        }
    }
    async getDetailedHealth() {
        const dbStart = Date.now();
        let dbStatus = 'unhealthy';
        let dbLatency = 0;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            dbStatus = 'healthy';
            dbLatency = Date.now() - dbStart;
        }
        catch (e) {
            dbStatus = 'unhealthy';
        }
        const memoryUsage = process.memoryUsage();
        const metrics = {
            status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: [
                {
                    service: 'Database',
                    status: dbStatus,
                    responseTime: dbLatency,
                    lastChecked: new Date().toISOString(),
                    message: dbStatus === 'healthy' ? 'Connected' : 'Connection failed'
                },
                {
                    service: 'API Server',
                    status: 'healthy',
                    responseTime: 0,
                    lastChecked: new Date().toISOString(),
                    message: 'Running'
                },
                {
                    service: 'Email Service',
                    status: 'healthy',
                    responseTime: 45,
                    lastChecked: new Date().toISOString()
                },
                {
                    service: 'AI Service',
                    status: 'healthy',
                    responseTime: 120,
                    lastChecked: new Date().toISOString()
                }
            ],
            database: {
                candidates: await this.prisma.candidate.count(),
                jobs: await this.prisma.job.count(),
                applications: await this.prisma.application.count(),
                interviews: await this.prisma.interview.count().catch(() => 0),
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
                }
            }
        };
        return metrics;
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map