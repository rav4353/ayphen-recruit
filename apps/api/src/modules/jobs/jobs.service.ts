import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobQueryDto } from "./dto/job-query.dto";
import * as crypto from "crypto";
import { Prisma } from "@prisma/client";

import { JobBoardsService } from "../integrations/job-boards.service";
import { SettingsService } from "../settings/settings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { JobEditApprovalService } from "./job-edit-approval.service";

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobBoardsService: JobBoardsService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
    private readonly jobEditApprovalService: JobEditApprovalService,
  ) {}

  private uniqueIds(ids: Array<string | null | undefined>) {
    return Array.from(new Set(ids.filter(Boolean) as string[]));
  }

  async create(dto: CreateJobDto, tenantId: string, recruiterId: string) {
    // Validate that required ID settings are configured
    const idValidation = await this.settingsService.validateIdSettingsConfigured(
      tenantId,
      ["job_id_settings", "application_id_settings"],
    );
    if (!idValidation.valid) {
      const missingLabels = idValidation.missing.map((key) => {
        if (key === "job_id_settings") return "Job ID";
        if (key === "application_id_settings") return "Application ID";
        return key;
      });
      throw new BadRequestException(
        `The following settings must be configured before creating jobs: ${missingLabels.join(", ")}. Please configure in Settings > ID Configuration.`,
      );
    }

    const {
      departmentId: providedDepartmentId,
      department: departmentName,
      locationIds,
      hiringManagerId,
      pipelineId,
      scorecardTemplateId,
      employmentType,
      workLocation,
      status,
      ...jobData
    } = dto;

    let departmentId = providedDepartmentId;

    // Handle department name if provided and no ID
    if (!departmentId && departmentName) {
      const existingDept = await this.prisma.department.findUnique({
        where: {
          name_tenantId: {
            name: departmentName,
            tenantId,
          },
        },
      });

      if (existingDept) {
        departmentId = existingDept.id;
      } else {
        const newDept = await this.prisma.department.create({
          data: {
            name: departmentName,
            tenantId,
          },
        });
        departmentId = newDept.id;
      }
    }

    try {
      console.log("[JobsService] Creating job with data:", {
        ...jobData,
        tenantId,
        recruiterId: jobData.recruiterId || recruiterId,
        status: status || "DRAFT",
      });

      let jobCode = await this.generateJobCode(tenantId);
      let unique = false;
      while (!unique) {
        const existing = await this.prisma.job.findFirst({
          where: {
            jobCode,
            tenantId,
          },
        });
        if (!existing) unique = true;
        else jobCode = await this.generateJobCode(tenantId);
      }

      return await this.prisma.job.create({
        data: {
          ...jobData,
          jobCode,
          tenantId,
          recruiterId: jobData.recruiterId || recruiterId,
          status: status || "DRAFT",
          ...(employmentType && { employmentType }),
          ...(workLocation && { workLocation }),
          ...(departmentId && { departmentId }),
          ...(locationIds &&
            locationIds.length > 0 && {
              locations: {
                connect: locationIds.map((id) => ({ id })),
              },
            }),
          ...(hiringManagerId && { hiringManagerId }),
          ...(pipelineId && { pipelineId }),
          ...(scorecardTemplateId && { scorecardTemplateId }),
        },
        include: {
          department: true,
          locations: true,
          recruiter: true,
          hiringManager: true,
        },
      });
    } catch (error) {
      console.error("[JobsService] Failed to create job:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          const field = error.meta?.field_name as string;
          if (field?.includes("hiringManagerId")) {
            throw new BadRequestException(
              "Invalid Hiring Manager selected. The user may not exist.",
            );
          }
          if (field?.includes("recruiterId")) {
            throw new BadRequestException(
              "Invalid Recruiter selected. The user may not exist.",
            );
          }
          if (field?.includes("pipelineId")) {
            throw new BadRequestException(
              "Invalid Pipeline selected. The pipeline may not exist.",
            );
          }
          if (field?.includes("scorecardTemplateId")) {
            throw new BadRequestException(
              "Invalid Scorecard Template selected.",
            );
          }
          throw new BadRequestException(
            `Foreign key constraint failed on field: ${field}`,
          );
        }
        if (error.code === "P2002") {
          throw new BadRequestException(
            "A job with this unique code already exists. Please try again.",
          );
        }
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: JobQueryDto) {
    const where: Record<string, unknown> = { tenantId };

    // Apply filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.locationId) {
      where.locations = {
        some: { id: query.locationId },
      };
    }
    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }
    if (query.workLocation) {
      where.workLocation = query.workLocation;
    }

    // Apply search
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { requirements: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Build sort order
    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    const orderBy = { [sortField]: sortOrder };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          department: true,
          locations: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
          hiringManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { jobs, total };
  }

  async findAllPublic(tenantId: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        status: "OPEN",
        internalOnly: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        locations: true,
      },
    });
    return jobs;
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        department: true,
        locations: true,
        recruiter: true,
        hiringManager: true,
        pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
        approvals: {
          orderBy: { createdAt: "desc" }, // Show newest first to see complete history
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  async update(id: string, dto: UpdateJobDto, userId?: string) {
    const job = await this.findById(id);
    const {
      departmentId: providedDepartmentId,
      department: departmentName,
      locationIds,
      hiringManagerId,
      pipelineId,
      employmentType,
      workLocation,
      ...jobData
    } = dto;

    // Check if edit approval is needed for approved jobs
    if (userId && ['APPROVED', 'OPEN', 'PUBLISHED'].includes(job.status)) {
      const changedFields = Object.keys(dto).filter(
        (key) => dto[key as keyof UpdateJobDto] !== undefined
      );

      const approvalCheck = await this.jobEditApprovalService.requiresApproval(
        job.tenantId,
        id,
        changedFields,
      );

      if (approvalCheck.required) {
        // Create pending edits instead of directly updating
        const changes = approvalCheck.fieldsNeedingApproval.map((fieldName) => ({
          fieldName,
          oldValue: (job as any)[fieldName],
          newValue: dto[fieldName as keyof UpdateJobDto],
        }));

        await this.jobEditApprovalService.createPendingEdits(
          id,
          userId,
          job.tenantId,
          changes,
        );

        // Filter out fields that need approval from the direct update
        const fieldsToUpdateDirectly = Object.keys(dto).filter(
          (key) => !approvalCheck.fieldsNeedingApproval.includes(key)
        );

        if (fieldsToUpdateDirectly.length === 0) {
          // All changes require approval, return job with pending edits info
          return {
            ...job,
            _pendingEdits: true,
            _pendingEditFields: approvalCheck.fieldsNeedingApproval,
          };
        }

        // Only update fields that don't require approval
        const filteredDto: any = {};
        fieldsToUpdateDirectly.forEach((key) => {
          filteredDto[key] = dto[key as keyof UpdateJobDto];
        });

        // Recursively call update with filtered dto (will not trigger approval again since fields are filtered)
        const result = await this.directUpdate(id, filteredDto, job);
        return {
          ...result,
          _pendingEdits: true,
          _pendingEditFields: approvalCheck.fieldsNeedingApproval,
        };
      }
    }

    return this.directUpdate(id, dto, job);
  }

  private async directUpdate(id: string, dto: UpdateJobDto, job?: any) {
    if (!job) {
      job = await this.findById(id);
    }

    const {
      departmentId: providedDepartmentId,
      department: departmentName,
      locationIds,
      hiringManagerId,
      pipelineId,
      employmentType,
      workLocation,
      ...jobData
    } = dto;

    let departmentId = providedDepartmentId;

    if (departmentName && departmentId === undefined) {
      const existingDept = await this.prisma.department.findUnique({
        where: {
          name_tenantId: {
            name: departmentName,
            tenantId: job.tenantId,
          },
        },
      });

      if (existingDept) {
        departmentId = existingDept.id;
      } else {
        const newDept = await this.prisma.department.create({
          data: {
            name: departmentName,
            tenantId: job.tenantId,
          },
        });
        departmentId = newDept.id;
      }
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        ...jobData,
        ...(employmentType && { employmentType }),
        ...(workLocation && { workLocation }),
        ...(departmentId !== undefined && { departmentId }),
        ...(locationIds !== undefined && {
          locations: {
            set: locationIds.map((id) => ({ id })),
          },
        }),
        ...(hiringManagerId !== undefined && { hiringManagerId }),
        ...(pipelineId !== undefined && { pipelineId }),
      },
      include: {
        department: true,
        locations: true,
        recruiter: true,
        hiringManager: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    const data: Record<string, unknown> = { status };

    if (status === "OPEN") {
      data.publishedAt = new Date();
    }

    return this.prisma.job.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.job.delete({ where: { id } });
  }

  async clone(id: string, tenantId: string, recruiterId: string) {
    const job = await this.findById(id);

    return this.prisma.job.create({
      data: {
        title: `${job.title} (Copy)`,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        employmentType: job.employmentType,
        workLocation: job.workLocation,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        showSalary: job.showSalary,
        openings: job.openings,
        skills: job.skills,
        experience: job.experience,
        education: job.education,
        internalOnly: job.internalOnly,
        status: "DRAFT",
        tenantId,
        recruiterId,
        departmentId: job.departmentId,
        locations: {
          connect: job.locations.map((l) => ({ id: l.id })),
        },
        hiringManagerId: job.hiringManagerId,
        pipelineId: job.pipelineId,
      },
    });
  }

  async export(tenantId: string, query: JobQueryDto): Promise<string> {
    const where: Record<string, unknown> = { tenantId };

    // Apply filters (same as findAll)
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.locationId) {
      where.locations = {
        some: { id: query.locationId },
      };
    }
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.workLocation) where.workLocation = query.workLocation;
    if (query.ids && query.ids.length > 0) {
      where.id = { in: query.ids };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { requirements: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    const orderBy = { [sortField]: sortOrder };

    const jobs = await this.prisma.job.findMany({
      where,
      orderBy,
      include: {
        department: true,
        locations: true,
        recruiter: { select: { firstName: true, lastName: true } },
        hiringManager: { select: { firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
    });

    // Generate CSV
    const header = [
      "Job ID",
      "Title",
      "Status",
      "Department",
      "Location",
      "Employment Type",
      "Work Location",
      "Salary Min",
      "Salary Max",
      "Currency",
      "Recruiter",
      "Hiring Manager",
      "Applicants",
      "Created At",
    ].join(",");

    const rows = jobs.map((job) => {
      const recruiterName = job.recruiter
        ? `${job.recruiter.firstName} ${job.recruiter.lastName}`
        : "";
      const hmName = job.hiringManager
        ? `${job.hiringManager.firstName} ${job.hiringManager.lastName}`
        : "";

      return [
        job.id,
        `"${job.title.replace(/"/g, '""')}"`,
        job.status,
        `"${(job.department?.name || "").replace(/"/g, '""')}"`,
        `"${(job.locations?.map((l) => l.name).join(", ") || "").replace(/"/g, '""')}"`,
        job.employmentType,
        job.workLocation,
        job.salaryMin || "",
        job.salaryMax || "",
        job.salaryCurrency,
        `"${recruiterName}"`,
        `"${hmName}"`,
        job._count?.applications || 0,
        job.createdAt.toISOString(),
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }

  async submitForApproval(
    id: string,
    approverIds: string[],
    userId: string,
    comment?: string,
  ) {
    console.log(
      `[JobsService] Submitting job ${id} for approval. User: ${userId}, Approvers: ${approverIds}`,
    );
    const job = await this.findById(id);

    if (
      job.status !== "DRAFT" &&
      job.status !== "PENDING_APPROVAL" &&
      job.status !== "REJECTED"
    ) {
      console.warn(`[JobsService] Invalid status for approval: ${job.status}`);
      throw new BadRequestException(
        "Only draft or rejected jobs can be submitted for approval",
      );
    }

    let finalApproverIds = approverIds || [];

    if (finalApproverIds.length === 0) {
      try {
        // Try to fetch approval workflows from settings
        const setting = await this.settingsService.getSettingByKey(
          job.tenantId,
          "approval_workflows",
        );
        const workflows = setting?.value as any[];

        if (workflows && workflows.length > 0) {
          // Prioritize 'Job Requisition Approval' or similar, otherwise take the first one
          const jobWorkflow =
            workflows.find(
              (w) => w.name.includes("Job") || w.name.includes("Requisition"),
            ) || workflows[0];

          if (jobWorkflow && jobWorkflow.steps?.length > 0) {
            console.log(
              `[JobsService] Using approval workflow: ${jobWorkflow.name}`,
            );

            // Extract user IDs from steps
            finalApproverIds = jobWorkflow.steps
              .map((step: any) => {
                // Handle new format (object with userId)
                if (typeof step === "object" && step.userId) {
                  return step.userId;
                }
                // Handle old format (string role name) - this is tricky without role resolution,
                // but we'll return null and filter it out, falling back to other methods if needed
                return null;
              })
              .filter(Boolean);

            if (finalApproverIds.length === 0) {
              console.warn(
                "[JobsService] Workflow found but no valid user IDs in steps",
              );
            }
          }
        }
      } catch (error) {
        console.warn(
          "[JobsService] Failed to fetch approval workflows setting:",
          error,
        );
      }
    }

    if (finalApproverIds.length === 0) {
      if (job.hiringManagerId) {
        console.log(
          `[JobsService] Using hiring manager ${job.hiringManagerId} as approver`,
        );
        finalApproverIds = [job.hiringManagerId];
      } else if (job.recruiterId) {
        console.log(
          `[JobsService] Using recruiter ${job.recruiterId} as fallback approver`,
        );
        finalApproverIds = [job.recruiterId];
      } else {
        console.error(
          "[JobsService] No approvers provided and no hiring manager found",
        );
        throw new BadRequestException("At least one approver is required");
      }
    }

    // Log existing approvals before deletion
    const existingApprovals = await this.prisma.jobApproval.findMany({
      where: { jobId: id },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        approverId: true,
      },
    });
    console.log(
      `[JobsService] Existing approvals before deletion:`,
      JSON.stringify(existingApprovals, null, 2),
    );

    // Only clear existing PENDING approvals (keep REJECTED and APPROVED for history)
    const deleteResult = await this.prisma.jobApproval.deleteMany({
      where: { jobId: id, status: "PENDING" },
    });
    console.log(
      `[JobsService] Deleted ${deleteResult.count} PENDING approvals`,
    );

    // Log remaining approvals after deletion
    const remainingApprovals = await this.prisma.jobApproval.findMany({
      where: { jobId: id },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        approverId: true,
      },
    });
    console.log(
      `[JobsService] Remaining approvals after deletion:`,
      JSON.stringify(remainingApprovals, null, 2),
    );

    // Create new approvals with resubmission comment if provided
    try {
      await this.prisma.jobApproval.createMany({
        data: finalApproverIds.map((approverId, index) => ({
          jobId: id,
          approverId,
          order: index + 1,
          status: "PENDING",
          resubmissionComment: comment || null,
        })),
      });
    } catch (error) {
      console.error("[JobsService] Failed to create job approvals:", error);
      throw error;
    }

    try {
      const finalApproverIds = (
        await this.prisma.jobApproval.findMany({
          where: { jobId: id, status: "PENDING" },
          select: { approverId: true },
        })
      ).map((a) => a.approverId);

      await Promise.all(
        finalApproverIds.map((approverId) =>
          this.notificationsService.notifyApprovalRequest(
            "job",
            job,
            approverId,
            job.tenantId,
          ),
        ),
      );
    } catch (error) {
      console.error("[JobsService] Failed to notify job approvers:", error);
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
      include: { approvals: true },
    });
  }

  async approve(
    id: string,
    userId: string,
    status: "APPROVED" | "REJECTED",
    comment?: string,
    rejectionReason?: string,
  ) {
    const job = await this.findById(id);
    const approval = await this.prisma.jobApproval.findFirst({
      where: { jobId: id, approverId: userId, status: "PENDING" },
    });

    if (!approval) {
      throw new BadRequestException("No pending approval found for this user");
    }

    // Validate rejection reason is provided when rejecting
    if (status === "REJECTED" && !rejectionReason) {
      throw new BadRequestException(
        "Rejection reason is required when rejecting",
      );
    }

    console.log(
      `[JobsService] Approving/Rejecting approval ${approval.id} for job ${id}, status: ${status}, reason: ${rejectionReason}`,
    );

    const now = new Date();
    await this.prisma.jobApproval.update({
      where: { id: approval.id },
      data: {
        status,
        approvedAt: status === "APPROVED" ? now : null,
        rejectedAt: status === "REJECTED" ? now : null,
        reviewedAt: now,
        comment,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    if (status === "REJECTED") {
      // If rejected, set job status to REJECTED
      await this.prisma.job.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      try {
        const recipientIds = this.uniqueIds([
          job.recruiterId,
          job.hiringManagerId,
        ]).filter((rid) => rid !== userId);

        if (recipientIds.length > 0) {
          await this.notificationsService.notifyJobStatusChange(
            job,
            "REJECTED",
            recipientIds,
            job.tenantId,
          );
        }
      } catch (error) {
        console.error("[JobsService] Failed to notify job rejection:", error);
      }
    } else {
      // Check if all approvals are done
      const pendingCount = await this.prisma.jobApproval.count({
        where: { jobId: id, status: "PENDING" },
      });

      if (pendingCount === 0) {
        await this.prisma.job.update({
          where: { id },
          data: { status: "APPROVED" },
        });
      }

      try {
        const recipientIds = this.uniqueIds([
          job.recruiterId,
          job.hiringManagerId,
        ]).filter((rid) => rid !== userId);

        if (recipientIds.length > 0) {
          await this.notificationsService.notifyJobStatusChange(
            job,
            pendingCount === 0 ? "APPROVED" : "PENDING_APPROVAL",
            recipientIds,
            job.tenantId,
          );
        }
      } catch (error) {
        console.error(
          "[JobsService] Failed to notify job approval status:",
          error,
        );
      }
    }

    return this.findById(id);
  }

  async publish(id: string, channels: string[]) {
    const job = await this.findById(id);
    if (job.status !== "APPROVED" && job.status !== "OPEN") {
      throw new BadRequestException("Job must be approved before publishing");
    }

    const results: Record<string, string> = {};

    if (channels.includes("LINKEDIN")) {
      results.linkedin = await this.jobBoardsService.postToLinkedIn(job);
    }
    if (channels.includes("INDEED")) {
      results.indeed = await this.jobBoardsService.postToIndeed(job);
    }
    if (channels.includes("INTERNAL")) {
      results.internal = this.jobBoardsService.generatePublicUrl(job);
    }

    // Update status to OPEN
    await this.prisma.job.update({
      where: { id },
      data: {
        status: "OPEN",
        publishedAt: new Date(),
      },
    });

    try {
      const recipientIds = this.uniqueIds([
        job.recruiterId,
        job.hiringManagerId,
      ]);

      if (recipientIds.length > 0) {
        await this.notificationsService.notifyJobStatusChange(
          job,
          "OPEN",
          recipientIds,
          job.tenantId,
        );
      }
    } catch (error) {
      console.error("[JobsService] Failed to notify job publish:", error);
    }

    return { job: await this.findById(id), results };
  }

  private async enrichJobWithStatusColor(job: any, tenantId: string) {
    try {
      const statusColors: any =
        await this.settingsService.getStatusColors(tenantId);
      const jobStatusColors =
        (statusColors &&
          typeof statusColors === "object" &&
          statusColors.job) ||
        {};
      const colorConfig = jobStatusColors[job.status] || {
        bg: "#F3F4F6",
        text: "#374151",
      };

      return {
        ...job,
        statusInfo: {
          name: job.status,
          code: job.status,
          fontColor: colorConfig.text,
          bgColor: colorConfig.bg,
          borderColor: colorConfig.text,
        },
      };
    } catch (error) {
      // Fallback to default colors if settings fetch fails
      return {
        ...job,
        statusInfo: {
          name: job.status,
          code: job.status,
          fontColor: "#374151",
          bgColor: "#F3F4F6",
          borderColor: "#374151",
        },
      };
    }
  }

  async enrichJobsWithStatusColors(jobs: any[], tenantId: string) {
    return Promise.all(
      jobs.map((job) => this.enrichJobWithStatusColor(job, tenantId)),
    );
  }
  async generateXmlFeed(tenantId: string) {
    // Get tenant branding settings
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, domain: true },
    });

    // Get company info from settings
    let companyName = tenant?.name || "Company";
    let companyUrl = tenant?.domain || "https://careers.example.com";

    try {
      const companySetting = await this.settingsService.getSettingByKey(
        tenantId,
        "company_info",
      );
      if (companySetting?.value) {
        const companyInfo = companySetting.value as {
          name?: string;
          website?: string;
        };
        if (companyInfo.name) companyName = companyInfo.name;
        if (companyInfo.website) companyUrl = companyInfo.website;
      }
    } catch {
      // Use defaults if setting not found
    }

    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        status: "OPEN",
      },
      include: {
        department: true,
        locations: true,
      },
    });

    // Simple XML generation for Indeed/ZipRecruiter
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += "<source>\n";
    xml += `  <publisher>${companyName}</publisher>\n`;
    xml += `  <publisherurl>${companyUrl}</publisherurl>\n`;
    xml += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

    for (const job of jobs) {
      const jobUrl = `${companyUrl}/careers/${tenantId}/jobs/${job.id}`;
      xml += "  <job>\n";
      xml += `    <title><![CDATA[${job.title}]]></title>\n`;
      xml += `    <date><![CDATA[${job.createdAt.toUTCString()}]]></date>\n`;
      xml += `    <referencenumber><![CDATA[${job.id}]]></referencenumber>\n`;
      xml += `    <url><![CDATA[${jobUrl}]]></url>\n`;
      xml += `    <company><![CDATA[${companyName}]]></company>\n`;
      xml += `    <city><![CDATA[${job.locations?.[0]?.city || ""}]]></city>\n`;
      xml += `    <state><![CDATA[${job.locations?.[0]?.state || ""}]]></state>\n`;
      xml += `    <country><![CDATA[${job.locations?.[0]?.country || ""}]]></country>\n`;
      xml += `    <description><![CDATA[${job.description}]]></description>\n`;
      if (job.showSalary && job.salaryMin && job.salaryMax) {
        xml += `    <salary><![CDATA[${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}]]></salary>\n`;
      }
      xml += `    <jobtype><![CDATA[${job.employmentType}]]></jobtype>\n`;
      xml += `    <category><![CDATA[${job.department?.name || ""}]]></category>\n`;
      xml += "  </job>\n";
    }

    xml += "</source>";
    return xml;
  }

  private async generateJobCode(tenantId: string): Promise<string> {
    try {
      const setting = await this.settingsService
        .getSettingByKey(tenantId, "job_id_settings")
        .catch(() => null);

      if (setting && setting.value) {
        const config = setting.value as any;
        const prefix = config.prefix || "JOB";
        const minDigits = config.minDigits || 6;

        if (config.type === "sequential") {
          return await this.prisma.$transaction(async (tx) => {
            const currentSetting = await tx.setting.findUnique({
              where: {
                tenantId_key: { tenantId, key: "job_id_settings" },
              },
            });

            const currentConfig = currentSetting?.value as any;
            const nextNumber = currentConfig?.nextNumber || 1;

            await tx.setting.update({
              where: {
                tenantId_key: { tenantId, key: "job_id_settings" },
              },
              data: {
                value: {
                  ...currentConfig,
                  nextNumber: nextNumber + 1,
                },
              },
            });

            const numberStr = nextNumber.toString().padStart(minDigits, "0");
            return `${prefix}-${numberStr}`;
          });
        } else {
          // Custom prefix with random number
          const randomNum = crypto.randomInt(
            Math.pow(10, minDigits - 1),
            Math.pow(10, minDigits) - 1,
          );
          return `${prefix}-${randomNum}`;
        }
      }
    } catch (error) {
      console.error("Error generating custom job code:", error);
    }

    // Default fallback
    const randomNum = crypto.randomInt(100000, 999999);
    return `JOB-${randomNum}`;
  }

  /**
   * Create a job requisition (request to hire)
   */
  async createRequisition(
    tenantId: string,
    userId: string,
    data: {
      title: string;
      departmentId?: string;
      locationId?: string;
      headcount: number;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      targetStartDate?: Date;
      justification: string;
      budgetApproved?: boolean;
      salaryRange?: { min: number; max: number; currency: string };
      skills?: string[];
      employmentType?: string;
    },
  ) {
    const requisitionId = `REQ-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Create requisition as activity log entry
    const requisition = await this.prisma.activityLog.create({
      data: {
        action: "REQUISITION_CREATED",
        description: `Job requisition created: ${data.title}`,
        userId,
        metadata: {
          requisitionId,
          tenantId,
          ...data,
          status: "PENDING_APPROVAL",
          createdBy: userId,
          createdAt: new Date().toISOString(),
          approvals: [],
          history: [
            {
              action: "CREATED",
              userId,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
    });

    return {
      id: requisitionId,
      title: data.title,
      headcount: data.headcount,
      priority: data.priority,
      status: "PENDING_APPROVAL",
      createdAt: requisition.createdAt,
    };
  }

  /**
   * Get all requisitions for a tenant
   */
  async getRequisitions(
    tenantId: string,
    filters?: {
      status?: string;
      departmentId?: string;
      priority?: string;
    },
  ) {
    const requisitionLogs = await this.prisma.activityLog.findMany({
      where: {
        action: "REQUISITION_CREATED",
        metadata: {
          path: ["tenantId"],
          equals: tenantId,
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get latest state of each requisition
    const requisitionMap = new Map<string, any>();
    for (const log of requisitionLogs) {
      const metadata = log.metadata as any;
      if (!requisitionMap.has(metadata.requisitionId)) {
        requisitionMap.set(metadata.requisitionId, {
          ...metadata,
          createdAt: log.createdAt,
          createdBy: log.user,
        });
      }
    }

    let requisitions = Array.from(requisitionMap.values());

    // Apply filters
    if (filters?.status) {
      requisitions = requisitions.filter((r) => r.status === filters.status);
    }
    if (filters?.departmentId) {
      requisitions = requisitions.filter(
        (r) => r.departmentId === filters.departmentId,
      );
    }
    if (filters?.priority) {
      requisitions = requisitions.filter(
        (r) => r.priority === filters.priority,
      );
    }

    // Get department and location details
    const departmentIds = requisitions
      .map((r) => r.departmentId)
      .filter(Boolean);
    const locationIds = requisitions.map((r) => r.locationId).filter(Boolean);

    const [departments, locations] = await Promise.all([
      departmentIds.length > 0
        ? this.prisma.department.findMany({
            where: { id: { in: departmentIds } },
          })
        : [],
      locationIds.length > 0
        ? this.prisma.location.findMany({ where: { id: { in: locationIds } } })
        : [],
    ]);

    const deptMap = new Map<string, any>(
      departments.map((d) => [d.id, d] as [string, any]),
    );
    const locMap = new Map<string, any>(
      locations.map((l) => [l.id, l] as [string, any]),
    );

    return requisitions.map((r) => ({
      id: r.requisitionId,
      title: r.title,
      headcount: r.headcount,
      priority: r.priority,
      status: r.status,
      targetStartDate: r.targetStartDate,
      justification: r.justification,
      budgetApproved: r.budgetApproved,
      salaryRange: r.salaryRange,
      department: r.departmentId ? deptMap.get(r.departmentId) : null,
      location: r.locationId ? locMap.get(r.locationId) : null,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      linkedJobId: r.linkedJobId,
    }));
  }

  /**
   * Update requisition status (approve/reject)
   */
  async updateRequisitionStatus(
    requisitionId: string,
    tenantId: string,
    userId: string,
    action: "APPROVE" | "REJECT" | "CANCEL",
    notes?: string,
  ) {
    // Find the requisition
    const requisitionLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "REQUISITION_CREATED",
        metadata: {
          path: ["requisitionId"],
          equals: requisitionId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!requisitionLog) {
      throw new NotFoundException("Requisition not found");
    }

    const currentMetadata = requisitionLog.metadata as any;

    const newStatus =
      action === "APPROVE"
        ? "APPROVED"
        : action === "REJECT"
          ? "REJECTED"
          : "CANCELLED";

    const updatedMetadata = {
      ...currentMetadata,
      status: newStatus,
      history: [
        ...(currentMetadata.history || []),
        {
          action: action,
          userId,
          notes,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Create update log
    await this.prisma.activityLog.create({
      data: {
        action: "REQUISITION_CREATED",
        description: `Requisition ${action.toLowerCase()}ed: ${currentMetadata.title}`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return {
      id: requisitionId,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert approved requisition to job posting
   */
  async convertRequisitionToJob(
    requisitionId: string,
    tenantId: string,
    userId: string,
    additionalData?: Partial<CreateJobDto>,
  ) {
    // Find the requisition
    const requisitionLog = await this.prisma.activityLog.findFirst({
      where: {
        action: "REQUISITION_CREATED",
        metadata: {
          path: ["requisitionId"],
          equals: requisitionId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!requisitionLog) {
      throw new NotFoundException("Requisition not found");
    }

    const reqData = requisitionLog.metadata as any;

    if (reqData.status !== "APPROVED") {
      throw new BadRequestException(
        "Only approved requisitions can be converted to jobs",
      );
    }

    // Create job from requisition
    const jobDto: CreateJobDto = {
      title: reqData.title,
      description:
        additionalData?.description || `Position for ${reqData.title}`,
      departmentId: reqData.departmentId,
      locationIds: reqData.locationId ? [reqData.locationId] : [],
      employmentType: reqData.employmentType || "FULL_TIME",
      skills: reqData.skills || [],
      salaryMin: reqData.salaryRange?.min,
      salaryMax: reqData.salaryRange?.max,
      salaryCurrency: reqData.salaryRange?.currency || "USD",
      openings: reqData.headcount,
      status: "DRAFT",
      ...additionalData,
    };

    const job = await this.create(jobDto, tenantId, userId);

    // Update requisition with linked job
    const updatedMetadata = {
      ...reqData,
      linkedJobId: job.id,
      status: "CONVERTED",
      history: [
        ...(reqData.history || []),
        {
          action: "CONVERTED_TO_JOB",
          userId,
          jobId: job.id,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.prisma.activityLog.create({
      data: {
        action: "REQUISITION_CREATED",
        description: `Requisition converted to job: ${reqData.title}`,
        userId,
        metadata: updatedMetadata,
      },
    });

    return {
      requisitionId,
      jobId: job.id,
      jobTitle: job.title,
      message: "Requisition successfully converted to job posting",
    };
  }

  /**
   * Get requisition statistics
   */
  async getRequisitionStats(tenantId: string) {
    const requisitions = await this.getRequisitions(tenantId);

    const stats = {
      total: requisitions.length,
      byStatus: {
        pending: requisitions.filter((r) => r.status === "PENDING_APPROVAL")
          .length,
        approved: requisitions.filter((r) => r.status === "APPROVED").length,
        rejected: requisitions.filter((r) => r.status === "REJECTED").length,
        converted: requisitions.filter((r) => r.status === "CONVERTED").length,
        cancelled: requisitions.filter((r) => r.status === "CANCELLED").length,
      },
      byPriority: {
        urgent: requisitions.filter((r) => r.priority === "URGENT").length,
        high: requisitions.filter((r) => r.priority === "HIGH").length,
        medium: requisitions.filter((r) => r.priority === "MEDIUM").length,
        low: requisitions.filter((r) => r.priority === "LOW").length,
      },
      totalHeadcount: requisitions.reduce(
        (sum, r) => sum + (r.headcount || 0),
        0,
      ),
      pendingHeadcount: requisitions
        .filter(
          (r) => r.status === "PENDING_APPROVAL" || r.status === "APPROVED",
        )
        .reduce((sum, r) => sum + (r.headcount || 0), 0),
    };

    return stats;
  }
}
