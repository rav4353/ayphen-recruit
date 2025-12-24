import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface ComplianceAlert {
  id: string;
  title: string;
  severity: "Critical" | "Warning";
  type: "GDPR" | "Diversity" | "Background Check" | "Document Expiry" | "SLA";
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  createdAt: Date;
}

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlerts(tenantId: string): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // 1. GDPR - Old candidates (data retention - candidates older than 1 year with no recent activity)
    const oldCandidates = await this.prisma.candidate.count({
      where: {
        tenantId,
        createdAt: {
          lte: oneYearAgo,
        },
        updatedAt: {
          lte: oneYearAgo,
        },
      },
    });

    if (oldCandidates > 0) {
      alerts.push({
        id: `gdpr-retention-${now.getTime()}`,
        title: `${oldCandidates} Candidate${oldCandidates > 1 ? "s" : ""} data older than 1 year (GDPR review needed)`,
        severity: "Warning",
        type: "GDPR",
        actionUrl: "/candidates?sort=createdAt&order=asc",
        createdAt: now,
      });
    }

    // 2. GDPR - Candidates without consent
    const noConsentCandidates = await this.prisma.candidate.count({
      where: {
        tenantId,
        gdprConsent: false,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (noConsentCandidates > 0) {
      alerts.push({
        id: `gdpr-no-consent-${now.getTime()}`,
        title: `${noConsentCandidates} recent candidate${noConsentCandidates > 1 ? "s" : ""} missing GDPR consent`,
        severity: "Critical",
        type: "GDPR",
        actionUrl: "/candidates?filter=no-consent",
        createdAt: now,
      });
    }

    // 3. Diversity - Check for departments with high application volume but no diversity tracking
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    for (const dept of departments) {
      const applicationCount = await this.prisma.application.count({
        where: {
          job: {
            tenantId,
            departmentId: dept.id,
          },
          status: {
            in: ["APPLIED", "SCREENING", "INTERVIEW"],
          },
        },
      });

      // Alert for departments with many active applications (encourage diversity tracking)
      if (applicationCount > 20) {
        alerts.push({
          id: `diversity-${dept.id}`,
          title: `${dept.name} Dept has ${applicationCount} active applications - ensure diversity tracking`,
          severity: "Warning",
          type: "Diversity",
          entityId: dept.id,
          entityType: "department",
          createdAt: now,
        });
      }
    }

    // 4. Background Check - Failed checks
    const failedBgvChecks = await this.prisma.bGVCheck.findMany({
      where: {
        application: {
          job: { tenantId },
        },
        status: "CONSIDER",
      },
      include: {
        application: {
          include: {
            candidate: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      take: 5,
    });

    for (const check of failedBgvChecks) {
      const candidateName = `${check.application.candidate.firstName} ${check.application.candidate.lastName}`;
      alerts.push({
        id: `bgv-failed-${check.id}`,
        title: `Background check requires review for ${candidateName}`,
        severity: "Critical",
        type: "Background Check",
        entityId: check.id,
        entityType: "bgvCheck",
        actionUrl: `/applications/${check.applicationId}`,
        createdAt: check.updatedAt,
      });
    }

    // 5. Background Check - Pending for too long
    const stuckBgvChecks = await this.prisma.bGVCheck.count({
      where: {
        application: {
          job: { tenantId },
        },
        status: "PENDING",
        createdAt: {
          lte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      },
    });

    if (stuckBgvChecks > 0) {
      alerts.push({
        id: `bgv-stuck-${now.getTime()}`,
        title: `${stuckBgvChecks} background check${stuckBgvChecks > 1 ? "s" : ""} pending for over 14 days`,
        severity: "Warning",
        type: "Background Check",
        createdAt: now,
      });
    }

    // 6. SLA - Applications without activity
    const staleApplications = await this.prisma.application.count({
      where: {
        job: { tenantId },
        status: {
          notIn: ["HIRED", "REJECTED", "WITHDRAWN"],
        },
        updatedAt: {
          lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      },
    });

    if (staleApplications > 0) {
      alerts.push({
        id: `sla-stale-${now.getTime()}`,
        title: `${staleApplications} application${staleApplications > 1 ? "s" : ""} with no activity for 7+ days`,
        severity: "Warning",
        type: "SLA",
        actionUrl: "/applications?filter=stale",
        createdAt: now,
      });
    }

    // Sort by severity (Critical first) then by date
    return alerts.sort((a, b) => {
      if (a.severity === "Critical" && b.severity !== "Critical") return -1;
      if (a.severity !== "Critical" && b.severity === "Critical") return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async resolveAlert(
    tenantId: string,
    alertId: string,
    resolution: string,
  ): Promise<{ success: boolean }> {
    // Log the resolution for audit purposes
    // In a real implementation, this would update the underlying entity
    console.log(
      `Alert ${alertId} resolved for tenant ${tenantId}: ${resolution}`,
    );
    return { success: true };
  }
}
