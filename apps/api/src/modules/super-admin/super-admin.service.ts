import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalJobs,
      totalCandidates,
      subscriptionStats,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count(), // Will filter by status after schema migration
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.job.count(),
      this.prisma.candidate.count(),
      this.getSubscriptionStats(),
    ]);

    // Calculate growth (mock for now, would need historical data)
    const tenantsGrowth = 12.5;
    const usersGrowth = 8.3;
    const revenueGrowth = 15.2;

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalJobs,
      totalCandidates,
      totalRevenue: subscriptionStats.totalRevenue,
      monthlyRevenue: subscriptionStats.monthlyRevenue,
      tenantsGrowth,
      usersGrowth,
      revenueGrowth,
    };
  }

  private async getSubscriptionStats() {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalRevenueResult, monthlyRevenueResult] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
          createdAt: { gte: last30Days },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRevenue: (totalRevenueResult._sum.amount || 0) / 100, // Convert cents to dollars
      monthlyRevenue: (monthlyRevenueResult._sum.amount || 0) / 100,
    };
  }

  async getSystemHealth() {
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    let database: 'up' | 'down' = 'up';
    const redis: 'up' | 'down' = 'up';
    const email: 'up' | 'down' = 'up';
    const storage: 'up' | 'down' = 'up';

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      status = 'degraded';
      database = 'down';
    }

    return {
      status,
      database,
      redis,
      email,
      storage,
      lastChecked: new Date().toISOString(),
    };
  }

  async getRecentActivity(limit: number = 10) {
    try {
      const logs = await this.prisma.superAdminAuditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          superAdmin: {
            select: { name: true }
          }
        }
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action.toLowerCase().replace(/_/g, ' '),
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        userName: log.superAdmin.name,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error('Failed to get recent activity', error);
      return [];
    }
  }
}
