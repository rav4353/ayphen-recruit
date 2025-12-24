import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DEFAULT_STATUS_COLORS } from "./constants/default-status-colors";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    return this.prisma.setting.findMany({
      where: { tenantId },
    });
  }

  async getSettingByKey(tenantId: string, key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return setting;
  }

  async updateSetting(
    tenantId: string,
    key: string,
    value: any,
    category: string = "GENERAL",
    isPublic: boolean = false,
  ) {
    return this.prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
      update: {
        value,
        category,
        isPublic,
      },
      create: {
        tenantId,
        key,
        value,
        category,
        isPublic,
      },
    });
  }

  async getPublicSettings(tenantId: string) {
    return this.prisma.setting.findMany({
      where: {
        tenantId,
        isPublic: true,
      },
    });
  }

  async getStatusColors(tenantId: string) {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: {
          tenantId_key: {
            tenantId,
            key: "status_colors",
          },
        },
      });

      if (!setting) {
        // Return default colors if not found
        return DEFAULT_STATUS_COLORS;
      }

      return setting.value;
    } catch (error) {
      // Return default colors on error
      return DEFAULT_STATUS_COLORS;
    }
  }

  async resetStatusColors(tenantId: string) {
    return this.prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: "status_colors",
        },
      },
      update: {
        value: DEFAULT_STATUS_COLORS,
        category: "APPEARANCE",
        isPublic: true,
      },
      create: {
        tenantId,
        key: "status_colors",
        value: DEFAULT_STATUS_COLORS,
        category: "APPEARANCE",
        isPublic: true,
      },
    });
  }

  // Scorecard Templates (Temporary Workaround)
  async createScorecard(tenantId: string, data: any) {
    return this.prisma.scorecardTemplate.create({
      data: { ...data, tenantId },
    });
  }

  async getScorecards(tenantId: string) {
    return this.prisma.scorecardTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getScorecard(id: string) {
    const template = await this.prisma.scorecardTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("Template not found");
    return template;
  }

  async updateScorecard(id: string, data: any) {
    return this.prisma.scorecardTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteScorecard(id: string) {
    return this.prisma.scorecardTemplate.delete({
      where: { id },
    });
  }

  /**
   * Check if a specific setting is configured (exists and has valid value)
   */
  async isSettingConfigured(tenantId: string, key: string): Promise<boolean> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key } },
      });
      return !!(setting && setting.value);
    } catch {
      return false;
    }
  }

  /**
   * Get configuration status for all required settings
   */
  async getConfigurationStatus(tenantId: string) {
    const requiredSettings = [
      { key: "candidate_id_settings", label: "Candidate ID", category: "ID Configuration" },
      { key: "job_id_settings", label: "Job ID", category: "ID Configuration" },
      { key: "application_id_settings", label: "Application ID", category: "ID Configuration" },
      { key: "smtp_config", label: "Email (SMTP)", category: "Communication" },
    ];

    const status: Record<string, { configured: boolean; label: string; category: string }> = {};

    for (const setting of requiredSettings) {
      status[setting.key] = {
        configured: await this.isSettingConfigured(tenantId, setting.key),
        label: setting.label,
        category: setting.category,
      };
    }

    return status;
  }

  /**
   * Check if ID settings are configured (required before creating candidates/jobs/applications)
   */
  async validateIdSettingsConfigured(
    tenantId: string,
    requiredSettings: ("candidate_id_settings" | "job_id_settings" | "application_id_settings")[],
  ): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const key of requiredSettings) {
      const isConfigured = await this.isSettingConfigured(tenantId, key);
      if (!isConfigured) {
        missing.push(key);
      }
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Check if SMTP is configured for tenant
   */
  async isSmtpConfigured(tenantId: string): Promise<boolean> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: "smtp_config" } },
      });

      if (!setting || !setting.value) return false;

      const config = setting.value as any;
      return !!(config.host && config.user && config.pass);
    } catch {
      return false;
    }
  }
}
