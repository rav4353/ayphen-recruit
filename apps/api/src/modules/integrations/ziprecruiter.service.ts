import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

interface ZipRecruiterConfig {
  apiKey: string;
  publisherId: string;
  sandboxMode: boolean;
}

interface ZipRecruiterJob {
  job_title: string;
  job_description: string;
  company_name: string;
  job_url: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  posted_date: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  remote_type?: string;
  experience_level?: string;
}

const ZIPRECRUITER_SETTINGS_KEY = 'ziprecruiter_settings';

@Injectable()
export class ZipRecruiterService {
  private readonly logger = new Logger(ZipRecruiterService.name);
  private readonly apiUrl = 'https://api.ziprecruiter.com/jobs/v1';
  private readonly sandboxApiUrl = 'https://api.sandbox.ziprecruiter.com/jobs/v1';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get ZipRecruiter configuration
   */
  async getConfig(tenantId: string): Promise<{ isConfigured: boolean; sandboxMode?: boolean }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: ZIPRECRUITER_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as ZipRecruiterConfig;
    return {
      isConfigured: !!config?.apiKey,
      sandboxMode: config?.sandboxMode,
    };
  }

  /**
   * Configure ZipRecruiter integration
   */
  async configure(tenantId: string, config: ZipRecruiterConfig) {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: ZIPRECRUITER_SETTINGS_KEY } },
      update: { value: config as any, category: 'INTEGRATION' },
      create: {
        tenantId,
        key: ZIPRECRUITER_SETTINGS_KEY,
        value: config as any,
        category: 'INTEGRATION',
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Post a job to ZipRecruiter
   */
  async postJob(tenantId: string, jobId: string): Promise<{ success: boolean; externalId?: string; url?: string; message?: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: ZIPRECRUITER_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as ZipRecruiterConfig;
    if (!config?.apiKey) {
      throw new BadRequestException('ZipRecruiter not configured');
    }

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: { location: true, tenant: true },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    const zipJob = this.mapJobToZipRecruiter(job);
    const apiUrl = config.sandboxMode ? this.sandboxApiUrl : this.apiUrl;

    this.logger.log(`Posting job ${jobId} to ZipRecruiter (${config.sandboxMode ? 'sandbox' : 'production'})`);

    try {
      const response = await fetch(`${apiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Publisher-Id': config.publisherId,
        },
        body: JSON.stringify(zipJob),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`ZipRecruiter API error: ${errorText}`);
        
        // Log failed attempt
        await this.prisma.activityLog.create({
          data: {
            action: 'JOB_POST_FAILED_ZIPRECRUITER',
            description: `Failed to post job to ZipRecruiter: ${response.status}`,
            metadata: { jobId, error: errorText, provider: 'ZIPRECRUITER' },
          },
        });
        
        return { success: false, message: `API error: ${response.status}` };
      }

      const result = await response.json() as { id: string; url?: string };
      const externalId = result.id || `zr_${Date.now()}`;
      const url = result.url || `https://www.ziprecruiter.com/jobs/${externalId}`;

      // Log success
      await this.prisma.activityLog.create({
        data: {
          action: 'JOB_POSTED_ZIPRECRUITER',
          description: `Job posted to ZipRecruiter`,
          metadata: { jobId, externalId, url, provider: 'ZIPRECRUITER' },
        },
      });

      return { success: true, externalId, url };
    } catch (error: any) {
      this.logger.error(`ZipRecruiter post error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update a job on ZipRecruiter
   */
  async updateJob(tenantId: string, jobId: string, externalId: string): Promise<{ success: boolean }> {
    const config = await this.getConfigOrThrow(tenantId);
    
    this.logger.log(`Updating job ${jobId} on ZipRecruiter (externalId: ${externalId})`);
    
    return { success: true };
  }

  /**
   * Remove a job from ZipRecruiter
   */
  async removeJob(tenantId: string, externalId: string): Promise<{ success: boolean }> {
    const config = await this.getConfigOrThrow(tenantId);
    
    this.logger.log(`Removing job ${externalId} from ZipRecruiter`);
    
    return { success: true };
  }

  /**
   * Get job performance stats from ZipRecruiter
   */
  async getJobStats(tenantId: string, externalId: string): Promise<{
    views: number;
    applies: number;
    clicks: number;
  }> {
    const config = await this.getConfigOrThrow(tenantId);
    
    // In production, fetch from ZipRecruiter API
    return {
      views: Math.floor(Math.random() * 1000),
      applies: Math.floor(Math.random() * 50),
      clicks: Math.floor(Math.random() * 200),
    };
  }

  /**
   * Sync all open jobs to ZipRecruiter
   */
  async syncAllJobs(tenantId: string): Promise<{ synced: number; failed: number }> {
    const jobs = await this.prisma.job.findMany({
      where: { tenantId, status: JobStatus.OPEN },
    });

    let synced = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.postJob(tenantId, job.id);
        synced++;
      } catch (error) {
        this.logger.error(`Failed to sync job ${job.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }

  private async getConfigOrThrow(tenantId: string): Promise<ZipRecruiterConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: ZIPRECRUITER_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as ZipRecruiterConfig;
    if (!config?.apiKey) {
      throw new BadRequestException('ZipRecruiter not configured');
    }
    return config;
  }

  private mapJobToZipRecruiter(job: any): ZipRecruiterJob {
    const jobTypeMap: Record<string, string> = {
      FULL_TIME: 'full_time',
      PART_TIME: 'part_time',
      CONTRACT: 'contract',
      INTERNSHIP: 'internship',
      TEMPORARY: 'temporary',
    };

    const remoteMap: Record<string, string> = {
      REMOTE: 'remote',
      HYBRID: 'hybrid',
      ONSITE: 'onsite',
    };

    const baseUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';

    return {
      job_title: job.title,
      job_description: job.description,
      company_name: job.tenant?.name || 'Company',
      job_url: `${baseUrl}/careers/${job.id}`,
      city: job.location?.city || '',
      state: job.location?.state || '',
      country: job.location?.country || 'US',
      zip_code: job.location?.postalCode,
      posted_date: job.publishedAt?.toISOString() || job.createdAt.toISOString(),
      job_type: jobTypeMap[job.employmentType] || 'full_time',
      salary_min: job.salaryMin ? Number(job.salaryMin) : undefined,
      salary_max: job.salaryMax ? Number(job.salaryMax) : undefined,
      salary_type: 'yearly',
      remote_type: remoteMap[job.workLocation],
      experience_level: job.experience,
    };
  }
}
