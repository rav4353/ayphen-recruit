import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) { }

  async create(dto: CreateUserDto, tenantId: string) {
    const { departmentId, role, password, customPermissions, roleId, ...userData } = dto as any; // Cast to any to access password if not in DTO interface

    // Check if user with this email already exists in this tenant
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email: dto.email,
          tenantId: tenantId,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${dto.email} already exists in this organization`);
    }

    let passwordHash = undefined;
    if (password) {
      const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
      const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        employeeId: this.generateEmployeeId(),
        tenantId,
        ...(passwordHash && { passwordHash }),
        ...(role && { role }),
        ...(departmentId && { departmentId }),
        ...(roleId && { roleId }),
        ...(customPermissions && { customPermissions }),
        status: 'ACTIVE', // Invited users are active immediately (password set by admin)
        requirePasswordChange: !!password, // Force password change if invited with temp password
      },
    });

    // If a password was provided, it means this is an invite flow where the admin set a temp password
    if (password) {
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const loginUrl = `${frontendUrl}/login`;

      await this.emailService.sendInvitationEmail(
        user.email,
        user.firstName,
        password,
        loginUrl,
        tenantId
      );
    }

    return user;
  }

  async findAll(tenantId: string, query: UserQueryDto) {
    const where: Record<string, unknown> = { tenantId };

    // Apply filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.role) {
      where.role = query.role;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    // Apply search
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build sort order
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortField]: sortOrder };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy,
        include: {
          department: true,
          roleDef: true
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findUnique({
      where: {
        email_tenantId: { email, tenantId },
      },
      include: {
        roleDef: true
      }
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    const { departmentId, role, customPermissions, roleId, ...userData } = dto;
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...userData,
        ...(role && { role }),
        ...(roleId !== undefined && { roleId: roleId || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(customPermissions && { customPermissions }),
      },
    });
  }

  async remove(id: string) {
    const user = await this.findById(id);
    return this.prisma.user.delete({
      where: { id: user.id },
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const user = await this.findById(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { status },
    });
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredTheme: true,
        preferredLanguage: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      theme: user.preferredTheme,
      language: user.preferredLanguage,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.theme && { preferredTheme: dto.theme }),
        ...(dto.language && { preferredLanguage: dto.language }),
      },
      select: {
        preferredTheme: true,
        preferredLanguage: true,
      },
    });

    return {
      theme: updated.preferredTheme,
      language: updated.preferredLanguage,
    };
  }

  async resendPassword(userId: string) {
    const user = await this.findById(userId);

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2);

    // Hash the password
    const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    // Update user with new password and set requirePasswordChange flag
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        requirePasswordChange: true,
        tempPasswordExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48 hours
      },
    });

    // Send email with new temporary password
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/login`;

    await this.emailService.sendInvitationEmail(
      user.email,
      user.firstName,
      tempPassword,
      loginUrl,
      user.tenantId
    );
  }

  async getPendingActions(userId: string) {
    const jobApprovals = await this.prisma.jobApproval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Future: Add Offer Approvals here
    // const offerApprovals = ...

    const actions = [
      ...jobApprovals.map((approval) => ({
        id: approval.id,
        title: `Approve Job Requisition: ${approval.job.title}`,
        type: 'approval',
        entity: 'Job',
        entityId: approval.job.id,
        due: 'Today', // You might want to calculate this based on SLA or creation date
        createdAt: approval.createdAt,
      })),
    ];

    return actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private generateEmployeeId(): string {
    return `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
