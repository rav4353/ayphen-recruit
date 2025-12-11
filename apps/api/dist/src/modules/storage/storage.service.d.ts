import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly uploadDir;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
        filename: string;
        mimetype: string;
        size: number;
    }>;
}
