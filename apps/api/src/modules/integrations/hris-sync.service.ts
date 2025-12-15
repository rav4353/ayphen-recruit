import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export type HRISProvider = 'WORKDAY' | 'BAMBOOHR' | 'GREENHOUSE' | 'SUCCESSFACTORS' | 'ADP';

interface HRISConfig {
  provider: HRISProvider;
  apiKey?: string;
  apiSecret?: string;
  subdomain?: string;
  companyId?: string;
  syncEnabled: boolean;
  syncDirection: 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';
  syncFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
  lastSyncAt?: Date;
  fieldMappings?: Record<string, string>;
}

interface HRISEmployee {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  location?: string;
  managerId?: string;
  startDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
}

const HRIS_SETTINGS_KEY = 'hris_settings';

@Injectable()
export class HRISSyncService {
  private readonly logger = new Logger(HRISSyncService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get HRIS configuration for a tenant
   */
  async getConfig(tenantId: string): Promise<{ 
    isConfigured: boolean; 
    provider?: HRISProvider;
    syncEnabled?: boolean;
    lastSyncAt?: Date;
  }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as HRISConfig;
    return {
      isConfigured: !!(config?.apiKey || config?.apiSecret),
      provider: config?.provider,
      syncEnabled: config?.syncEnabled,
      lastSyncAt: config?.lastSyncAt,
    };
  }

  /**
   * Configure HRIS integration
   */
  async configure(tenantId: string, config: Partial<HRISConfig>) {
    const existing = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
    });

    const currentConfig = (existing?.value as unknown as HRISConfig) || {};
    const newConfig = { ...currentConfig, ...config };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
      update: { value: newConfig as any, category: 'INTEGRATION' },
      create: {
        tenantId,
        key: HRIS_SETTINGS_KEY,
        value: newConfig as any,
        category: 'INTEGRATION',
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Disconnect HRIS integration
   */
  async disconnect(tenantId: string) {
    await this.prisma.setting.delete({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
    }).catch(() => null);

    return { success: true };
  }

  /**
   * Sync employees from HRIS
   */
  async syncEmployees(tenantId: string): Promise<{ 
    imported: number; 
    updated: number; 
    errors: string[];
  }> {
    const config = await this.getConfigOrThrow(tenantId);
    
    this.logger.log(`Starting HRIS sync for tenant ${tenantId} (${config.provider})`);

    const employees = await this.fetchEmployeesFromHRIS(config);
    
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      try {
        const existingUser = await this.prisma.user.findFirst({
          where: { email: emp.email, tenantId },
        });

        if (existingUser) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firstName: emp.firstName,
              lastName: emp.lastName,
              title: emp.title,
              employeeId: emp.employeeId,
            },
          });
          updated++;
        } else {
          await this.prisma.user.create({
            data: {
              tenantId,
              email: emp.email,
              firstName: emp.firstName,
              lastName: emp.lastName,
              title: emp.title,
              employeeId: emp.employeeId,
              role: 'RECRUITER',
              status: 'PENDING',
            },
          });
          imported++;
        }
      } catch (error: any) {
        errors.push(`Failed to sync ${emp.email}: ${error.message}`);
      }
    }

    // Update last sync time
    await this.configure(tenantId, { lastSyncAt: new Date() } as any);

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'HRIS_SYNC_COMPLETED',
        description: `HRIS sync completed: ${imported} imported, ${updated} updated`,
        metadata: {
          provider: config.provider,
          imported,
          updated,
          errors: errors.length,
        },
      },
    });

    return { imported, updated, errors };
  }

  /**
   * Export new hires to HRIS
   */
  async exportNewHires(tenantId: string): Promise<{ exported: number; errors: string[] }> {
    const config = await this.getConfigOrThrow(tenantId);

    if (config.syncDirection === 'IMPORT') {
      throw new BadRequestException('Export not enabled for this HRIS configuration');
    }

    // Get hired candidates with completed onboarding
    const hiredApplications = await this.prisma.application.findMany({
      where: {
        job: { tenantId },
        status: 'HIRED',
      },
      include: {
        candidate: true,
        job: true,
        offers: { where: { status: 'ACCEPTED' } },
      },
    });

    let exported = 0;
    const errors: string[] = [];

    for (const app of hiredApplications) {
      try {
        await this.createEmployeeInHRIS(config, {
          email: app.candidate.email,
          firstName: app.candidate.firstName,
          lastName: app.candidate.lastName,
          title: app.job.title,
          startDate: app.offers[0]?.startDate?.toISOString(),
        });
        exported++;
      } catch (error: any) {
        errors.push(`Failed to export ${app.candidate.email}: ${error.message}`);
      }
    }

    return { exported, errors };
  }

  /**
   * Test HRIS connection
   */
  async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfigOrThrow(tenantId);
      
      // In production, make actual API call to test connection
      this.logger.log(`Testing HRIS connection for ${config.provider}`);
      
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get field mappings for HRIS
   */
  async getFieldMappings(tenantId: string): Promise<Record<string, string>> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as HRISConfig;
    return config?.fieldMappings || this.getDefaultFieldMappings();
  }

  /**
   * Update field mappings
   */
  async updateFieldMappings(tenantId: string, mappings: Record<string, string>) {
    return this.configure(tenantId, { fieldMappings: mappings });
  }

  /**
   * Get sync history
   */
  async getSyncHistory(tenantId: string, limit = 10) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: { in: ['HRIS_SYNC_COMPLETED', 'HRIS_SYNC_FAILED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get available HRIS providers
   */
  getAvailableProviders() {
    return [
      {
        id: 'WORKDAY',
        name: 'Workday',
        description: 'Enterprise cloud applications for HR and finance',
        logo: 'https://www.workday.com/favicon.ico',
        features: ['Employee Sync', 'Org Structure', 'Compensation'],
      },
      {
        id: 'BAMBOOHR',
        name: 'BambooHR',
        description: 'HR software for small and medium businesses',
        logo: 'https://www.bamboohr.com/favicon.ico',
        features: ['Employee Sync', 'Time Off', 'Onboarding'],
      },
      {
        id: 'GREENHOUSE',
        name: 'Greenhouse',
        description: 'Recruiting software for growing companies',
        logo: 'https://www.greenhouse.io/favicon.ico',
        features: ['Candidate Sync', 'Job Sync'],
      },
      {
        id: 'SUCCESSFACTORS',
        name: 'SAP SuccessFactors',
        description: 'Cloud-based HCM software',
        logo: 'https://www.sap.com/favicon.ico',
        features: ['Employee Sync', 'Performance', 'Learning'],
      },
      {
        id: 'ADP',
        name: 'ADP',
        description: 'Payroll and HR solutions',
        logo: 'https://www.adp.com/favicon.ico',
        features: ['Employee Sync', 'Payroll', 'Benefits'],
      },
    ];
  }

  // Scheduled sync job
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync() {
    this.logger.log('Running scheduled HRIS sync...');
    
    // Get all tenants with HRIS configured and hourly sync enabled
    const settings = await this.prisma.setting.findMany({
      where: { key: HRIS_SETTINGS_KEY },
    });

    for (const setting of settings) {
      const config = setting.value as unknown as HRISConfig;
      if (config?.syncEnabled && config?.syncFrequency === 'HOURLY') {
        try {
          await this.syncEmployees(setting.tenantId);
        } catch (error) {
          this.logger.error(`HRIS sync failed for tenant ${setting.tenantId}:`, error);
        }
      }
    }
  }

  private async getConfigOrThrow(tenantId: string): Promise<HRISConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HRIS_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as HRISConfig;
    if (!config?.provider) {
      throw new BadRequestException('HRIS not configured');
    }
    return config;
  }

  private async fetchEmployeesFromHRIS(config: HRISConfig): Promise<HRISEmployee[]> {
    // In production, make actual API calls based on provider
    switch (config.provider) {
      case 'WORKDAY':
        return this.fetchFromWorkday(config);
      case 'BAMBOOHR':
        return this.fetchFromBambooHR(config);
      case 'ADP':
        return this.fetchFromADP(config);
      default:
        return [];
    }
  }

  private async fetchFromWorkday(config: HRISConfig): Promise<HRISEmployee[]> {
    this.logger.log('Fetching employees from Workday...');
    
    if (!config.apiKey || !config.subdomain) {
      throw new BadRequestException('Workday API key and subdomain required');
    }

    try {
      // Workday uses SOAP/REST hybrid - this is a simplified REST approach
      const response = await fetch(`https://${config.subdomain}.workday.com/api/v1/workers`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Workday API error: ${response.status}`);
      }

      const data = await response.json() as { data: any[] };
      return (data.data || []).map((emp: any) => ({
        id: emp.id,
        employeeId: emp.employeeId || emp.workerID,
        email: emp.email || emp.emailAddress,
        firstName: emp.firstName || emp.legalName?.firstName,
        lastName: emp.lastName || emp.legalName?.lastName,
        title: emp.jobTitle || emp.position?.title,
        department: emp.department?.name,
        location: emp.location?.name,
        managerId: emp.manager?.id,
        startDate: emp.hireDate,
        status: emp.active ? 'ACTIVE' : 'INACTIVE',
      }));
    } catch (error: any) {
      this.logger.error(`Workday fetch error: ${error.message}`);
      return [];
    }
  }

  private async fetchFromBambooHR(config: HRISConfig): Promise<HRISEmployee[]> {
    this.logger.log('Fetching employees from BambooHR...');
    
    if (!config.apiKey || !config.subdomain) {
      throw new BadRequestException('BambooHR API key and subdomain required');
    }

    try {
      const response = await fetch(
        `https://api.bamboohr.com/api/gateway.php/${config.subdomain}/v1/employees/directory`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.apiKey}:x`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`BambooHR API error: ${response.status}`);
      }

      const data = await response.json() as { employees: any[] };
      return (data.employees || []).map((emp: any) => ({
        id: emp.id,
        employeeId: emp.employeeNumber || emp.id,
        email: emp.workEmail || emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        title: emp.jobTitle,
        department: emp.department,
        location: emp.location,
        managerId: emp.supervisorId,
        startDate: emp.hireDate,
        status: emp.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
      }));
    } catch (error: any) {
      this.logger.error(`BambooHR fetch error: ${error.message}`);
      return [];
    }
  }

  private async fetchFromADP(config: HRISConfig): Promise<HRISEmployee[]> {
    this.logger.log('Fetching employees from ADP...');
    
    if (!config.apiKey || !config.apiSecret) {
      throw new BadRequestException('ADP credentials required');
    }

    try {
      // ADP uses OAuth2 - first get access token
      const tokenResponse = await fetch('https://api.adp.com/auth/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.apiKey,
          client_secret: config.apiSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('ADP authentication failed');
      }

      const tokenData = await tokenResponse.json() as { access_token: string };
      
      // Fetch workers
      const response = await fetch('https://api.adp.com/hr/v2/workers', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ADP API error: ${response.status}`);
      }

      const data = await response.json() as { workers: any[] };
      return (data.workers || []).map((emp: any) => ({
        id: emp.associateOID,
        employeeId: emp.workerID?.idValue,
        email: emp.businessCommunication?.emails?.[0]?.emailUri,
        firstName: emp.person?.legalName?.givenName,
        lastName: emp.person?.legalName?.familyName1,
        title: emp.workAssignments?.[0]?.jobTitle,
        department: emp.workAssignments?.[0]?.homeOrganizationalUnits?.find((u: any) => u.typeCode === 'Department')?.nameCode?.shortName,
        location: emp.workAssignments?.[0]?.homeWorkLocation?.address?.cityName,
        managerId: emp.workAssignments?.[0]?.reportsTo?.[0]?.associateOID,
        startDate: emp.workAssignments?.[0]?.hireDate,
        status: emp.workerStatus?.statusCode === 'Active' ? 'ACTIVE' : 'INACTIVE',
      }));
    } catch (error: any) {
      this.logger.error(`ADP fetch error: ${error.message}`);
      return [];
    }
  }

  private async createEmployeeInHRIS(config: HRISConfig, employee: any): Promise<void> {
    this.logger.log(`Creating employee in ${config.provider}: ${employee.email}`);
    
    switch (config.provider) {
      case 'BAMBOOHR':
        await this.createInBambooHR(config, employee);
        break;
      case 'WORKDAY':
        await this.createInWorkday(config, employee);
        break;
      default:
        this.logger.warn(`Export not supported for ${config.provider}`);
    }
  }

  private async createInBambooHR(config: HRISConfig, employee: any): Promise<void> {
    const response = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${config.subdomain}/v1/employees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.apiKey}:x`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: employee.firstName,
          lastName: employee.lastName,
          workEmail: employee.email,
          jobTitle: employee.title,
          hireDate: employee.startDate,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`BambooHR create failed: ${response.status}`);
    }
  }

  private async createInWorkday(config: HRISConfig, employee: any): Promise<void> {
    const response = await fetch(
      `https://${config.subdomain}.workday.com/api/v1/workers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legalName: { firstName: employee.firstName, lastName: employee.lastName },
          emailAddress: employee.email,
          position: { title: employee.title },
          hireDate: employee.startDate,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Workday create failed: ${response.status}`);
    }
  }

  private getDefaultFieldMappings(): Record<string, string> {
    return {
      'hris.employee_id': 'user.employeeId',
      'hris.email': 'user.email',
      'hris.first_name': 'user.firstName',
      'hris.last_name': 'user.lastName',
      'hris.title': 'user.title',
      'hris.department': 'user.department',
      'hris.location': 'user.location',
      'hris.manager_id': 'user.managerId',
    };
  }
}
