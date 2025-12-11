import { PrismaService } from '../../prisma/prisma.service';
import { CheckrService } from './providers/checkr.service';
type BGVProvider = 'CHECKR' | 'SPRINGVERIFY' | 'AUTHBRIDGE' | 'MANUAL';
type BGVStatus = 'PENDING' | 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLEAR' | 'CONSIDER' | 'FAILED' | 'CANCELLED';
interface ConfigureBGVDto {
    provider: BGVProvider;
    apiKey: string;
    apiSecret?: string;
    webhookUrl?: string;
    sandboxMode?: boolean;
}
interface InitiateBGVDto {
    candidateId: string;
    applicationId?: string;
    packageType?: string;
    checkTypes?: string[];
}
export declare class BGVService {
    private readonly prisma;
    private readonly checkr;
    private readonly logger;
    constructor(prisma: PrismaService, checkr: CheckrService);
    getSettings(tenantId: string): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.BGVProvider;
        isConfigured: boolean;
        sandboxMode: boolean;
    } | null>;
    configure(tenantId: string, dto: ConfigureBGVDto): Promise<{
        id: string;
        provider: import("@prisma/client").$Enums.BGVProvider;
        isConfigured: boolean;
    }>;
    initiate(tenantId: string, userId: string, dto: InitiateBGVDto): Promise<{
        candidate: {
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BGVStatus;
        candidateId: string;
        applicationId: string | null;
        completedAt: Date | null;
        provider: import("@prisma/client").$Enums.BGVProvider;
        externalId: string | null;
        packageType: string | null;
        checkTypes: import("@prisma/client").$Enums.BGVCheckType[];
        reportUrl: string | null;
        discrepancies: import("@prisma/client/runtime/library").JsonValue | null;
        initiatedAt: Date | null;
        initiatedById: string | null;
    }>;
    getCheck(tenantId: string, checkId: string): Promise<{
        candidate: {
            email: string;
            tenantId: string;
            firstName: string;
            lastName: string;
        };
        application: {
            job: {
                title: string;
            };
            id: string;
        } | null;
        initiatedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BGVStatus;
        candidateId: string;
        applicationId: string | null;
        completedAt: Date | null;
        provider: import("@prisma/client").$Enums.BGVProvider;
        externalId: string | null;
        packageType: string | null;
        checkTypes: import("@prisma/client").$Enums.BGVCheckType[];
        reportUrl: string | null;
        discrepancies: import("@prisma/client/runtime/library").JsonValue | null;
        initiatedAt: Date | null;
        initiatedById: string | null;
    }>;
    listChecks(tenantId: string, filters?: {
        status?: BGVStatus;
        candidateId?: string;
    }): Promise<({
        candidate: {
            email: string;
            firstName: string;
            lastName: string;
        };
        application: {
            job: {
                title: string;
            };
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BGVStatus;
        candidateId: string;
        applicationId: string | null;
        completedAt: Date | null;
        provider: import("@prisma/client").$Enums.BGVProvider;
        externalId: string | null;
        packageType: string | null;
        checkTypes: import("@prisma/client").$Enums.BGVCheckType[];
        reportUrl: string | null;
        discrepancies: import("@prisma/client/runtime/library").JsonValue | null;
        initiatedAt: Date | null;
        initiatedById: string | null;
    })[]>;
    syncStatus(tenantId: string, checkId: string): Promise<{
        candidate: {
            email: string;
            tenantId: string;
            firstName: string;
            lastName: string;
        };
        application: {
            job: {
                title: string;
            };
            id: string;
        } | null;
        initiatedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BGVStatus;
        candidateId: string;
        applicationId: string | null;
        completedAt: Date | null;
        provider: import("@prisma/client").$Enums.BGVProvider;
        externalId: string | null;
        packageType: string | null;
        checkTypes: import("@prisma/client").$Enums.BGVCheckType[];
        reportUrl: string | null;
        discrepancies: import("@prisma/client/runtime/library").JsonValue | null;
        initiatedAt: Date | null;
        initiatedById: string | null;
    }>;
    handleWebhook(provider: string, payload: any): Promise<{
        received: boolean;
    }>;
    cancel(tenantId: string, checkId: string): Promise<{
        success: boolean;
    }>;
    getPackages(tenantId: string): Promise<{
        id: string;
        name: string;
        screenings: string[];
    }[] | {
        id: string;
        name: string;
        description: string;
        checks: string[];
    }[]>;
    getDashboard(tenantId: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        clear: number;
        consider: number;
        clearRate: number;
    }>;
}
export {};
