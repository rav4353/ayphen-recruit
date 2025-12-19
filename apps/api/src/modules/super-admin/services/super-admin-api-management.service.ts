import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SuperAdminAuditService } from './super-admin-audit.service';
import * as crypto from 'crypto';

@Injectable()
export class SuperAdminApiManagementService {
    constructor(
        private prisma: PrismaService,
        private auditService: SuperAdminAuditService,
    ) { }

    async getApiKeys(params: { page?: number; limit?: number; tenantId?: string; search?: string }) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (params.tenantId) where.tenantId = params.tenantId;
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { key: { contains: params.search, mode: 'insensitive' } },
                { tenant: { name: { contains: params.search, mode: 'insensitive' } } },
            ];
        }

        const [keys, total] = await Promise.all([
            this.prisma.apiKey.findMany({
                where,
                include: { tenant: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            this.prisma.apiKey.count({ where }),
        ]);

        return {
            data: keys.map(k => ({
                ...k,
                key: `${k.key.substring(0, 10)}...${k.key.substring(k.key.length - 4)}` // Mask key partially
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async createApiKey(data: { name: string; tenantId?: string; scopes: string[]; expiresAt?: string }, superAdminId: string) {
        const key = `tx_${crypto.randomBytes(32).toString('hex')}`;

        const apiKey = await this.prisma.apiKey.create({
            data: {
                name: data.name,
                tenantId: data.tenantId || null,
                scopes: data.scopes,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                key,
            },
            include: { tenant: { select: { name: true } } }
        });

        await this.auditService.log({
            superAdminId,
            action: 'CREATE_API_KEY',
            entityType: 'API_KEY',
            entityId: apiKey.id,
            details: { name: data.name, tenantId: data.tenantId },
        });

        return apiKey;
    }

    async revokeApiKey(id: string, superAdminId: string) {
        const apiKey = await this.prisma.apiKey.update({
            where: { id },
            data: { isActive: false },
        });

        await this.auditService.log({
            superAdminId,
            action: 'REVOKE_API_KEY',
            entityType: 'API_KEY',
            entityId: id,
        });

        return apiKey;
    }

    async getApiUsage(params: { tenantId?: string; limit?: number }) {
        const limit = params.limit || 100;

        const usage = await this.prisma.apiUsage.findMany({
            where: params.tenantId ? { tenantId: params.tenantId } : {},
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { tenant: { select: { name: true } } }
        });

        // Aggregate stats by tenant - Using count of groups
        const stats = await this.prisma.apiUsage.groupBy({
            by: ['tenantId'],
            _count: { _all: true },
            orderBy: { _count: { tenantId: 'desc' } },
            take: 10
        });

        return { usage, stats };
    }

    async getWebhookSubscriptions(params: { tenantId?: string }) {
        return this.prisma.webhookSubscription.findMany({
            where: params.tenantId ? { tenantId: params.tenantId } : {},
            include: { tenant: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createWebhookSubscription(data: { url: string; events: string[]; tenantId?: string }, superAdminId: string) {
        const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
        const sub = await this.prisma.webhookSubscription.create({
            data: {
                url: data.url,
                events: data.events,
                tenantId: data.tenantId || null,
                secret,
            }
        });

        await this.auditService.log({
            superAdminId,
            action: 'CREATE_WEBHOOK_SUBSCRIPTION',
            entityType: 'WEBHOOK',
            entityId: sub.id,
            details: { url: data.url, tenantId: data.tenantId },
        });

        return sub;
    }

    async deleteWebhookSubscription(id: string, superAdminId: string) {
        await this.prisma.webhookSubscription.delete({
            where: { id }
        });

        await this.auditService.log({
            superAdminId,
            action: 'DELETE_WEBHOOK_SUBSCRIPTION',
            entityType: 'WEBHOOK',
            entityId: id,
        });

        return { success: true };
    }
}
