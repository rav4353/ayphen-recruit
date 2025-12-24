import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

interface DomainConfig {
  subdomain?: string;
  customDomain?: string;
  customDomainStatus: "pending" | "verifying" | "verified" | "failed";
  verificationToken?: string;
  verificationMethod: "cname" | "txt";
  sslStatus: "pending" | "provisioning" | "active" | "failed";
  lastVerificationAttempt?: Date;
  verifiedAt?: Date;
}

const DOMAIN_CONFIG_KEY = "custom_domain_config";

@Injectable()
export class CustomDomainService {
  private readonly logger = new Logger(CustomDomainService.name);
  private readonly targetCname = "careers.ayphen.com";

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get domain configuration for a tenant
   */
  async getDomainConfig(tenantId: string): Promise<DomainConfig | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: DOMAIN_CONFIG_KEY } },
    });

    return setting?.value as unknown as DomainConfig | null;
  }

  /**
   * Set subdomain for career site
   */
  async setSubdomain(
    tenantId: string,
    subdomain: string,
  ): Promise<{ subdomain: string; url: string }> {
    // Validate subdomain format
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      throw new BadRequestException(
        "Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.",
      );
    }

    if (subdomain.length < 3 || subdomain.length > 63) {
      throw new BadRequestException(
        "Subdomain must be between 3 and 63 characters",
      );
    }

    // Check reserved subdomains
    const reserved = [
      "www",
      "api",
      "app",
      "admin",
      "mail",
      "careers",
      "jobs",
      "support",
      "help",
    ];
    if (reserved.includes(subdomain)) {
      throw new BadRequestException("This subdomain is reserved");
    }

    // Check if subdomain is already taken
    const existing = await this.prisma.setting.findFirst({
      where: {
        key: DOMAIN_CONFIG_KEY,
        NOT: { tenantId },
      },
    });

    if (existing) {
      const existingConfig = existing.value as unknown as DomainConfig;
      if (existingConfig?.subdomain === subdomain) {
        throw new ConflictException("This subdomain is already taken");
      }
    }

    const config = (await this.getDomainConfig(tenantId)) || {
      customDomainStatus: "pending" as const,
      verificationMethod: "cname" as const,
      sslStatus: "pending" as const,
    };

    config.subdomain = subdomain;

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: DOMAIN_CONFIG_KEY } },
      update: { value: config as any },
      create: {
        tenantId,
        key: DOMAIN_CONFIG_KEY,
        value: config as any,
        category: "DOMAIN",
        isPublic: false,
      },
    });

    return {
      subdomain,
      url: `https://${subdomain}.careers.ayphen.com`,
    };
  }

  /**
   * Add custom domain
   */
  async addCustomDomain(
    tenantId: string,
    domain: string,
  ): Promise<{
    domain: string;
    verificationMethod: string;
    verificationToken: string;
    instructions: string[];
  }> {
    // Validate domain format
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      throw new BadRequestException("Invalid domain format");
    }

    // Check if domain is already used by another tenant
    const existingSettings = await this.prisma.setting.findMany({
      where: { key: DOMAIN_CONFIG_KEY },
    });

    for (const setting of existingSettings) {
      const config = setting.value as unknown as DomainConfig;
      if (config?.customDomain === domain && setting.tenantId !== tenantId) {
        throw new ConflictException("This domain is already registered");
      }
    }

    // Generate verification token
    const verificationToken = `ayphen-verify-${Buffer.from(`${tenantId}:${Date.now()}`).toString("base64").slice(0, 32)}`;

    const config: DomainConfig = {
      ...(await this.getDomainConfig(tenantId)),
      customDomain: domain,
      customDomainStatus: "pending",
      verificationToken,
      verificationMethod: "cname",
      sslStatus: "pending",
    };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: DOMAIN_CONFIG_KEY } },
      update: { value: config as any },
      create: {
        tenantId,
        key: DOMAIN_CONFIG_KEY,
        value: config as any,
        category: "DOMAIN",
        isPublic: false,
      },
    });

    return {
      domain,
      verificationMethod: "cname",
      verificationToken,
      instructions: [
        `Add a CNAME record for "${domain}" pointing to "${this.targetCname}"`,
        `OR add a TXT record "_ayphen-verification.${domain}" with value "${verificationToken}"`,
        "DNS changes may take up to 48 hours to propagate",
        'Click "Verify Domain" once you have configured the DNS records',
      ],
    };
  }

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(tenantId: string): Promise<{
    verified: boolean;
    method?: string;
    message: string;
  }> {
    const config = await this.getDomainConfig(tenantId);

    if (!config?.customDomain) {
      throw new BadRequestException("No custom domain configured");
    }

    config.lastVerificationAttempt = new Date();
    config.customDomainStatus = "verifying";

    // Update status to verifying
    await this.updateDomainConfig(tenantId, config);

    try {
      // Try CNAME verification first
      const cnameVerified = await this.verifyCname(config.customDomain);
      if (cnameVerified) {
        config.customDomainStatus = "verified";
        config.verifiedAt = new Date();
        config.sslStatus = "provisioning";
        await this.updateDomainConfig(tenantId, config);

        // In production, trigger SSL certificate provisioning here
        this.logger.log(`Domain ${config.customDomain} verified via CNAME`);

        return {
          verified: true,
          method: "cname",
          message:
            "Domain verified successfully! SSL certificate is being provisioned.",
        };
      }

      // Try TXT verification
      const txtVerified = await this.verifyTxt(
        config.customDomain,
        config.verificationToken!,
      );
      if (txtVerified) {
        config.customDomainStatus = "verified";
        config.verifiedAt = new Date();
        config.sslStatus = "provisioning";
        await this.updateDomainConfig(tenantId, config);

        this.logger.log(`Domain ${config.customDomain} verified via TXT`);

        return {
          verified: true,
          method: "txt",
          message:
            "Domain verified successfully! SSL certificate is being provisioned.",
        };
      }

      // Verification failed
      config.customDomainStatus = "failed";
      await this.updateDomainConfig(tenantId, config);

      return {
        verified: false,
        message:
          "Domain verification failed. Please check your DNS configuration and try again.",
      };
    } catch (error) {
      this.logger.error(
        `Domain verification error for ${config.customDomain}:`,
        error,
      );

      config.customDomainStatus = "failed";
      await this.updateDomainConfig(tenantId, config);

      return {
        verified: false,
        message: "Domain verification failed. DNS lookup error.",
      };
    }
  }

  /**
   * Remove custom domain
   */
  async removeCustomDomain(tenantId: string): Promise<{ success: boolean }> {
    const config = await this.getDomainConfig(tenantId);

    if (config) {
      config.customDomain = undefined;
      config.customDomainStatus = "pending";
      config.verificationToken = undefined;
      config.sslStatus = "pending";
      config.verifiedAt = undefined;

      await this.updateDomainConfig(tenantId, config);
    }

    return { success: true };
  }

  /**
   * Get DNS configuration instructions
   */
  getDnsInstructions(domain: string, verificationToken: string) {
    return {
      cname: {
        type: "CNAME",
        host: domain,
        value: this.targetCname,
        description: "Point your domain to our career site servers",
      },
      txt: {
        type: "TXT",
        host: `_ayphen-verification.${domain}`,
        value: verificationToken,
        description: "Alternative verification method",
      },
      note: "DNS changes typically propagate within 24-48 hours",
    };
  }

  /**
   * Check domain status
   */
  async checkDomainStatus(tenantId: string): Promise<{
    subdomain?: { name: string; url: string; active: boolean };
    customDomain?: {
      domain: string;
      status: string;
      sslStatus: string;
      verifiedAt?: Date;
      url?: string;
    };
  }> {
    const config = await this.getDomainConfig(tenantId);

    const result: any = {};

    if (config?.subdomain) {
      result.subdomain = {
        name: config.subdomain,
        url: `https://${config.subdomain}.careers.ayphen.com`,
        active: true,
      };
    }

    if (config?.customDomain) {
      result.customDomain = {
        domain: config.customDomain,
        status: config.customDomainStatus,
        sslStatus: config.sslStatus,
        verifiedAt: config.verifiedAt,
        url:
          config.customDomainStatus === "verified"
            ? `https://${config.customDomain}`
            : undefined,
      };
    }

    return result;
  }

  /**
   * Resolve tenant from domain (for routing)
   */
  async resolveTenantFromDomain(domain: string): Promise<string | null> {
    // Check subdomain
    const subdomainMatch = domain.match(/^([^.]+)\.careers\.ayphen\.com$/);
    if (subdomainMatch) {
      const subdomain = subdomainMatch[1];
      const setting = await this.prisma.setting.findFirst({
        where: { key: DOMAIN_CONFIG_KEY },
      });

      if (setting) {
        const config = setting.value as unknown as DomainConfig;
        if (config?.subdomain === subdomain) {
          return setting.tenantId;
        }
      }
    }

    // Check custom domain
    const settings = await this.prisma.setting.findMany({
      where: { key: DOMAIN_CONFIG_KEY },
    });

    for (const setting of settings) {
      const config = setting.value as unknown as DomainConfig;
      if (
        config?.customDomain === domain &&
        config.customDomainStatus === "verified"
      ) {
        return setting.tenantId;
      }
    }

    return null;
  }

  private async verifyCname(domain: string): Promise<boolean> {
    try {
      const records = await resolveCname(domain);
      return records.some(
        (record) =>
          record.toLowerCase() === this.targetCname.toLowerCase() ||
          record.toLowerCase().endsWith(`.${this.targetCname.toLowerCase()}`),
      );
    } catch {
      return false;
    }
  }

  private async verifyTxt(domain: string, token: string): Promise<boolean> {
    try {
      const records = await resolveTxt(`_ayphen-verification.${domain}`);
      return records.some((record) => record.join("").includes(token));
    } catch {
      return false;
    }
  }

  private async updateDomainConfig(
    tenantId: string,
    config: DomainConfig,
  ): Promise<void> {
    await this.prisma.setting.update({
      where: { tenantId_key: { tenantId, key: DOMAIN_CONFIG_KEY } },
      data: { value: config as any },
    });
  }
}
