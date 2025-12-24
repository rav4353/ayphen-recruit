import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationStatus } from "@prisma/client";

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  jobId?: string;
  recruiterId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCustomReport(tenantId: string, filters: ReportFilters) {
    const { startDate, endDate, jobId, recruiterId } = filters;

    const where: any = {
      job: { tenantId },
    };

    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate);
      if (endDate) where.appliedAt.lte = new Date(endDate);
    }

    if (jobId) {
      where.jobId = jobId;
    }

    // Note: Filtering by recruiterId might need to be on the Job (hiringManager/recruiter) or Application (assignedTo)
    // For now, let's assume filtering by the recruiter assigned to the job
    if (recruiterId) {
      where.job = {
        ...where.job,
        recruiterId,
      };
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            title: true,
            department: true,
          },
        },
        candidate: {
          select: {
            source: true,
          },
        },
      },
    });

    // Aggregations
    const totalApplications = applications.length;

    const byStatus = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byJob = applications.reduce(
      (acc, app) => {
        const jobTitle = app.job.title;
        acc[jobTitle] = (acc[jobTitle] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const bySource = applications.reduce(
      (acc, app) => {
        const source = app.candidate.source || "Unknown";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const hires = applications.filter(
      (app) => app.status === ApplicationStatus.HIRED,
    ).length;
    const rejected = applications.filter(
      (app) => app.status === ApplicationStatus.REJECTED,
    ).length;

    return {
      totalApplications,
      hires,
      rejected,
      conversionRate:
        totalApplications > 0 ? (hires / totalApplications) * 100 : 0,
      byStatus,
      byJob,
      bySource,
    };
  }

  async exportReportCsv(
    tenantId: string,
    filters: ReportFilters,
  ): Promise<string> {
    const { startDate, endDate, jobId, recruiterId } = filters;

    const where: any = {
      job: { tenantId },
    };

    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate);
      if (endDate) where.appliedAt.lte = new Date(endDate);
    }

    if (jobId) where.jobId = jobId;
    if (recruiterId) where.job = { ...where.job, recruiterId };

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            title: true,
            department: true,
            recruiter: {
              select: { firstName: true, lastName: true, email: true }
            },
            hiringManager: {
              select: { firstName: true, lastName: true }
            }
          },
        },
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            source: true,
          },
        },
        currentStage: {
          select: { name: true }
        }
      },
      orderBy: { appliedAt: "desc" },
    });

    const flattenedData = applications.map((app: any) => ({
      "Application ID": app.id,
      "Candidate Name": `${app.candidate.firstName} ${app.candidate.lastName}`,
      "Candidate Email": app.candidate.email,
      "Candidate Phone": app.candidate.phone || "N/A",
      "Job Title": app.job.title,
      "Department": app.job.department?.name || "N/A",
      "Stage": app.currentStage?.name || "N/A",
      "Status": app.status,
      "Rejection Reason": app.rejectionReason || "N/A",
      "Source": app.candidate.source || "Unknown",
      "Recruiter": app.job.recruiter ? `${app.job.recruiter.firstName} ${app.job.recruiter.lastName}` : "N/A",
      "Hiring Manager": app.job.hiringManager ? `${app.job.hiringManager.firstName} ${app.job.hiringManager.lastName}` : "N/A",
      "Applied Date": app.appliedAt.toISOString().split("T")[0],
    }));

    // Use require to load json2csv
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Parser } = require("json2csv");
    const parser = new Parser();
    return parser.parse(flattenedData);
  }
}
