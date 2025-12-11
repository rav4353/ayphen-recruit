import { StorageService } from './storage.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    uploadFile(file: Express.Multer.File): Promise<ApiResponse<{
        url: string;
        filename: string;
        mimetype: string;
        size: number;
    }>>;
}
