import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsEnum } from 'class-validator';

export class WorkflowActionDto {
    @ApiProperty({
        description: 'Type of action to execute',
        enum: ['SEND_EMAIL', 'ADD_TAG', 'CREATE_TASK', 'REQUEST_FEEDBACK'],
        example: 'SEND_EMAIL',
    })
    @IsEnum(['SEND_EMAIL', 'ADD_TAG', 'CREATE_TASK', 'REQUEST_FEEDBACK'])
    @IsNotEmpty()
    type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK' | 'REQUEST_FEEDBACK';

    @ApiProperty({
        description: 'Action configuration',
        example: { templateId: 'welcome-email', to: 'candidate' },
    })
    @IsNotEmpty()
    config: Record<string, any>;
}

export class CreateWorkflowDto {
    @ApiProperty({
        description: 'Workflow name',
        example: 'Welcome Referrals',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Workflow description',
        example: 'Send welcome email to referred candidates',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Pipeline stage ID to trigger on',
        example: 'stage-123',
    })
    @IsString()
    @IsNotEmpty()
    stageId: string;

    @ApiProperty({
        description: 'Trigger type',
        enum: ['STAGE_ENTER', 'STAGE_EXIT', 'TIME_IN_STAGE'],
        example: 'STAGE_ENTER',
    })
    @IsEnum(['STAGE_ENTER', 'STAGE_EXIT', 'TIME_IN_STAGE'])
    @IsNotEmpty()
    trigger: string;

    @ApiProperty({
        description: 'Conditional logic (optional)',
        example: { source: 'REFERRAL' },
        required: false,
    })
    @IsOptional()
    conditions?: Record<string, any>;

    @ApiProperty({
        description: 'Actions to execute',
        type: [WorkflowActionDto],
    })
    @IsArray()
    @IsNotEmpty()
    actions: WorkflowActionDto[];

    @ApiProperty({
        description: 'Delay in minutes before executing (optional)',
        example: 0,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    delayMinutes?: number;
}

export class UpdateWorkflowDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    trigger?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    conditions?: Record<string, any>;

    @ApiProperty({ required: false, type: [WorkflowActionDto] })
    @IsArray()
    @IsOptional()
    actions?: WorkflowActionDto[];

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    delayMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    isActive?: boolean;
}
