import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

export interface CareerSiteConfig {
  enabled: boolean;
  subdomain?: string;
  customDomain?: string;
  customDomainVerified?: boolean;

  // Branding
  branding: {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };

  // Layout
  layout: {
    template: 'modern' | 'classic' | 'minimal' | 'corporate';
    showHero: boolean;
    heroImage?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    showSearch: boolean;
    showFilters: boolean;
    showDepartmentFilter: boolean;
    showLocationFilter: boolean;
    showEmploymentTypeFilter: boolean;
    jobsPerPage: number;
    showCompanyInfo: boolean;
    showBenefits: boolean;
    showTestimonials: boolean;
  };

  // Company Info
  companyInfo: {
    name: string;
    tagline?: string;
    description?: string;
    mission?: string;
    values?: string[];
    culture?: string;
    benefits?: { icon: string; title: string; description: string }[];
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
      youtube?: string;
    };
  };

  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };

  // Custom CSS/JS
  customCode: {
    css?: string;
    headerScript?: string;
    footerScript?: string;
  };

  // Pages
  pages: {
    id: string;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    order: number;
  }[];

  // Testimonials
  testimonials: {
    id: string;
    name: string;
    role: string;
    image?: string;
    quote: string;
    isActive: boolean;
  }[];
}

const CAREER_SITE_SETTINGS_KEY = 'career_site_config';

@Injectable()
export class CareerSiteService {
  private readonly logger = new Logger(CareerSiteService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Get career site configuration
   */
  async getConfig(tenantId: string): Promise<CareerSiteConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: CAREER_SITE_SETTINGS_KEY } },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const defaultConfig: CareerSiteConfig = {
      enabled: true,
      branding: {
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
      },
      layout: {
        template: 'modern',
        showHero: true,
        heroTitle: `Join ${tenant?.name || 'Our Team'}`,
        heroSubtitle: 'Discover exciting career opportunities',
        showSearch: true,
        showFilters: true,
        showDepartmentFilter: true,
        showLocationFilter: true,
        showEmploymentTypeFilter: true,
        jobsPerPage: 10,
        showCompanyInfo: true,
        showBenefits: true,
        showTestimonials: false,
      },
      companyInfo: {
        name: tenant?.name || 'Company',
      },
      seo: {
        title: `Careers at ${tenant?.name || 'Company'}`,
        description: `Explore job opportunities at ${tenant?.name || 'our company'}`,
      },
      customCode: {},
      pages: [],
      testimonials: [],
    };

    if (!setting) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...(setting.value as unknown as Partial<CareerSiteConfig>),
    };
  }

  /**
   * Update career site configuration
   */
  async updateConfig(tenantId: string, config: Partial<CareerSiteConfig>): Promise<CareerSiteConfig> {
    const currentConfig = await this.getConfig(tenantId);
    const newConfig = this.deepMerge(currentConfig, config);

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: CAREER_SITE_SETTINGS_KEY } },
      update: { value: newConfig as any },
      create: {
        tenantId,
        key: CAREER_SITE_SETTINGS_KEY,
        value: newConfig as any,
        category: 'CAREER_SITE',
        isPublic: true,
      },
    });

    return newConfig;
  }

  /**
   * Get public career site data (for rendering)
   */
  async getPublicCareerSite(tenantId: string) {
    const config = await this.getConfig(tenantId);

    if (!config.enabled) {
      throw new NotFoundException('Career site is not enabled');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Get departments with job counts
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: { select: { jobs: { where: { status: JobStatus.OPEN } } } },
      },
    });

    // Get locations with job counts
    const locations = await this.prisma.location.findMany({
      where: { tenantId },
      select: {
        id: true,
        city: true,
        state: true,
        country: true,
        _count: { select: { jobs: { where: { status: JobStatus.OPEN } } } },
      },
    });

    // Get total open jobs count
    const totalJobs = await this.prisma.job.count({
      where: { tenantId, status: JobStatus.OPEN },
    });

    return {
      config,
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
        logo: tenant?.logo,
      },
      stats: {
        totalJobs,
        departments: departments.filter(d => d._count.jobs > 0),
        locations: locations.filter(l => l._count.jobs > 0),
      },
    };
  }

  /**
   * Get public job listings
   */
  async getPublicJobs(tenantId: string, params: {
    search?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    workLocation?: string;
    page?: number;
    limit?: number;
  }) {
    const config = await this.getConfig(tenantId);

    if (!config.enabled) {
      throw new NotFoundException('Career site is not enabled');
    }

    const page = params.page || 1;
    const limit = params.limit || config.layout.jobsPerPage || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      status: JobStatus.OPEN,
      internalOnly: false,
    };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.department) {
      where.departmentId = params.department;
    }

    if (params.location) {
      where.locationId = params.location;
    }

    if (params.employmentType) {
      where.employmentType = params.employmentType;
    }

    if (params.workLocation) {
      where.workLocation = params.workLocation;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          employmentType: true,
          workLocation: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          showSalary: true,
          publishedAt: true,
          department: { select: { id: true, name: true } },
          locations: { select: { id: true, city: true, state: true, country: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map(job => ({
        ...job,
        location: (job as any).locations?.[0],
        salary: job.showSalary && job.salaryMin && job.salaryMax
          ? `${job.salaryCurrency} ${job.salaryMin.toNumber().toLocaleString()} - ${job.salaryMax.toNumber().toLocaleString()}`
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single public job details
   */
  async getPublicJob(tenantId: string, jobId: string) {
    const config = await this.getConfig(tenantId);

    if (!config.enabled) {
      throw new NotFoundException('Career site is not enabled');
    }

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId,
        status: JobStatus.OPEN,
        internalOnly: false,
      },
      include: {
        department: { select: { id: true, name: true } },
        locations: { select: { id: true, city: true, state: true, country: true } },
        tenant: { select: { id: true, name: true, logo: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get related jobs
    const relatedJobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        status: JobStatus.OPEN,
        internalOnly: false,
        id: { not: jobId },
        OR: [
          { departmentId: job.departmentId },
          { skills: { hasSome: job.skills } },
        ],
      },
      select: {
        id: true,
        title: true,
        employmentType: true,
        locations: { select: { city: true, country: true } },
      },
      take: 3,
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        employmentType: job.employmentType,
        workLocation: job.workLocation,
        salary: job.showSalary && job.salaryMin && job.salaryMax
          ? `${job.salaryCurrency} ${job.salaryMin.toNumber().toLocaleString()} - ${job.salaryMax.toNumber().toLocaleString()}`
          : null,
        skills: job.skills,
        experience: job.experience,
        education: job.education,
        department: job.department,
        location: (job as any).locations?.[0],
        publishedAt: job.publishedAt,
        company: {
          name: job.tenant.name,
          logo: job.tenant.logo,
        },
      },
      relatedJobs,
      config: {
        branding: config.branding,
        companyInfo: config.companyInfo,
      },
    };
  }

  /**
   * Get career site URL
   */
  getCareerSiteUrl(tenantId: string, config: CareerSiteConfig): string {
    const baseUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';

    if (config.customDomain && config.customDomainVerified) {
      return `https://${config.customDomain}`;
    }

    if (config.subdomain) {
      return `https://${config.subdomain}.careers.ayphen.com`;
    }

    return `${baseUrl}/careers/${tenantId}`;
  }

  /**
   * Add a custom page
   */
  async addPage(tenantId: string, page: {
    title: string;
    slug: string;
    content: string;
    isPublished?: boolean;
  }) {
    const config = await this.getConfig(tenantId);

    // Check slug uniqueness
    if (config.pages.some(p => p.slug === page.slug)) {
      throw new BadRequestException('Page with this slug already exists');
    }

    const newPage = {
      id: `page_${Date.now()}`,
      title: page.title,
      slug: page.slug,
      content: page.content,
      isPublished: page.isPublished ?? true,
      order: config.pages.length,
    };

    config.pages.push(newPage);
    await this.updateConfig(tenantId, { pages: config.pages });

    return newPage;
  }

  /**
   * Update a page
   */
  async updatePage(tenantId: string, pageId: string, updates: Partial<{
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    order: number;
  }>) {
    const config = await this.getConfig(tenantId);
    const pageIndex = config.pages.findIndex(p => p.id === pageId);

    if (pageIndex === -1) {
      throw new NotFoundException('Page not found');
    }

    config.pages[pageIndex] = { ...config.pages[pageIndex], ...updates };
    await this.updateConfig(tenantId, { pages: config.pages });

    return config.pages[pageIndex];
  }

  /**
   * Delete a page
   */
  async deletePage(tenantId: string, pageId: string) {
    const config = await this.getConfig(tenantId);
    config.pages = config.pages.filter(p => p.id !== pageId);
    await this.updateConfig(tenantId, { pages: config.pages });
    return { success: true };
  }

  /**
   * Add testimonial
   */
  async addTestimonial(tenantId: string, testimonial: {
    name: string;
    role: string;
    image?: string;
    quote: string;
  }) {
    const config = await this.getConfig(tenantId);

    const newTestimonial = {
      id: `testimonial_${Date.now()}`,
      ...testimonial,
      isActive: true,
    };

    config.testimonials.push(newTestimonial);
    await this.updateConfig(tenantId, { testimonials: config.testimonials });

    return newTestimonial;
  }

  /**
   * Delete testimonial
   */
  async deleteTestimonial(tenantId: string, testimonialId: string) {
    const config = await this.getConfig(tenantId);
    config.testimonials = config.testimonials.filter(t => t.id !== testimonialId);
    await this.updateConfig(tenantId, { testimonials: config.testimonials });
    return { success: true };
  }

  /**
   * Preview career site (generates preview URL)
   */
  async generatePreviewUrl(tenantId: string): Promise<string> {
    const token = Buffer.from(`${tenantId}:${Date.now()}`).toString('base64');
    const baseUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    return `${baseUrl}/careers/preview?token=${token}`;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
