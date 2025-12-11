export declare class WorkflowActionDto {
    type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK' | 'REQUEST_FEEDBACK';
    config: Record<string, any>;
}
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    stageId: string;
    trigger: string;
    conditions?: Record<string, any>;
    actions: WorkflowActionDto[];
    delayMinutes?: number;
}
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string;
    trigger?: string;
    conditions?: Record<string, any>;
    actions?: WorkflowActionDto[];
    delayMinutes?: number;
    isActive?: boolean;
}
