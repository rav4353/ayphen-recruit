import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SuperAdminGateway } from '../super-admin.gateway';

@Injectable()
export class SuperAdminSettingsService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private gateway: SuperAdminGateway,
    ) { }

    async onModuleInit() {
        // Initialize default settings if they don't exist
        await this.initializeDefaults();
    }

    async getAll() {
        const settings = await this.prisma.globalSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);
    }

    async get(key: string) {
        const setting = await this.prisma.globalSetting.findUnique({
            where: { key },
        });
        return setting?.value;
    }

    async update(key: string, value: any) {
        const setting = await this.prisma.globalSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        // Broadcast change
        this.gateway.broadcast('setting_updated', { key, value });

        return setting;
    }

    async getEmailConfig() {
        const host = await this.get('smtp_host');
        const port = await this.get('smtp_port');
        const user = await this.get('smtp_user');
        const password = await this.get('smtp_password');
        const fromEmail = await this.get('smtp_from_email');
        const fromName = await this.get('smtp_from_name');
        const secure = await this.get('smtp_secure');

        return { host, port, user, password, fromEmail, fromName, secure };
    }

    async updateEmailConfig(config: any) {
        const promises = Object.entries(config).map(([key, value]) => {
            return this.update(`smtp_${key}`, value);
        });
        await Promise.all(promises);
    }

    async getFeatureFlags() {
        const flags = await this.prisma.globalSetting.findMany({
            where: { key: { startsWith: 'feature_flag_' } },
        });
        return flags.map(f => ({
            key: f.key.replace('feature_flag_', ''),
            enabled: f.value,
        }));
    }

    async updateFeatureFlag(flag: string, enabled: boolean) {
        await this.update(`feature_flag_${flag}`, enabled);
    }

    async getMaintenanceMode() {
        const enabled = await this.get('maintenance_mode') || false;
        const message = await this.get('maintenance_message') || 'System is currently undergoing maintenance. Please check back later.';
        return { enabled, message };
    }

    async setMaintenanceMode(enabled: boolean, message?: string) {
        await this.update('maintenance_mode', enabled);
        if (message !== undefined) {
            await this.update('maintenance_message', message);
        }
        this.gateway.broadcast('maintenance_mode_changed', { enabled, message });
    }

    private async initializeDefaults() {
        const defaults = [
            // General settings
            { key: 'maintenance_mode', value: false, category: 'general' },
            { key: 'maintenance_message', value: 'System is currently undergoing maintenance. Please check back later.', category: 'general' },
            { key: 'allow_new_registrations', value: true, category: 'general' },
            { key: 'require_email_verification', value: true, category: 'general' },
            
            // Security settings
            { key: 'global_mfa_enforced', value: false, category: 'security' },
            { key: 'session_timeout', value: 60, category: 'security' },
            { key: 'max_login_attempts', value: 5, category: 'security' },
            { key: 'lockout_duration', value: 30, category: 'security' },
            { key: 'enforce_strong_passwords', value: true, category: 'security' },
            { key: 'block_tor_exit_nodes', value: true, category: 'security' },
            { key: 'auto_block_suspicious_ips', value: true, category: 'security' },
            
            // Feature flags
            { key: 'feature_flag_ai_resume_parsing', value: true, category: 'features' },
            { key: 'feature_flag_ai_jd_generation', value: true, category: 'features' },
            { key: 'feature_flag_video_interviews', value: false, category: 'features' },
            { key: 'feature_flag_advanced_analytics', value: true, category: 'features' },
            { key: 'feature_flag_calendar_sync', value: true, category: 'features' },
            { key: 'feature_flag_bulk_actions', value: true, category: 'features' },
            { key: 'feature_flag_ai_candidate_matching', value: true, category: 'features' },
            { key: 'feature_flag_esignature', value: true, category: 'features' },
            { key: 'feature_flag_background_checks', value: true, category: 'features' },
            { key: 'feature_flag_onboarding', value: true, category: 'features' },
            
            // Backup settings
            { key: 'backup_schedule', value: 'weekly', category: 'system' },
            { key: 'backup_retention_days', value: 30, category: 'system' },
        ];

        for (const def of defaults) {
            const existing = await this.prisma.globalSetting.findUnique({
                where: { key: def.key },
            });
            if (!existing) {
                await this.prisma.globalSetting.create({
                    data: {
                        key: def.key,
                        value: def.value,
                        category: def.category,
                    },
                });
            }
        }
    }

    async getFeatureFlagsWithMetadata() {
        const featureFlagMetadata: Record<string, { name: string; description: string }> = {
            'ai_resume_parsing': { name: 'AI Resume Parsing', description: 'Enable AI-powered resume parsing for candidates' },
            'ai_jd_generation': { name: 'AI Job Description', description: 'Enable AI-assisted job description generation' },
            'video_interviews': { name: 'Video Interviews', description: 'Enable integrated video interview functionality' },
            'advanced_analytics': { name: 'Advanced Analytics', description: 'Enable advanced reporting and analytics features' },
            'calendar_sync': { name: 'Calendar Sync', description: 'Enable calendar integration for interview scheduling' },
            'bulk_actions': { name: 'Bulk Actions', description: 'Enable bulk operations on candidates and applications' },
            'ai_candidate_matching': { name: 'AI Candidate Matching', description: 'Enable AI-powered candidate-job matching' },
            'esignature': { name: 'E-Signature', description: 'Enable electronic signature for offer letters' },
            'background_checks': { name: 'Background Checks', description: 'Enable background verification integration' },
            'onboarding': { name: 'Onboarding', description: 'Enable employee onboarding workflows' },
        };

        const flags = await this.prisma.globalSetting.findMany({
            where: { key: { startsWith: 'feature_flag_' } },
        });

        return flags.map(f => {
            const key = f.key.replace('feature_flag_', '');
            const metadata = featureFlagMetadata[key] || { name: key, description: '' };
            return {
                key,
                name: metadata.name,
                description: metadata.description,
                enabled: f.value === true || f.value === 'true',
            };
        });
    }
}
