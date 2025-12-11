import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class UserQueryDto extends PaginationDto {
    status?: string;
    role?: string;
    departmentId?: string;
}
