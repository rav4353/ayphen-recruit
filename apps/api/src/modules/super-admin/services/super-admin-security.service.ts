import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BlockIpDto } from '../dto/security.dto';
import { SuperAdminGateway } from '../super-admin.gateway';

@Injectable()
export class SuperAdminSecurityService {
    constructor(
        private prisma: PrismaService,
        private gateway: SuperAdminGateway,
    ) { }

    async getAlerts(limit = 50) {
        return this.prisma.securityAlert.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async resolveAlert(id: string) {
        return this.prisma.securityAlert.update({
            where: { id },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
            },
        });
    }

    async getBlockedIps() {
        return this.prisma.blockedIp.findMany({
            orderBy: { blockedAt: 'desc' },
        });
    }

    async blockIp(dto: BlockIpDto, blockedBy: string) {
        const existing = await this.prisma.blockedIp.findUnique({
            where: { ipAddress: dto.ipAddress },
        });

        if (existing) {
            throw new ConflictException('IP address is already blocked');
        }

        return this.prisma.blockedIp.create({
            data: {
                ipAddress: dto.ipAddress,
                reason: dto.reason,
                blockedBy,
            },
        });
    }

    async unblockIp(id: string) {
        return this.prisma.blockedIp.delete({
            where: { id },
        });
    }

    async getActiveSessions(limit = 20) {
        const sessions = await this.prisma.userSession.findMany({
            take: limit,
            orderBy: { lastActiveAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        // lastName: true, // Assuming Schema has firstName only or need to check
                        email: true,
                    }
                }
            }
        });

        return sessions.map(s => ({
            id: s.id,
            userId: s.userId,
            userName: s.user.firstName || s.user.email,
            ipAddress: s.ipAddress || 'Unknown',
            device: s.userAgent || 'Unknown', // Ideally parse user agent
            lastActive: s.lastActiveAt,
        }));
    }

    async revokeSession(id: string) {
        return this.prisma.userSession.delete({
            where: { id },
        });
    }

    async getLoginAttempts(params: { success?: boolean; limit?: number; page?: number }) {
        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        return this.prisma.loginAttempt.findMany({
            where: params.success !== undefined ? { success: params.success } : {},
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });
    }

    async createAlert(data: { type: string; severity: string; message: string; sourceIp?: string; tenantId?: string }) {
        const alert = await this.prisma.securityAlert.create({
            data: {
                ...data,
                status: 'OPEN',
            },
        });

        // Broadcast to security subscribers
        this.gateway.broadcastSecurityAlert(alert);

        return alert;
    }
    async checkSecuritySpikes(ipAddress?: string) {
        const windowMinutes = 5;
        const cutoff = new Date();
        cutoff.setMinutes(cutoff.getMinutes() - windowMinutes);

        // 1. Check for global spike
        const globalFailedCount = await this.prisma.loginAttempt.count({
            where: {
                success: false,
                createdAt: { gte: cutoff },
            },
        });

        if (globalFailedCount >= 20) {
            await this.createAlert({
                type: 'GLOBAL_AUTH_SPIKE',
                severity: 'high',
                message: `Detected ${globalFailedCount} failed login attempts in the last ${windowMinutes} minutes across the platform.`,
            });
        }

        // 2. Check for IP-specific spike
        if (ipAddress) {
            const ipFailedCount = await this.prisma.loginAttempt.count({
                where: {
                    ipAddress,
                    success: false,
                    createdAt: { gte: cutoff },
                },
            });

            if (ipFailedCount >= 5) {
                await this.createAlert({
                    type: 'IP_AUTH_SPIKE',
                    severity: 'critical',
                    message: `Detected ${ipFailedCount} failed login attempts from IP ${ipAddress} in the last ${windowMinutes} minutes.`,
                    sourceIp: ipAddress,
                });
            }
        }
    }
}
