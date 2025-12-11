declare class StageDto {
    name: string;
    description?: string;
    color?: string;
    slaDays?: number;
    isTerminal?: boolean;
}
export declare class CreatePipelineDto {
    name: string;
    description?: string;
    isDefault?: boolean;
    stages: StageDto[];
}
export {};
