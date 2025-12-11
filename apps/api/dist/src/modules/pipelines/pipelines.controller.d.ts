import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { JwtPayload } from '../auth/auth.service';
export declare class PipelinesController {
    private readonly pipelinesService;
    constructor(pipelinesService: PipelinesService);
    create(dto: CreatePipelineDto, user: JwtPayload): Promise<{
        stages: {
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
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
    findAll(user: JwtPayload): Promise<({
        _count: {
            jobs: number;
        };
        stages: {
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
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    })[]>;
    findOne(id: string): Promise<{
        stages: ({
            automations: {
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
            }[];
        } & {
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
        })[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
    createDefault(user: JwtPayload): Promise<{
        stages: {
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
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
    addStage(id: string, stage: {
        name: string;
        color?: string;
        slaDays?: number;
    }): Promise<{
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
    reorderStages(id: string, stageIds: string[]): Promise<{
        stages: ({
            automations: {
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
            }[];
        } & {
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
        })[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        isDefault?: boolean;
    }): Promise<{
        stages: {
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
        }[];
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
    updateStage(stageId: string, data: {
        name?: string;
        color?: string;
        slaDays?: number;
        isTerminal?: boolean;
    }): Promise<{
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
    removeStage(stageId: string): Promise<{
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
    remove(id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdAt: Date;
        isDefault: boolean;
    }>;
}
