import { SlaService } from './sla.service';
import { JwtPayload } from '../auth/auth.service';
import { UpdateStageSlaDto } from './dto/sla.dto';
export declare class SlaController {
    private readonly slaService;
    constructor(slaService: SlaService);
    getApplicationSla(id: string): Promise<{
        data: import("./sla.service").SLAStatus | null;
    }>;
    getAtRiskApplications(user: JwtPayload): Promise<{
        data: {
            atRisk: any[];
            overdue: any[];
        };
    }>;
    getJobSlaStats(jobId: string): Promise<{
        data: {
            total: number;
            onTrack: number;
            atRisk: number;
            overdue: number;
            percentage: {
                onTrack: number;
                atRisk: number;
                overdue: number;
            };
        };
    }>;
    getAverageTimeInStage(stageId: string): Promise<{
        data: {
            averageDays: number;
        };
    }>;
    updateStageSla(stageId: string, dto: UpdateStageSlaDto): Promise<{
        data: {
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
        };
    }>;
}
