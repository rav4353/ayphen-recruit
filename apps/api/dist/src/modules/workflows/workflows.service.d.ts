import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
export interface WorkflowTrigger {
    type: 'STAGE_ENTER' | 'STAGE_EXIT' | 'TIME_IN_STAGE' | 'APPLICATION_CREATED' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED';
    stageId?: string;
    delayHours?: number;
    conditions?: Record<string, any>;
}
export interface WorkflowAction {
    type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK' | 'REQUEST_FEEDBACK' | 'MOVE_STAGE' | 'SEND_SMS' | 'NOTIFY_USER' | 'UPDATE_STATUS';
    config: Record<string, any>;
}
export declare class WorkflowsService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    executeTimeBasedWorkflows(): Promise<void>;
    executeStageWorkflows(applicationId: string, newStageId: string, oldStageId?: string): Promise<void>;
    private executeWorkflow;
    private checkConditions;
    private executeAction;
    private sendEmail;
    private addTag;
    private createTask;
    private requestFeedback;
    getWorkflowsByStage(stageId: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        trigger: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
        delayMinutes: number;
        isActive: boolean;
        stageId: string;
    }[]>;
    private moveStage;
    private notifyUser;
    private updateStatus;
    createWorkflow(data: {
        name: string;
        description?: string;
        stageId: string;
        trigger: string;
        conditions?: Record<string, any>;
        actions: WorkflowAction[];
        delayMinutes?: number;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        trigger: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
        delayMinutes: number;
        isActive: boolean;
        stageId: string;
    }>;
    updateWorkflow(id: string, data: {
        name?: string;
        description?: string;
        trigger?: string;
        conditions?: Record<string, any>;
        actions?: WorkflowAction[];
        delayMinutes?: number;
        isActive?: boolean;
    }): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        trigger: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
        delayMinutes: number;
        isActive: boolean;
        stageId: string;
    }>;
    deleteWorkflow(id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        trigger: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
        delayMinutes: number;
        isActive: boolean;
        stageId: string;
    }>;
    toggleWorkflow(id: string, isActive: boolean): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        description: string | null;
        createdAt: Date;
        trigger: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
        delayMinutes: number;
        isActive: boolean;
        stageId: string;
    }>;
}
