import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  headline?: string;
  location?: string;
  positions?: {
    title: string;
    companyName: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
  }[];
  educations?: {
    schoolName: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  }[];
  skills?: string[];
  summary?: string;
}

interface LinkedInApplyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  companyId?: string;
}

const LINKEDIN_SETTINGS_KEY = 'linkedin_apply_settings';

@Injectable()
export class LinkedInApplyService {
  private readonly logger = new Logger(LinkedInApplyService.name);
  private readonly linkedInAuthUrl = 'https://www.linkedin.com/oauth/v2/authorization';
  private readonly linkedInTokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  private readonly linkedInApiUrl = 'https://api.linkedin.com/v2';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get LinkedIn OAuth configuration
   */
  async getConfig(tenantId: string): Promise<{ isConfigured: boolean; clientId?: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: LINKEDIN_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as LinkedInApplyConfig;
    return {
      isConfigured: !!(config?.clientId && config?.clientSecret),
      clientId: config?.clientId,
    };
  }

  /**
   * Configure LinkedIn Apply integration
   */
  async configure(tenantId: string, config: LinkedInApplyConfig) {
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: LINKEDIN_SETTINGS_KEY } },
      update: { value: config as any, category: 'INTEGRATION' },
      create: {
        tenantId,
        key: LINKEDIN_SETTINGS_KEY,
        value: config as any,
        category: 'INTEGRATION',
        isPublic: false,
      },
    });

    return { success: true };
  }

  /**
   * Generate OAuth URL for LinkedIn Apply button
   */
  async getOAuthUrl(tenantId: string, jobId: string, state?: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: LINKEDIN_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as LinkedInApplyConfig;
    if (!config?.clientId) {
      throw new BadRequestException('LinkedIn Apply not configured');
    }

    const scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social'];
    const stateParam = state || `${tenantId}:${jobId}:${Date.now()}`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: stateParam,
      scope: scopes.join(' '),
    });

    return `${this.linkedInAuthUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(tenantId: string, code: string): Promise<string> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: LINKEDIN_SETTINGS_KEY } },
    });

    const config = setting?.value as unknown as LinkedInApplyConfig;
    if (!config?.clientId || !config?.clientSecret) {
      throw new BadRequestException('LinkedIn Apply not configured');
    }

    this.logger.log('Exchanging LinkedIn auth code for token');

    try {
      const response = await fetch(this.linkedInTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('LinkedIn token exchange failed:', error);
        throw new BadRequestException('Failed to exchange authorization code');
      }

      const data = await response.json() as { access_token: string };
      return data.access_token;
    } catch (error: any) {
      this.logger.error('LinkedIn token exchange error:', error.message);
      throw new BadRequestException('LinkedIn authentication failed');
    }
  }

  /**
   * Get LinkedIn profile using access token
   */
  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    this.logger.log('Fetching LinkedIn profile');

    try {
      // Fetch basic profile
      const profileResponse = await fetch(`${this.linkedInApiUrl}/me?projection=(id,firstName,lastName,profilePicture,headline)`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch LinkedIn profile');
      }

      const profileData = await profileResponse.json() as any;

      // Fetch email address
      const emailResponse = await fetch(`${this.linkedInApiUrl}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      let email = '';
      if (emailResponse.ok) {
        const emailData = await emailResponse.json() as any;
        email = emailData.elements?.[0]?.['handle~']?.emailAddress || '';
      }

      // Extract localized names
      const firstName = profileData.firstName?.localized?.en_US || 
                       profileData.firstName?.localized?.[Object.keys(profileData.firstName?.localized || {})[0]] || '';
      const lastName = profileData.lastName?.localized?.en_US || 
                      profileData.lastName?.localized?.[Object.keys(profileData.lastName?.localized || {})[0]] || '';

      return {
        id: profileData.id,
        firstName,
        lastName,
        email,
        headline: profileData.headline?.localized?.en_US || profileData.headline,
        profilePictureUrl: profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
    } catch (error: any) {
      this.logger.error('LinkedIn profile fetch error:', error.message);
      throw new BadRequestException('Failed to fetch LinkedIn profile');
    }
  }

  /**
   * Process LinkedIn Apply callback and create candidate/application
   */
  async processApply(
    tenantId: string,
    jobId: string,
    code: string,
  ): Promise<{ candidateId: string; applicationId: string }> {
    // Exchange code for token
    const accessToken = await this.exchangeCodeForToken(tenantId, code);

    // Get profile
    const profile = await this.getProfile(accessToken);

    // Check if candidate exists
    let candidate = await this.prisma.candidate.findFirst({
      where: { email: profile.email, tenantId },
    });

    if (!candidate) {
      // Create new candidate
      candidate = await this.prisma.candidate.create({
        data: {
          tenantId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: null,
          currentTitle: profile.headline,
          location: profile.location,
          linkedinUrl: `https://www.linkedin.com/in/${profile.id}`,
          skills: profile.skills || [],
          summary: profile.summary,
          experience: profile.positions as any,
          education: profile.educations as any,
          source: 'LINKEDIN_APPLY',
          sourceDetails: `Applied via LinkedIn for job ${jobId}`,
        },
      });
    }

    // Check if application exists
    const existingApp = await this.prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId },
    });

    if (existingApp) {
      return { candidateId: candidate.id, applicationId: existingApp.id };
    }

    // Create application
    const application = await this.prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId,
        status: 'APPLIED',
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'LINKEDIN_APPLY',
        description: `Candidate applied via LinkedIn Apply`,
        candidateId: candidate.id,
        applicationId: application.id,
        metadata: {
          source: 'LINKEDIN_APPLY',
          linkedInId: profile.id,
        },
      },
    });

    return { candidateId: candidate.id, applicationId: application.id };
  }

  /**
   * Generate LinkedIn Apply button HTML/config for embedding
   */
  getApplyButtonConfig(jobId: string, tenantId: string) {
    return {
      buttonType: 'LINKEDIN_APPLY',
      jobId,
      tenantId,
      buttonText: 'Apply with LinkedIn',
      buttonStyle: {
        backgroundColor: '#0077B5',
        color: '#ffffff',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '600',
      },
    };
  }
}
