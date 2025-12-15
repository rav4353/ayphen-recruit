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
    try {
      const { departmentId, role, password, customPermissions, roleId, ...userData } = dto as any;

      // Check if user with this email or employeeId already exists in this tenant
      const existingUser = await this.prisma.user.findFirst({
        where: {
          tenantId,
          OR: [
            { email: dto.email },
            { employeeId: dto.employeeId }
          ]
        },
      });

      if (existingUser) {
        if (existingUser.email === dto.email) {
          throw new ConflictException(`User with email ${dto.email} already exists in this organization`);
        }
        throw new ConflictException(`User with Employee ID ${dto.employeeId} already exists in this organization`);
      }

      let passwordHash = undefined;
      if (password) {
        const defaultRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
        const saltRounds = Number(this.configService.get('BCRYPT_ROUNDS')) || defaultRounds;
        passwordHash = await bcrypt.hash(password, saltRounds);
      }

      console.log('Creating user with data:', { email: dto.email, employeeId: dto.employeeId, tenantId });

      const user = await this.prisma.user.create({
        data: {
          ...userData,
          employeeId: dto.employeeId || this.generateEmployeeId(),
          tenantId,
          ...(passwordHash && { passwordHash }),
          ...(role && { role }), // Ensure role is valid UserRole enum or ignored
          ...(departmentId && { departmentId }),
          ...(roleId && { roleId }),
          ...(customPermissions && { customPermissions }),
          status: 'ACTIVE',
          requirePasswordChange: !!password,
        },
      });

      // If a password was provided, it means this is an invite flow where the admin set a temp password
      if (password) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login`;

        try {
          await this.emailService.sendInvitationEmail(
            user.email,
            user.firstName,
            password,
            loginUrl,
            tenantId
          );
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Do not fail the request if email sending fails, just log it.
          // Or maybe we should warn? For now, swallow error to allow user creation.
        }
      }

      return user;
    } catch (error) {
      console.error('Error in UsersService.create:', error);
      throw error;
    }
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

  /**
   * Get user availability slots for scheduling
   */
  async getAvailability(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get availability from activity log (stored as USER_AVAILABILITY action)
    const availabilityLog = await this.prisma.activityLog.findFirst({
      where: {
        userId,
        action: 'USER_AVAILABILITY',
      },
      orderBy: { createdAt: 'desc' },
    });

    const defaultAvailability = {
      timezone: 'UTC',
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      ],
      bufferMinutes: 15,
      maxMeetingsPerDay: 8,
      blockedDates: [],
    };

    if (!availabilityLog) {
      return defaultAvailability;
    }

    return { ...defaultAvailability, ...(availabilityLog.metadata as any) };
  }

  /**
   * Update user availability slots
   */
  async updateAvailability(
    userId: string,
    data: {
      timezone?: string;
      slots?: { dayOfWeek: number; startTime: string; endTime: string }[];
      bufferMinutes?: number;
      maxMeetingsPerDay?: number;
      blockedDates?: string[];
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentAvailability = await this.getAvailability(userId);

    const updatedAvailability = {
      ...currentAvailability,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Delete old availability record
    await this.prisma.activityLog.deleteMany({
      where: {
        userId,
        action: 'USER_AVAILABILITY',
      },
    });

    // Create new availability record
    await this.prisma.activityLog.create({
      data: {
        action: 'USER_AVAILABILITY',
        description: 'User availability updated',
        userId,
        metadata: updatedAvailability,
      },
    });

    return updatedAvailability;
  }

  /**
   * Get available time slots for a user on a specific date
   */
  async getAvailableTimeslots(
    userId: string,
    date: string,
    durationMinutes: number = 60,
  ) {
    const availability = await this.getAvailability(userId);
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // Convert Sunday from 0 to 7

    // Check if user has availability on this day
    const daySlot = availability.slots?.find((s: any) => s.dayOfWeek === dayOfWeek);
    if (!daySlot) {
      return { date, slots: [], message: 'User not available on this day' };
    }

    // Check if date is blocked
    if (availability.blockedDates?.includes(date)) {
      return { date, slots: [], message: 'Date is blocked' };
    }

    // Get existing interviews for this user on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingInterviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: userId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledAt: true, duration: true },
    });

    // Check max meetings limit
    if (availability.maxMeetingsPerDay && existingInterviews.length >= availability.maxMeetingsPerDay) {
      return { date, slots: [], message: 'Maximum meetings reached for this day' };
    }

    // Generate available time slots
    const slots: { start: string; end: string }[] = [];
    const bufferMinutes = availability.bufferMinutes || 0;

    const [startHour, startMin] = daySlot.startTime.split(':').map(Number);
    const [endHour, endMin] = daySlot.endTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime.getTime() + durationMinutes * 60 * 1000 <= endTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

      // Check if slot conflicts with existing interviews
      const hasConflict = existingInterviews.some((interview) => {
        const interviewStart = new Date(interview.scheduledAt);
        const interviewEnd = new Date(interviewStart.getTime() + interview.duration * 60 * 1000);

        // Add buffer time
        const bufferedStart = new Date(interviewStart.getTime() - bufferMinutes * 60 * 1000);
        const bufferedEnd = new Date(interviewEnd.getTime() + bufferMinutes * 60 * 1000);

        return (
          (currentTime >= bufferedStart && currentTime < bufferedEnd) ||
          (slotEnd > bufferedStart && slotEnd <= bufferedEnd) ||
          (currentTime <= bufferedStart && slotEnd >= bufferedEnd)
        );
      });

      if (!hasConflict) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      // Move to next slot (30 min intervals)
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    return { date, timezone: availability.timezone, slots };
  }

  /**
   * Block specific dates for a user
   */
  async blockDates(userId: string, dates: string[]) {
    const availability = await this.getAvailability(userId);
    const existingBlocked = availability.blockedDates || [];
    const newBlocked = [...new Set([...existingBlocked, ...dates])];

    return this.updateAvailability(userId, { blockedDates: newBlocked });
  }

  /**
   * Unblock specific dates for a user
   */
  async unblockDates(userId: string, dates: string[]) {
    const availability = await this.getAvailability(userId);
    const existingBlocked = availability.blockedDates || [];
    const newBlocked = existingBlocked.filter((d: string) => !dates.includes(d));

    return this.updateAvailability(userId, { blockedDates: newBlocked });
  }
}
