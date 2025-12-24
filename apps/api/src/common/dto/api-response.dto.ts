import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaginationMeta {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;
}

export class ApiResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  meta?: PaginationMeta;

  @ApiPropertyOptional()
  errors?: string[];

  @ApiPropertyOptional()
  timestamp?: string;

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = "Success"): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      message,
      data,
    });
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = "Success",
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    return new ApiResponse({
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }

  static error(message: string, errors?: string[]): ApiResponse<null> {
    return new ApiResponse({
      success: false,
      message,
      errors,
      data: null,
    });
  }

  static created<T>(data: T, message = "Created successfully"): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      message,
      data,
    });
  }

  static updated<T>(data: T, message = "Updated successfully"): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      message,
      data,
    });
  }

  static deleted(message = "Deleted successfully"): ApiResponse<null> {
    return new ApiResponse({
      success: true,
      message,
      data: null,
    });
  }
}
