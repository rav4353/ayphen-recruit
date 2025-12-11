import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
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
    createWorkflow(data: CreateWorkflowDto): Promise<{
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
    updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<{
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
