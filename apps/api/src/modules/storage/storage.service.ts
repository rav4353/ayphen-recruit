import { Injectable } from '@nestjs/common';
import 'multer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private readonly uploadDir = 'uploads';

    constructor(private readonly configService: ConfigService) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string; mimetype: string; size: number }> {
        const fileExt = path.extname(file.originalname);
        const filename = `${uuidv4()}${fileExt}`;
        const filePath = path.join(this.uploadDir, filename);

        await fs.promises.writeFile(filePath, file.buffer);

        const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001/api/v1';
        // Since we are serving static files from root, the URL should be constructed accordingly.
        // If we serve 'uploads' at '/uploads', then:
        const serverUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
        const url = `${serverUrl}/uploads/${filename}`;

        return {
            url,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        };
    }
}
