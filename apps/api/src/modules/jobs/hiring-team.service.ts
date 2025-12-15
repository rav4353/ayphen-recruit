import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type HiringTeamRole = 'HIRING_MANAGER' | 'RECRUITER' | 'INTERVIEWER' | 'COORDINATOR' | 'APPROVER' | 'OBSERVER';

interface AddTeamMemberDto {
  userId: string;
  role: HiringTeamRole;
  permissions?: {
    canViewCandidates?: boolean;
    canEditCandidates?: boolean;
    canScheduleInterviews?: boolean;
    canProvideFeedback?: boolean;
    canMakeOffers?: boolean;
    canApprove?: boolean;
  };
}

@Injectable()
export class HiringTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateTeamMemberId(): string {
    return `tm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a team member to a job
   */
  async addTeamMember(jobId: string, dto: AddTeamMemberDto, tenantId: string, addedByUserId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { id: true, title: true, recruiterId: true, hiringManagerId: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify user exists and belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already on the team
    const existingMember = await this.prisma.activityLog.findFirst({
      where: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
        metadata: {
          path: ['jobId'],
          equals: jobId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingMember) {
      const meta = existingMember.metadata as any;
      const members = meta.teamMembers || [];
      if (members.some((m: any) => m.userId === dto.userId && m.status === 'ACTIVE')) {
        throw new ConflictException('User is already a team member for this job');
      }
    }

    const memberId = this.generateTeamMemberId();
    const defaultPermissions = this.getDefaultPermissions(dto.role);
    const permissions = { ...defaultPermissions, ...dto.permissions };

    // Get current team members
    const currentTeam = await this.getTeamMembers(jobId, tenantId);

    const newMember = {
      id: memberId,
      userId: dto.userId,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      role: dto.role,
      permissions,
      status: 'ACTIVE',
      addedAt: new Date().toISOString(),
      addedBy: addedByUserId,
    };

    const updatedTeam = [...currentTeam, newMember];

    await this.prisma.activityLog.create({
      data: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
        description: `${user.firstName} ${user.lastName} added to hiring team as ${dto.role}`,
        userId: addedByUserId,
        metadata: {
          jobId,
          jobTitle: job.title,
          tenantId,
          teamMembers: updatedTeam,
          latestChange: {
            type: 'ADDED',
            member: newMember,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    // Notify the added user
    await this.notificationsService.create({
      type: 'JOB',
      title: 'Added to Hiring Team',
      message: `You have been added to the hiring team for "${job.title}" as ${dto.role.replace('_', ' ').toLowerCase()}.`,
      userId: dto.userId,
      tenantId,
      metadata: { jobId, role: dto.role },
    });

    return newMember;
  }

  /**
   * Get all team members for a job
   */
  async getTeamMembers(jobId: string, tenantId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { id: true, recruiterId: true, hiringManagerId: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get latest team state from activity logs
    const teamLog = await this.prisma.activityLog.findFirst({
      where: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
        metadata: {
          path: ['jobId'],
          equals: jobId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!teamLog) {
      // Return default team from job
      const defaultTeam: any[] = [];

      if (job.recruiterId) {
        const recruiter = await this.prisma.user.findUnique({
          where: { id: job.recruiterId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        if (recruiter) {
          defaultTeam.push({
            id: `default-recruiter`,
            userId: recruiter.id,
            userName: `${recruiter.firstName} ${recruiter.lastName}`,
            userEmail: recruiter.email,
            role: 'RECRUITER',
            permissions: this.getDefaultPermissions('RECRUITER'),
            status: 'ACTIVE',
            isDefault: true,
          });
        }
      }

      if (job.hiringManagerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: job.hiringManagerId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        if (manager) {
          defaultTeam.push({
            id: `default-hiring-manager`,
            userId: manager.id,
            userName: `${manager.firstName} ${manager.lastName}`,
            userEmail: manager.email,
            role: 'HIRING_MANAGER',
            permissions: this.getDefaultPermissions('HIRING_MANAGER'),
            status: 'ACTIVE',
            isDefault: true,
          });
        }
      }

      return defaultTeam;
    }

    const meta = teamLog.metadata as any;
    return (meta.teamMembers || []).filter((m: any) => m.status === 'ACTIVE');
  }

  /**
   * Update team member role or permissions
   */
  async updateTeamMember(
    jobId: string,
    memberId: string,
    updates: { role?: HiringTeamRole; permissions?: Record<string, boolean> },
    tenantId: string,
    updatedByUserId: string,
  ) {
    const currentTeam = await this.getTeamMembers(jobId, tenantId);
    const memberIndex = currentTeam.findIndex((m: any) => m.id === memberId);

    if (memberIndex === -1) {
      throw new NotFoundException('Team member not found');
    }

    const member = currentTeam[memberIndex];
    
    if (member.isDefault) {
      throw new BadRequestException('Cannot modify default team members. Update the job recruiter or hiring manager instead.');
    }

    const updatedMember = {
      ...member,
      role: updates.role || member.role,
      permissions: { ...member.permissions, ...updates.permissions },
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByUserId,
    };

    currentTeam[memberIndex] = updatedMember;

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { title: true },
    });

    await this.prisma.activityLog.create({
      data: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
        description: `Team member ${member.userName} updated`,
        userId: updatedByUserId,
        metadata: {
          jobId,
          jobTitle: job?.title,
          tenantId,
          teamMembers: currentTeam,
          latestChange: {
            type: 'UPDATED',
            member: updatedMember,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    return updatedMember;
  }

  /**
   * Remove team member from job
   */
  async removeTeamMember(jobId: string, memberId: string, tenantId: string, removedByUserId: string) {
    const currentTeam = await this.getTeamMembers(jobId, tenantId);
    const memberIndex = currentTeam.findIndex((m: any) => m.id === memberId);

    if (memberIndex === -1) {
      throw new NotFoundException('Team member not found');
    }

    const member = currentTeam[memberIndex];

    if (member.isDefault) {
      throw new BadRequestException('Cannot remove default team members. Update the job recruiter or hiring manager instead.');
    }

    // Mark as removed instead of deleting
    currentTeam[memberIndex] = {
      ...member,
      status: 'REMOVED',
      removedAt: new Date().toISOString(),
      removedBy: removedByUserId,
    };

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      select: { title: true },
    });

    await this.prisma.activityLog.create({
      data: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
        description: `${member.userName} removed from hiring team`,
        userId: removedByUserId,
        metadata: {
          jobId,
          jobTitle: job?.title,
          tenantId,
          teamMembers: currentTeam,
          latestChange: {
            type: 'REMOVED',
            member: currentTeam[memberIndex],
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    // Notify the removed user
    await this.notificationsService.create({
      type: 'JOB',
      title: 'Removed from Hiring Team',
      message: `You have been removed from the hiring team for "${job?.title}".`,
      userId: member.userId,
      tenantId,
      metadata: { jobId },
    });

    return { success: true };
  }

  /**
   * Check if user has permission for a job
   */
  async checkPermission(
    jobId: string,
    userId: string,
    permission: keyof AddTeamMemberDto['permissions'],
    tenantId: string,
  ): Promise<boolean> {
    const teamMembers = await this.getTeamMembers(jobId, tenantId);
    const member = teamMembers.find((m: any) => m.userId === userId);

    if (!member) {
      return false;
    }

    return member.permissions?.[permission] === true;
  }

  /**
   * Get all jobs where user is a team member
   */
  async getJobsForUser(userId: string, tenantId: string) {
    // Get all hiring team logs
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'HIRING_TEAM_MEMBER_ADDED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobIds: string[] = [];
    const seenJobs = new Set<string>();

    for (const log of logs) {
      const meta = log.metadata as any;
      if (!meta?.jobId || meta.tenantId !== tenantId) continue;
      if (seenJobs.has(meta.jobId)) continue;
      seenJobs.add(meta.jobId);

      const members = meta.teamMembers || [];
      if (members.some((m: any) => m.userId === userId && m.status === 'ACTIVE')) {
        jobIds.push(meta.jobId);
      }
    }

    // Also include jobs where user is recruiter or hiring manager
    const directJobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        OR: [
          { recruiterId: userId },
          { hiringManagerId: userId },
        ],
      },
      select: { id: true },
    });

    for (const job of directJobs) {
      if (!jobIds.includes(job.id)) {
        jobIds.push(job.id);
      }
    }

    // Fetch job details
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: {
        id: true,
        title: true,
        status: true,
        department: { select: { name: true } },
        location: { select: { name: true } },
      },
    });

    return jobs;
  }

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissions(role: HiringTeamRole): Record<string, boolean> {
    const permissions: Record<HiringTeamRole, Record<string, boolean>> = {
      HIRING_MANAGER: {
        canViewCandidates: true,
        canEditCandidates: true,
        canScheduleInterviews: true,
        canProvideFeedback: true,
        canMakeOffers: true,
        canApprove: true,
      },
      RECRUITER: {
        canViewCandidates: true,
        canEditCandidates: true,
        canScheduleInterviews: true,
        canProvideFeedback: true,
        canMakeOffers: true,
        canApprove: false,
      },
      INTERVIEWER: {
        canViewCandidates: true,
        canEditCandidates: false,
        canScheduleInterviews: false,
        canProvideFeedback: true,
        canMakeOffers: false,
        canApprove: false,
      },
      COORDINATOR: {
        canViewCandidates: true,
        canEditCandidates: true,
        canScheduleInterviews: true,
        canProvideFeedback: false,
        canMakeOffers: false,
        canApprove: false,
      },
      APPROVER: {
        canViewCandidates: true,
        canEditCandidates: false,
        canScheduleInterviews: false,
        canProvideFeedback: false,
        canMakeOffers: false,
        canApprove: true,
      },
      OBSERVER: {
        canViewCandidates: true,
        canEditCandidates: false,
        canScheduleInterviews: false,
        canProvideFeedback: false,
        canMakeOffers: false,
        canApprove: false,
      },
    };

    return permissions[role];
  }
}
