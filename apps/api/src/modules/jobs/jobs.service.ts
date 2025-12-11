import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';

import { JobBoardsService } from '../integrations/job-boards.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobBoardsService: JobBoardsService,
    private readonly settingsService: SettingsService,
  ) { }

  async create(dto: CreateJobDto, tenantId: string, recruiterId: string) {
    const {
      departmentId: providedDepartmentId,
      department: departmentName,
      locationId,
      hiringManagerId,
      pipelineId,
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
      console.log('[JobsService] Creating job with data:', {
        ...jobData,
        tenantId,
        recruiterId: jobData.recruiterId || recruiterId,
        status: status || 'DRAFT',
      });

      let jobCode = await this.generateJobCode();
      let unique = false;
      while (!unique) {
        const existing = await this.prisma.job.findUnique({ where: { jobCode } });
        if (!existing) unique = true;
        else jobCode = await this.generateJobCode();
      }

      return await this.prisma.job.create({
        data: {
          ...jobData,
          jobCode,
          tenantId,
          recruiterId: jobData.recruiterId || recruiterId,
          status: status || 'DRAFT',
          ...(employmentType && { employmentType }),
          ...(workLocation && { workLocation }),
          ...(departmentId && { departmentId }),
          ...(locationId && { locationId }),
          ...(hiringManagerId && { hiringManagerId }),
          ...(pipelineId && { pipelineId }),
        },
        include: {
          department: true,
          location: true,
          recruiter: true,
          hiringManager: true,
        },
      });
    } catch (error) {
      console.error('[JobsService] Failed to create job:', error);
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
      where.locationId = query.locationId;
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
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { requirements: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build sort order
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortField]: sortOrder };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          department: true,
          location: true,
          recruiter: { select: { id: true, firstName: true, lastName: true } },
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
        status: 'OPEN',
        internalOnly: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        location: true,
      },
    });
    return jobs;
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        department: true,
        location: true,
        recruiter: true,
        hiringManager: true,
        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
        approvals: {
          orderBy: { order: 'asc' },
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async update(id: string, dto: UpdateJobDto) {
    const job = await this.findById(id);
    const {
      departmentId: providedDepartmentId,
      department: departmentName,
      locationId,
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
        ...(locationId !== undefined && { locationId }),
        ...(hiringManagerId !== undefined && { hiringManagerId }),
        ...(pipelineId !== undefined && { pipelineId }),
      },
      include: {
        department: true,
        location: true,
        recruiter: true,
        hiringManager: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    const data: Record<string, unknown> = { status };

    if (status === 'OPEN') {
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
        status: 'DRAFT',
        tenantId,
        recruiterId,
        departmentId: job.departmentId,
        locationId: job.locationId,
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
    if (query.locationId) where.locationId = query.locationId;
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.workLocation) where.workLocation = query.workLocation;
    if (query.ids && query.ids.length > 0) {
      where.id = { in: query.ids };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { requirements: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortField]: sortOrder };

    const jobs = await this.prisma.job.findMany({
      where,
      orderBy,
      include: {
        department: true,
        location: true,
        recruiter: { select: { firstName: true, lastName: true } },
        hiringManager: { select: { firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
    });

    // Generate CSV
    const header = [
      'Job ID',
      'Title',
      'Status',
      'Department',
      'Location',
      'Employment Type',
      'Work Location',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Recruiter',
      'Hiring Manager',
      'Applicants',
      'Created At',
    ].join(',');

    const rows = jobs.map((job) => {
      const recruiterName = job.recruiter
        ? `${job.recruiter.firstName} ${job.recruiter.lastName}`
        : '';
      const hmName = job.hiringManager
        ? `${job.hiringManager.firstName} ${job.hiringManager.lastName}`
        : '';

      return [
        job.id,
        `"${job.title.replace(/"/g, '""')}"`,
        job.status,
        `"${(job.department?.name || '').replace(/"/g, '""')}"`,
        `"${(job.location?.name || '').replace(/"/g, '""')}"`,
        job.employmentType,
        job.workLocation,
        job.salaryMin || '',
        job.salaryMax || '',
        job.salaryCurrency,
        `"${recruiterName}"`,
        `"${hmName}"`,
        job._count?.applications || 0,
        job.createdAt.toISOString(),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async submitForApproval(id: string, approverIds: string[], userId: string) {
    console.log(`[JobsService] Submitting job ${id} for approval. User: ${userId}, Approvers: ${approverIds}`);
    const job = await this.findById(id);

    if (job.status !== 'DRAFT' && job.status !== 'PENDING_APPROVAL') {
      console.warn(`[JobsService] Invalid status for approval: ${job.status}`);
      throw new BadRequestException('Only draft jobs can be submitted for approval');
    }

    let finalApproverIds = approverIds || [];
    if (finalApproverIds.length === 0) {
      if (job.hiringManagerId) {
        console.log(`[JobsService] Using hiring manager ${job.hiringManagerId} as approver`);
        finalApproverIds = [job.hiringManagerId];
      } else if (job.recruiterId) {
        console.log(`[JobsService] Using recruiter ${job.recruiterId} as fallback approver`);
        finalApproverIds = [job.recruiterId];
      } else {
        console.error('[JobsService] No approvers provided and no hiring manager found');
        throw new BadRequestException('At least one approver is required');
      }
    }

    // Clear existing pending approvals
    await this.prisma.jobApproval.deleteMany({
      where: { jobId: id, status: 'PENDING' }
    });

    // Create new approvals
    try {
      await this.prisma.jobApproval.createMany({
        data: finalApproverIds.map((approverId, index) => ({
          jobId: id,
          approverId,
          order: index + 1,
          status: 'PENDING'
        }))
      });
    } catch (error) {
      console.error('[JobsService] Failed to create job approvals:', error);
      throw error;
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
      include: { approvals: true }
    });
  }

  async approve(id: string, userId: string, comment?: string) {
    const approval = await this.prisma.jobApproval.findFirst({
      where: { jobId: id, approverId: userId, status: 'PENDING' }
    });

    if (!approval) {
      throw new BadRequestException('No pending approval found for this user');
    }

    await this.prisma.jobApproval.update({
      where: { id: approval.id },
      data: { status: 'APPROVED', approvedAt: new Date(), comment }
    });

    const pendingCount = await this.prisma.jobApproval.count({
      where: { jobId: id, status: 'PENDING' }
    });

    if (pendingCount === 0) {
      await this.prisma.job.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
    }

    return this.findById(id);
  }

  async reject(id: string, userId: string, reason: string) {
    const approval = await this.prisma.jobApproval.findFirst({
      where: { jobId: id, approverId: userId, status: 'PENDING' }
    });

    if (!approval) {
      throw new BadRequestException('No pending approval found for this user');
    }

    await this.prisma.jobApproval.update({
      where: { id: approval.id },
      data: { status: 'REJECTED', approvedAt: new Date(), comment: reason }
    });

    return this.prisma.job.update({
      where: { id },
      data: { status: 'DRAFT' }
    });
  }

  async publish(id: string, channels: string[]) {
    const job = await this.findById(id);
    if (job.status !== 'APPROVED' && job.status !== 'OPEN') {
      throw new BadRequestException('Job must be approved before publishing');
    }

    const results: Record<string, string> = {};

    if (channels.includes('LINKEDIN')) {
      results.linkedin = await this.jobBoardsService.postToLinkedIn(job);
    }
    if (channels.includes('INDEED')) {
      results.indeed = await this.jobBoardsService.postToIndeed(job);
    }
    if (channels.includes('INTERNAL')) {
      results.internal = this.jobBoardsService.generatePublicUrl(job);
    }

    // Update status to OPEN
    await this.prisma.job.update({
      where: { id },
      data: {
        status: 'OPEN',
        publishedAt: new Date(),
      }
    });

    return { job: await this.findById(id), results };
  }

  private async enrichJobWithStatusColor(job: any, tenantId: string) {
    try {
      const statusColors: any = await this.settingsService.getStatusColors(tenantId);
      const jobStatusColors = (statusColors && typeof statusColors === 'object' && statusColors.job) || {};
      const colorConfig = jobStatusColors[job.status] || { bg: '#F3F4F6', text: '#374151' };

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
          fontColor: '#374151',
          bgColor: '#F3F4F6',
          borderColor: '#374151',
        },
      };
    }
  }

  async enrichJobsWithStatusColors(jobs: any[], tenantId: string) {
    return Promise.all(jobs.map(job => this.enrichJobWithStatusColor(job, tenantId)));
  }
  async generateXmlFeed(tenantId: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        status: 'OPEN',
      },
      include: {
        department: true,
        location: true,
      },
    });

    // Simple XML generation for Indeed/ZipRecruiter
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<source>\n';
    xml += '  <publisher>TalentX</publisher>\n';
    xml += `  <publisherurl>https://talentx.ayphen.com</publisherurl>\n`;
    xml += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

    for (const job of jobs) {
      xml += '  <job>\n';
      xml += `    <title><![CDATA[${job.title}]]></title>\n`;
      xml += `    <date><![CDATA[${job.createdAt.toUTCString()}]]></date>\n`;
      xml += `    <referencenumber><![CDATA[${job.id}]]></referencenumber>\n`;
      xml += `    <url><![CDATA[https://talentx.ayphen.com/jobs/${job.id}]]></url>\n`;
      xml += `    <company><![CDATA[Ayphen]]></company>\n`; // TODO: Get from tenant settings
      xml += `    <city><![CDATA[${job.location?.city || ''}]]></city>\n`;
      xml += `    <state><![CDATA[${job.location?.state || ''}]]></state>\n`;
      xml += `    <country><![CDATA[${job.location?.country || ''}]]></country>\n`;
      xml += `    <description><![CDATA[${job.description}]]></description>\n`;
      if (job.salaryMin && job.salaryMax) {
        xml += `    <salary><![CDATA[${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}]]></salary>\n`;
      }
      xml += `    <jobtype><![CDATA[${job.employmentType}]]></jobtype>\n`;
      xml += `    <category><![CDATA[${job.department?.name || ''}]]></category>\n`;
      xml += '  </job>\n';
    }

    xml += '</source>';
    return xml;
  }

  private async generateJobCode() {
    return `JOB-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
