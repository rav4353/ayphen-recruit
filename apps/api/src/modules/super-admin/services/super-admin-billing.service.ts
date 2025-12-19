import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateApiKeyDto } from '../dto/billing.dto';
import * as crypto from 'crypto';

@Injectable()
export class SuperAdminBillingService {
    constructor(private prisma: PrismaService) { }

    async getInvoices(params: { page?: number; limit?: number }) {
        const { page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        const [total, data] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: {
                        include: {
                            tenant: { select: { name: true } },
                        },
                    },
                },
            }),
        ]);

        return {
            data,
            meta: { total, page, limit },
        };
    }

    async getApiKeys() {
        return this.prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: { select: { name: true } },
            },
        });
    }

    async createApiKey(dto: CreateApiKeyDto, tenantId?: string) {
        // Generate a random key
        const key = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

        return this.prisma.apiKey.create({
            data: {
                name: dto.name,
                key,
                scopes: dto.scopes,
                tenantId,
            },
        });
    }

    async revokeApiKey(id: string) {
        return this.prisma.apiKey.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getBackups() {
        // Mock backups
        return [
            { id: '1', name: 'backup-weekly-2024-03-10.sql', size: '2.4 GB', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'completed' },
            { id: '2', name: 'backup-weekly-2024-03-03.sql', size: '2.3 GB', createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), status: 'completed' },
            { id: '3', name: 'backup-manual-pre-update.sql', size: '2.4 GB', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'completed' },
        ];
    }

    async getPaymentGateways() {
        return this.prisma.paymentGatewayConfig.findMany();
    }

    async updatePaymentGateway(dto: { provider: string, isActive: boolean, config: any }) {
        return this.prisma.paymentGatewayConfig.upsert({
            where: { provider: dto.provider },
            update: { isActive: dto.isActive, config: dto.config },
            create: { provider: dto.provider, isActive: dto.isActive, config: dto.config },
        });
    }
}
