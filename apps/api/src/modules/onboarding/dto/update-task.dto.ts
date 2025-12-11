import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingTaskStatus } from '@prisma/client';

export class UpdateTaskDto {
    @ApiProperty({ enum: OnboardingTaskStatus, description: 'New status of the task' })
    @IsEnum(OnboardingTaskStatus)
    @IsNotEmpty()
    status: OnboardingTaskStatus;
}
