import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class JobQueryDto extends PaginationDto {
    status?: string;
    departmentId?: string;
    locationId?: string;
    employmentType?: string;
    workLocation?: string;
    ids?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
