import { PrismaService } from '../../prisma/prisma.service';
export interface SLAStatus {
    status: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
    daysInStage: number;
    slaLimit: number;
    daysRemaining: number;
}
export declare class SlaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculateSlaStatus(applicationId: string): Promise<SLAStatus | null>;
    getAtRiskApplications(tenantId?: string): Promise<{
        atRisk: any[];
        overdue: any[];
    }>;
    checkSlas(): Promise<void>;
    private sendSlaNotification;
    getJobSlaStats(jobId: string): Promise<{
        total: number;
        onTrack: number;
        atRisk: number;
        overdue: number;
        percentage: {
            onTrack: number;
            atRisk: number;
            overdue: number;
        };
    }>;
    updateStageSla(stageId: string, slaDays: number): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        order: number;
        pipelineId: string;
        color: string | null;
        slaDays: number | null;
        isTerminal: boolean;
    }>;
    getAverageTimeInStage(stageId: string): Promise<number>;
}
