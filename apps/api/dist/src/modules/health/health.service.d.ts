import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        service: string;
        error: any;
    }>;
    getDetailedHealth(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        services: ({
            service: string;
            status: string;
            responseTime: number;
            lastChecked: string;
            message: string;
        } | {
            service: string;
            status: string;
            responseTime: number;
            lastChecked: string;
            message?: undefined;
        })[];
        database: {
            candidates: number;
            jobs: number;
            applications: number;
            interviews: number;
        };
        environment: {
            nodeVersion: string;
            platform: NodeJS.Platform;
            memory: {
                used: number;
                total: number;
            };
        };
    }>;
}
