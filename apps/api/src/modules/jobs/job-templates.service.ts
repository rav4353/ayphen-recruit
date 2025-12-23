import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmploymentType } from '@prisma/client';

interface CreateJobTemplateDto {
  name: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  employmentType?: EmploymentType;
  skills?: string[];
}

interface UpdateJobTemplateDto extends Partial<CreateJobTemplateDto> {
  isActive?: boolean;
}

@Injectable()
export class JobTemplatesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new job template
   */
  async create(dto: CreateJobTemplateDto, tenantId: string) {
    // Check for duplicate name
    const existing = await this.prisma.jobTemplate.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('A job template with this name already exists');
    }

    return this.prisma.jobTemplate.create({
      data: {
        name: dto.name,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        responsibilities: dto.responsibilities,
        benefits: dto.benefits,
        employmentType: dto.employmentType || 'FULL_TIME',
        skills: dto.skills || [],
        tenantId,
      },
    });
  }

  /**
   * Get all job templates for tenant
   */
  async findAll(tenantId: string, includeInactive = false) {
    return this.prisma.jobTemplate.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get job template by ID
   */
  async findById(id: string, tenantId: string) {
    const template = await this.prisma.jobTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Job template not found');
    }

    return template;
  }

  /**
   * Update job template
   */
  async update(id: string, dto: UpdateJobTemplateDto, tenantId: string) {
    await this.findById(id, tenantId);

    // Check for duplicate name if name is being updated
    if (dto.name) {
      const existing = await this.prisma.jobTemplate.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          tenantId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('A job template with this name already exists');
      }
    }

    return this.prisma.jobTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
        ...(dto.responsibilities !== undefined && { responsibilities: dto.responsibilities }),
        ...(dto.benefits !== undefined && { benefits: dto.benefits }),
        ...(dto.employmentType && { employmentType: dto.employmentType }),
        ...(dto.skills && { skills: dto.skills }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Delete job template (soft delete by marking inactive)
   */
  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);

    return this.prisma.jobTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Duplicate a job template
   */
  async duplicate(id: string, newName: string, tenantId: string) {
    const template = await this.findById(id, tenantId);

    return this.prisma.jobTemplate.create({
      data: {
        name: newName,
        title: template.title,
        description: template.description,
        requirements: template.requirements,
        responsibilities: template.responsibilities,
        benefits: template.benefits,
        employmentType: template.employmentType,
        skills: template.skills,
        tenantId,
      },
    });
  }

  /**
   * Create a job from a template
   */
  async createJobFromTemplate(templateId: string, tenantId: string, recruiterId: string, overrides?: {
    title?: string;
    description?: string;
    departmentId?: string;
    locationId?: string;
    hiringManagerId?: string;
    pipelineId?: string;
  }) {
    const template = await this.findById(templateId, tenantId);

    // Generate unique job code
    const jobCode = `JOB-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.job.create({
      data: {
        jobCode,
        title: overrides?.title || template.title,
        description: overrides?.description || template.description,
        requirements: template.requirements,
        responsibilities: template.responsibilities,
        benefits: template.benefits,
        employmentType: template.employmentType,
        skills: template.skills,
        status: 'DRAFT',
        tenantId,
        recruiterId,
        ...(overrides?.departmentId && { departmentId: overrides.departmentId }),
        ...(overrides?.locationId && { locations: { connect: { id: overrides.locationId } } }),
        ...(overrides?.hiringManagerId && { hiringManagerId: overrides.hiringManagerId }),
        ...(overrides?.pipelineId && { pipelineId: overrides.pipelineId }),
      },
      include: {
        department: true,
        locations: true,
        recruiter: true,
        hiringManager: true,
      },
    });
  }

  /**
   * Get template usage statistics
   */
  async getStats(tenantId: string) {
    const templates = await this.prisma.jobTemplate.findMany({
      where: { tenantId },
      select: { id: true, isActive: true },
    });

    return {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      inactive: templates.filter(t => !t.isActive).length,
    };
  }
}
