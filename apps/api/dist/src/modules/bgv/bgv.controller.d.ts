import { ApiResponse } from '../../common/dto/api-response.dto';
import { BGVService } from './bgv.service';
declare class ConfigureBGVDto {
    provider: 'CHECKR' | 'SPRINGVERIFY' | 'AUTHBRIDGE' | 'MANUAL';
    apiKey: string;
    apiSecret?: string;
    webhookUrl?: string;
    sandboxMode?: boolean;
}
declare class InitiateBGVDto {
    candidateId: string;
    applicationId?: string;
    packageType?: string;
    checkTypes?: string[];
}
export declare class BGVController {
    private readonly bgvService;
    constructor(bgvService: BGVService);
    getSettings(req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.BGVProvider;
        isConfigured: boolean;
        sandboxMode: boolean;
    } | null>>;
    configure(dto: ConfigureBGVDto, req: any): Promise<ApiResponse<{
        id: string;
        provider: import("@prisma/client").$Enums.BGVProvider;
        isConfigured: boolean;
    }>>;
    initiate(dto: InitiateBGVDto, req: any): Promise<ApiResponse<{
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
    }>>;
    listChecks(req: any, status?: string, candidateId?: string): Promise<ApiResponse<({
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
    })[]>>;
    getCheck(id: string, req: any): Promise<ApiResponse<{
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
    }>>;
    syncStatus(id: string, req: any): Promise<ApiResponse<{
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
    }>>;
    cancel(id: string, req: any): Promise<ApiResponse<{
        success: boolean;
    }>>;
    getPackages(req: any): Promise<ApiResponse<{
        id: string;
        name: string;
        screenings: string[];
    }[] | {
        id: string;
        name: string;
        description: string;
        checks: string[];
    }[]>>;
    getDashboard(req: any): Promise<ApiResponse<{
        total: number;
        pending: number;
        inProgress: number;
        clear: number;
        consider: number;
        clearRate: number;
    }>>;
    handleWebhook(provider: string, payload: any): Promise<{
        received: boolean;
    }>;
}
export {};
