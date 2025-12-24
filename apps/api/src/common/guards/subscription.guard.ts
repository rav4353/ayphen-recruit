import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";

export const SUBSCRIPTION_FEATURE_KEY = "subscription_feature";
export const PLAN_TIER_KEY = "plan_tier";

// Decorator to require a specific subscription feature
export const RequireSubscriptionFeature = (feature: string) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, feature);

// Decorator to require minimum plan tier
export const RequirePlanTier = (...tiers: string[]) =>
  SetMetadata(PLAN_TIER_KEY, tiers);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  // Plan hierarchy for tier comparison
  private readonly PLAN_HIERARCHY: Record<string, number> = {
    STARTER: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  };

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredTiers = this.reflector.getAllAndOverride<string[]>(
      PLAN_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no subscription requirements, allow access
    if (!requiredFeature && !requiredTiers) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException("No tenant context found");
    }

    // Get tenant's subscription with plan details
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: {
          select: {
            name: true,
            features: true,
            limits: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        "No active subscription found. Please contact your administrator.",
      );
    }

    // Check subscription status
    const status = subscription.status as string;
    if (status === "CANCELLED" || status === "EXPIRED") {
      throw new ForbiddenException(
        "Your subscription has expired. Please renew to continue.",
      );
    }

    if (status === "PAST_DUE") {
      throw new ForbiddenException(
        "Your subscription payment is past due. Please update your payment method.",
      );
    }

    // Check plan tier requirement
    if (requiredTiers && requiredTiers.length > 0) {
      const planName = subscription.plan?.name || "STARTER";
      if (!requiredTiers.includes(planName)) {
        throw new ForbiddenException(
          `This feature requires ${requiredTiers.join(" or ")} plan. Your current plan: ${planName}`,
        );
      }
    }

    // Check specific feature requirement
    if (requiredFeature) {
      const features = (subscription.plan?.features as string[]) || [];
      if (!features.includes(requiredFeature)) {
        throw new ForbiddenException(
          `Your plan does not include the '${requiredFeature}' feature. Please upgrade your plan.`,
        );
      }
    }

    return true;
  }
}

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return true; // Let other guards handle auth
    }

    // Get subscription with plan limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: {
          select: {
            name: true,
            limits: true,
          },
        },
      },
    });

    if (!subscription || !subscription.plan?.limits) {
      return true; // No limits configured
    }

    const limits = subscription.plan.limits as Record<string, number>;
    const planName = subscription.plan.name;

    // Check user limit
    if (limits.users) {
      const userCount = await this.prisma.user.count({
        where: { tenantId, status: { notIn: ["INACTIVE"] } },
      });

      if (userCount >= limits.users) {
        // Store limit info in request for potential use in controllers
        request.planLimitReached = {
          type: "users",
          current: userCount,
          limit: limits.users,
          plan: planName,
        };
      }
    }

    // Check job limit
    if (limits.jobs) {
      const jobCount = await this.prisma.job.count({
        where: { tenantId, status: { not: "CLOSED" } },
      });

      if (jobCount >= limits.jobs) {
        request.planLimitReached = {
          type: "jobs",
          current: jobCount,
          limit: limits.jobs,
          plan: planName,
        };
      }
    }

    return true; // Don't block, just add info to request
  }
}
