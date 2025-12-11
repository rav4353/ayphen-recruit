import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                    // Allow PDF and Word docs
                    // new FileTypeValidator({ fileType: '.(pdf|doc|docx)' }), 
                    // Regex for file type is safer but sometimes tricky with mimetypes. 
                    // For now, let's rely on client side restriction + maybe loose backend check if needed.
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        const result = await this.storageService.uploadFile(file);
        return ApiResponse.success(result, 'File uploaded successfully');
    }
}
