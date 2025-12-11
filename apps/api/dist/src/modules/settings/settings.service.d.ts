import { PrismaService } from '../../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSettings(tenantId: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    getSettingByKey(tenantId: string, key: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    updateSetting(tenantId: string, key: string, value: any, category?: string, isPublic?: boolean): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    getPublicSettings(tenantId: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    getStatusColors(tenantId: string): Promise<import("@prisma/client/runtime/library").JsonValue | {
        job: {
            DRAFT: {
                bg: string;
                text: string;
            };
            OPEN: {
                bg: string;
                text: string;
            };
            CLOSED: {
                bg: string;
                text: string;
            };
            ON_HOLD: {
                bg: string;
                text: string;
            };
            PENDING_APPROVAL: {
                bg: string;
                text: string;
            };
            APPROVED: {
                bg: string;
                text: string;
            };
            CANCELLED: {
                bg: string;
                text: string;
            };
        };
        application: {
            APPLIED: {
                bg: string;
                text: string;
            };
            SCREENING: {
                bg: string;
                text: string;
            };
            PHONE_SCREEN: {
                bg: string;
                text: string;
            };
            INTERVIEW: {
                bg: string;
                text: string;
            };
            OFFER: {
                bg: string;
                text: string;
            };
            HIRED: {
                bg: string;
                text: string;
            };
            REJECTED: {
                bg: string;
                text: string;
            };
            WITHDRAWN: {
                bg: string;
                text: string;
            };
        };
    }>;
    resetStatusColors(tenantId: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    createScorecard(tenantId: string, data: any): Promise<any>;
    getScorecards(tenantId: string): Promise<any>;
    getScorecard(id: string): Promise<any>;
    updateScorecard(id: string, data: any): Promise<any>;
    deleteScorecard(id: string): Promise<any>;
}
