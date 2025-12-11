import { CreateInterviewDto } from './create-interview.dto';
import { InterviewStatus } from '@prisma/client';
declare const UpdateInterviewDto_base: import("@nestjs/common").Type<Partial<CreateInterviewDto>>;
export declare class UpdateInterviewDto extends UpdateInterviewDto_base {
    status?: InterviewStatus;
    cancelReason?: string;
}
export {};
