import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(tenantId: string, userId: string, data: { name: string; subject: string; body: string; category?: string; isGlobal?: boolean }) {
        return this.prisma.emailTemplate.create({
            data: {
                ...data,
                tenantId,
                userId,
            },
        });
    }

    async findAll(tenantId: string) {
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

    async findOne(id: string, tenantId: string) {
        return this.prisma.emailTemplate.findFirst({
            where: { id, tenantId },
        });
    }

    async update(id: string, tenantId: string, data: Partial<{ name: string; subject: string; body: string; category: string; isGlobal: boolean }>) {
        return this.prisma.emailTemplate.updateMany({
            where: { id, tenantId }, // Ensure tenant isolation
            data,
        });
    }

    async remove(id: string, tenantId: string) {
        return this.prisma.emailTemplate.deleteMany({
            where: { id, tenantId },
        });
    }
}
