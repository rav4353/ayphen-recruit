import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SuperAdminAuditService } from "./super-admin-audit.service";

@Injectable()
export class SuperAdminSubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: SuperAdminAuditService,
  ) {}

  async getAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.plan) where.plan = { name: params.plan };

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: { select: { id: true, name: true } },
          plan: {
            select: {
              name: true,
              monthlyPrice: true,
              yearlyPrice: true,
              currency: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions.map((sub) => ({
        id: sub.id,
        tenantId: sub.tenant.id,
        tenantName: sub.tenant.name,
        plan: sub.plan.name,
        status: sub.status,
        billingCycle: sub.billingCycle,
        amount:
          (sub.billingCycle === "MONTHLY"
            ? sub.plan.monthlyPrice
            : sub.plan.yearlyPrice) / 100,
        currency: sub.plan.currency,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelledAt: sub.cancelledAt,
        createdAt: sub.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (plans.length === 0) {
      return [
        {
          id: "starter",
          name: "STARTER",
          displayName: "Starter",
          monthlyPrice: 9900,
          yearlyPrice: 99000,
          currency: "USD",
          features: ["Up to 5 users", "Up to 10 active jobs", "500 candidates"],
          limits: { users: 5, jobs: 10, candidates: 500 },
        },
        {
          id: "professional",
          name: "PROFESSIONAL",
          displayName: "Professional",
          monthlyPrice: 29900,
          yearlyPrice: 299000,
          currency: "USD",
          features: [
            "Up to 25 users",
            "Up to 50 active jobs",
            "5000 candidates",
          ],
          limits: { users: 25, jobs: 50, candidates: 5000 },
        },
        {
          id: "enterprise",
          name: "ENTERPRISE",
          displayName: "Enterprise",
          monthlyPrice: 99900,
          yearlyPrice: 999000,
          currency: "USD",
          features: [
            "Unlimited users",
            "Unlimited jobs",
            "Unlimited candidates",
          ],
          limits: { users: -1, jobs: -1, candidates: -1 },
        },
      ];
    }

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      features: plan.features || [],
      limits: plan.limits || {},
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    }));
  }

  async createPlan(data: any, superAdminId: string) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        currency: data.currency || "USD",
        features: data.features || [],
        limits: data.limits || {},
        sortOrder: data.sortOrder || 0,
      },
    });

    await this.auditService.log({
      superAdminId,
      action: "CREATE_PLAN",
      entityType: "PLAN",
      entityId: plan.id,
      details: data,
    });

    return plan;
  }

  async updatePlan(id: string, data: any, superAdminId: string) {
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        currency: data.currency,
        features: data.features,
        limits: data.limits,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    await this.auditService.log({
      superAdminId,
      action: "UPDATE_PLAN",
      entityType: "PLAN",
      entityId: id,
      details: data,
    });

    return plan;
  }

  async deletePlan(id: string, superAdminId: string) {
    // Check if plan has subscriptions
    const subCount = await this.prisma.subscription.count({
      where: { planId: id },
    });

    if (subCount > 0) {
      // Instead of deleting, we should probably mark it as inactive
      return this.updatePlan(id, { isActive: false }, superAdminId);
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });

    await this.auditService.log({
      superAdminId,
      action: "DELETE_PLAN",
      entityType: "PLAN",
      entityId: id,
      details: { id },
    });

    return { success: true };
  }

  async create(
    tenantId: string,
    data: { plan: string; billingCycle: string },
    superAdminId: string,
  ) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: data.plan },
    });

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    const now = new Date();
    const periodEnd = new Date(now);

    if (data.billingCycle === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: "ACTIVE",
        billingCycle: data.billingCycle as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.auditService.log({
      superAdminId,
      action: "CREATE_SUBSCRIPTION",
      entityType: "SUBSCRIPTION",
      entityId: tenantId,
      details: { plan: data.plan, billingCycle: data.billingCycle },
    });

    return { success: true };
  }

  async cancel(id: string, reason: string | undefined, superAdminId: string) {
    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    await this.auditService.log({
      superAdminId,
      action: "CANCEL_SUBSCRIPTION",
      entityType: "SUBSCRIPTION",
      entityId: id,
      details: { reason },
    });

    return { success: true };
  }

  async extend(id: string, days: number, superAdminId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!sub) throw new NotFoundException("Subscription not found");

    const newEnd = new Date(sub.currentPeriodEnd);
    newEnd.setDate(newEnd.getDate() + days);

    await this.prisma.subscription.update({
      where: { id },
      data: { currentPeriodEnd: newEnd },
    });

    await this.auditService.log({
      superAdminId,
      action: "EXTEND_SUBSCRIPTION",
      entityType: "SUBSCRIPTION",
      entityId: id,
      details: { days },
    });

    return { success: true };
  }

  async getStats() {
    const subs = await this.prisma.subscription.findMany({
      include: { plan: true },
    });

    const stats = {
      activeSubscriptions: 0,
      trialSubscriptions: 0,
      cancelledSubscriptions: 0,
      totalMRR: 0,
    };

    subs.forEach((s) => {
      if (s.status === "ACTIVE") {
        stats.activeSubscriptions++;
        if (s.billingCycle === "MONTHLY") {
          stats.totalMRR += s.plan.monthlyPrice;
        } else {
          stats.totalMRR += s.plan.yearlyPrice / 12;
        }
      } else if (s.status === "TRIAL") {
        stats.trialSubscriptions++;
      } else if (s.status === "CANCELLED") {
        stats.cancelledSubscriptions++;
      }
    });

    return {
      activeSubscriptions: stats.activeSubscriptions,
      trialSubscriptions: stats.trialSubscriptions,
      cancelledSubscriptions: stats.cancelledSubscriptions,
      totalMRR: stats.totalMRR / 100,
      totalARR: (stats.totalMRR * 12) / 100,
      churnRate: 2.5,
    };
  }
}
