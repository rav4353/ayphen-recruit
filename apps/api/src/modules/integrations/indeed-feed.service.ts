import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Job, JobStatus } from '@prisma/client';

interface IndeedJobXml {
  title: string;
  date: string;
  referencenumber: string;
  url: string;
  company: string;
  city: string;
  state: string;
  country: string;
  postalcode?: string;
  description: string;
  salary?: string;
  education?: string;
  jobtype?: string;
  category?: string;
  experience?: string;
  remotetype?: string;
}

interface IndeedFeedConfig {
  publisherId: string;
  companyName: string;
  feedUrl?: string;
  includeDescription: boolean;
  includeSalary: boolean;
}

const INDEED_SETTINGS_KEY = 'indeed_feed_settings';

@Injectable()
export class IndeedFeedService {
  private readonly logger = new Logger(IndeedFeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Get Indeed Feed configuration
   */
  async getConfig(tenantId: string): Promise<{ isConfigured: boolean; feedUrl?: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: INDEED_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as IndeedFeedConfig;
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';

    return {
      isConfigured: !!config?.publisherId,
      feedUrl: config?.publisherId ? `${baseUrl}/api/integrations/indeed/feed/${tenantId}` : undefined,
    };
  }

  /**
   * Configure Indeed Feed
   */
  async configure(tenantId: string, config: Partial<IndeedFeedConfig>) {
    const existing = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: INDEED_SETTINGS_KEY } },
    });

    const currentConfig = (existing?.value as unknown as IndeedFeedConfig) || {};
    const newConfig = { ...currentConfig, ...config };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: INDEED_SETTINGS_KEY } },
      update: { value: newConfig as any, category: 'INTEGRATION' },
      create: {
        tenantId,
        key: INDEED_SETTINGS_KEY,
        value: newConfig as any,
        category: 'INTEGRATION',
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Generate XML feed for Indeed
   */
  async generateFeed(tenantId: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: INDEED_SETTINGS_KEY } },
    });

    const config: Partial<IndeedFeedConfig> = (setting?.value as unknown as IndeedFeedConfig) || {};
    const feedConfig = {
      companyName: config.companyName || 'Company',
      includeDescription: config.includeDescription ?? true,
      includeSalary: config.includeSalary ?? false,
    };

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Get all open jobs for this tenant
    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        status: JobStatus.OPEN,
      },
      include: {
        locations: true,
        department: true,
      },
    });

    const baseUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const companyName = config.companyName || tenant?.name || 'Company';

    // Generate XML
    const jobsXml = jobs.map(job => this.jobToXml(job, companyName, baseUrl, feedConfig)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${this.escapeXml(companyName)}</publisher>
  <publisherurl>${this.escapeXml(baseUrl)}</publisherurl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
${jobsXml}
</source>`;
  }

  /**
   * Convert job to Indeed XML format
   */
  private jobToXml(job: any, companyName: string, baseUrl: string, config: { includeDescription: boolean; includeSalary: boolean }): string {
    const location = job.locations?.[0];
    const jobUrl = `${baseUrl}/careers/${job.id}`;

    // Map employment type to Indeed job type
    const jobTypeMap: Record<string, string> = {
      FULL_TIME: 'fulltime',
      PART_TIME: 'parttime',
      CONTRACT: 'contract',
      INTERNSHIP: 'internship',
      TEMPORARY: 'temporary',
    };

    // Map work location to remote type
    const remoteTypeMap: Record<string, string> = {
      REMOTE: 'fully_remote',
      HYBRID: 'hybrid_remote',
      ONSITE: '',
    };

    const salary = config.includeSalary && job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin} - ${job.salaryMax}`
      : '';

    return `  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${job.publishedAt?.toISOString() || job.createdAt.toISOString()}]]></date>
    <referencenumber><![CDATA[${job.jobCode || job.id}]]></referencenumber>
    <url><![CDATA[${jobUrl}]]></url>
    <company><![CDATA[${companyName}]]></company>
    <city><![CDATA[${location?.city || ''}]]></city>
    <state><![CDATA[${location?.state || ''}]]></state>
    <country><![CDATA[${location?.country || 'US'}]]></country>
    <postalcode><![CDATA[${location?.postalCode || ''}]]></postalcode>
    <description><![CDATA[${config.includeDescription ? this.formatDescription(job) : job.title}]]></description>
    ${salary ? `<salary><![CDATA[${salary}]]></salary>` : ''}
    <education><![CDATA[${job.education || ''}]]></education>
    <jobtype><![CDATA[${jobTypeMap[job.employmentType] || 'fulltime'}]]></jobtype>
    <category><![CDATA[${job.department?.name || ''}]]></category>
    <experience><![CDATA[${job.experience || ''}]]></experience>
    ${remoteTypeMap[job.workLocation] ? `<remotetype><![CDATA[${remoteTypeMap[job.workLocation]}]]></remotetype>` : ''}
  </job>`;
  }

  /**
   * Format job description for Indeed
   */
  private formatDescription(job: any): string {
    let description = job.description || '';

    if (job.requirements) {
      description += `\n\nRequirements:\n${job.requirements}`;
    }

    if (job.responsibilities) {
      description += `\n\nResponsibilities:\n${job.responsibilities}`;
    }

    if (job.benefits) {
      description += `\n\nBenefits:\n${job.benefits}`;
    }

    if (job.skills?.length) {
      description += `\n\nSkills: ${job.skills.join(', ')}`;
    }

    return description;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate feed format
   */
  async validateFeed(tenantId: string): Promise<{
    valid: boolean;
    jobCount: number;
    errors: string[];
    warnings: string[];
    feedUrl: string;
    xmlValid: boolean;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const jobs = await this.prisma.job.findMany({
      where: { tenantId, status: JobStatus.OPEN },
      include: { locations: true, department: true },
    });

    // Validate each job
    for (const job of jobs) {
      // Required fields
      if (!job.title) errors.push(`Job ${job.jobCode || job.id}: Missing title (required)`);
      if (!job.description) errors.push(`Job ${job.jobCode || job.id}: Missing description (required)`);

      // Recommended fields
      if (!job.locations?.[0]?.city) warnings.push(`Job ${job.jobCode || job.id}: Missing city (recommended)`);
      if (!job.locations?.[0]?.country) warnings.push(`Job ${job.jobCode || job.id}: Missing country (recommended)`);
      if (!job.employmentType) warnings.push(`Job ${job.jobCode || job.id}: Missing employment type (recommended)`);

      // Indeed specific validations
      if (job.description && job.description.length < 100) {
        warnings.push(`Job ${job.jobCode || job.id}: Description too short (min 100 chars recommended)`);
      }
      if (job.description && job.description.length > 10000) {
        warnings.push(`Job ${job.jobCode || job.id}: Description too long (max 10000 chars recommended)`);
      }
    }

    // Validate XML generation
    let xmlValid = true;
    try {
      const xml = await this.generateFeed(tenantId);
      // Basic XML validation
      if (!xml.includes('<?xml version="1.0"')) {
        errors.push('XML declaration missing');
        xmlValid = false;
      }
      if (!xml.includes('<source>') || !xml.includes('</source>')) {
        errors.push('Invalid XML structure');
        xmlValid = false;
      }
    } catch (error: any) {
      errors.push(`XML generation failed: ${error.message}`);
      xmlValid = false;
    }

    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';

    return {
      valid: errors.length === 0,
      jobCount: jobs.length,
      errors,
      warnings,
      feedUrl: `${baseUrl}/api/integrations/indeed/feed/${tenantId}`,
      xmlValid,
    };
  }

  /**
   * Test Indeed feed by fetching it
   */
  async testFeed(tenantId: string): Promise<{ success: boolean; message: string; preview?: string }> {
    try {
      const xml = await this.generateFeed(tenantId);
      const jobCount = (xml.match(/<job>/g) || []).length;

      return {
        success: true,
        message: `Feed generated successfully with ${jobCount} job(s)`,
        preview: xml.substring(0, 500) + (xml.length > 500 ? '...' : ''),
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Feed generation failed: ${error.message}`,
      };
    }
  }
}
