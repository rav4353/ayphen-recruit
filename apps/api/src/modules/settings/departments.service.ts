import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateDepartmentDto {
  name: string;
  code?: string;
  parentId?: string;
}

interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {}

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async create(dto: CreateDepartmentDto, tenantId: string) {
    // Check for duplicate name
    const existing = await this.prisma.department.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('A department with this name already exists');
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.department.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Parent department not found');
      }
    }

    return this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        parentId: dto.parentId,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
        _count: { select: { users: true, jobs: true } },
      },
    });
  }

  /**
   * Get all departments for tenant
   */
  async findAll(tenantId: string, includeHierarchy = false) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      include: {
        parent: true,
        children: includeHierarchy,
        _count: { select: { users: true, jobs: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (includeHierarchy) {
      // Build tree structure
      return this.buildDepartmentTree(departments);
    }

    return departments;
  }

  /**
   * Build department tree from flat list
   */
  private buildDepartmentTree(departments: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    // First pass: create map of all departments
    for (const dept of departments) {
      map.set(dept.id, { ...dept, children: [] });
    }

    // Second pass: build tree
    for (const dept of departments) {
      const node = map.get(dept.id);
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Get department by ID
   */
  async findById(id: string, tenantId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
          take: 10,
        },
        jobs: {
          select: { id: true, title: true, status: true },
          take: 10,
        },
        _count: { select: { users: true, jobs: true } },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  /**
   * Update department
   */
  async update(id: string, dto: UpdateDepartmentDto, tenantId: string) {
    await this.findById(id, tenantId);

    // Check for duplicate name if name is being updated
    if (dto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          tenantId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('A department with this name already exists');
      }
    }

    // Validate parent if provided
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A department cannot be its own parent');
      }

      const parent = await this.prisma.department.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Parent department not found');
      }

      // Check for circular reference
      const isCircular = await this.checkCircularReference(id, dto.parentId, tenantId);
      if (isCircular) {
        throw new BadRequestException('Circular reference detected in department hierarchy');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: {
        parent: true,
        children: true,
        _count: { select: { users: true, jobs: true } },
      },
    });
  }

  /**
   * Check for circular reference in hierarchy
   */
  private async checkCircularReference(departmentId: string, newParentId: string, tenantId: string): Promise<boolean> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === departmentId) {
        return true;
      }
      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);

      const dept = await this.prisma.department.findFirst({
        where: { id: currentId, tenantId },
        select: { parentId: true },
      });

      currentId = dept?.parentId || null;
    }

    return false;
  }

  /**
   * Delete department
   */
  async delete(id: string, tenantId: string) {
    const department = await this.findById(id, tenantId);

    // Check if department has users or jobs
    if ((department as any)._count.users > 0) {
      throw new BadRequestException('Cannot delete department with assigned users. Reassign users first.');
    }

    if ((department as any)._count.jobs > 0) {
      throw new BadRequestException('Cannot delete department with associated jobs. Reassign jobs first.');
    }

    // Check if department has children
    if ((department as any).children?.length > 0) {
      throw new BadRequestException('Cannot delete department with sub-departments. Delete or reassign children first.');
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }

  /**
   * Get department statistics
   */
  async getStats(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: { select: { users: true, jobs: true } },
      },
    });

    const totalUsers = departments.reduce((sum, d) => sum + (d as any)._count.users, 0);
    const totalJobs = departments.reduce((sum, d) => sum + (d as any)._count.jobs, 0);
    const rootDepartments = departments.filter(d => !d.parentId).length;

    return {
      totalDepartments: departments.length,
      rootDepartments,
      totalUsers,
      totalJobs,
      departmentsBySize: departments
        .map(d => ({
          id: d.id,
          name: d.name,
          userCount: (d as any)._count.users,
          jobCount: (d as any)._count.jobs,
        }))
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, 10),
    };
  }

  /**
   * Move users between departments
   */
  async moveUsers(fromDepartmentId: string, toDepartmentId: string, userIds: string[], tenantId: string) {
    // Verify both departments exist
    await this.findById(fromDepartmentId, tenantId);
    await this.findById(toDepartmentId, tenantId);

    // Update users
    const result = await this.prisma.user.updateMany({
      where: {
        id: { in: userIds },
        departmentId: fromDepartmentId,
        tenantId,
      },
      data: { departmentId: toDepartmentId },
    });

    return { movedCount: result.count };
  }
}
