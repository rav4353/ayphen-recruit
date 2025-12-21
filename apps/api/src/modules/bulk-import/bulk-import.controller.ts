import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permission } from '../../common/constants/permissions';
import { BulkImportService, ImportMapping } from './bulk-import.service';
import { AiService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';

interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

@ApiTags('bulk-import')
@ApiBearerAuth()
@Controller('bulk-import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BulkImportController {
  constructor(
    private readonly bulkImportService: BulkImportService,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  // ==================== CANDIDATE IMPORT ====================

  @Get('candidates/fields')
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  @ApiOperation({ summary: 'Get available fields for candidate import' })
  getCandidateImportFields() {
    return this.bulkImportService.getCandidateImportFields();
  }

  @Get('candidates/template')
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  @ApiOperation({ summary: 'Download CSV template for candidate import' })
  getCandidateTemplate() {
    return {
      content: this.bulkImportService.generateTemplate('candidates'),
      filename: 'candidate_import_template.csv',
    };
  }

  @Post('candidates/preview')
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Preview candidate import from CSV' })
  async previewCandidateImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const content = file.buffer.toString('utf-8');
    return this.bulkImportService.previewImport(content, 'candidates');
  }

  @Post('candidates/import')
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import candidates from CSV' })
  async importCandidates(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('mappings') mappingsJson: string,
    @Body('skipDuplicates') skipDuplicates?: string,
    @Body('updateExisting') updateExisting?: string,
    @Body('defaultSource') defaultSource?: string,
    @Body('defaultTags') defaultTagsJson?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let mappings: ImportMapping[];
    try {
      mappings = JSON.parse(mappingsJson || '[]');
    } catch {
      throw new BadRequestException('Invalid mappings format');
    }

    let defaultTags: string[] | undefined;
    if (defaultTagsJson) {
      try {
        defaultTags = JSON.parse(defaultTagsJson);
      } catch {
        defaultTags = defaultTagsJson.split(',').map(t => t.trim());
      }
    }

    const content = file.buffer.toString('utf-8');
    return this.bulkImportService.importCandidates(
      user.tenantId,
      user.userId,
      content,
      mappings,
      {
        skipDuplicates: skipDuplicates === 'true',
        updateExisting: updateExisting === 'true',
        defaultSource,
        defaultTags,
      },
    );
  }

  // ==================== JOB IMPORT ====================

  @Get('jobs/fields')
  @RequirePermissions(Permission.JOB_CREATE)
  @ApiOperation({ summary: 'Get available fields for job import' })
  getJobImportFields() {
    return this.bulkImportService.getJobImportFields();
  }

  @Get('jobs/template')
  @RequirePermissions(Permission.JOB_CREATE)
  @ApiOperation({ summary: 'Download CSV template for job import' })
  getJobTemplate() {
    return {
      content: this.bulkImportService.generateTemplate('jobs'),
      filename: 'job_import_template.csv',
    };
  }

  @Post('jobs/preview')
  @RequirePermissions(Permission.JOB_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Preview job import from CSV' })
  async previewJobImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const content = file.buffer.toString('utf-8');
    return this.bulkImportService.previewImport(content, 'jobs');
  }

  @Post('jobs/import')
  @RequirePermissions(Permission.JOB_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import jobs from CSV' })
  async importJobs(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('mappings') mappingsJson: string,
    @Body('defaultStatus') defaultStatus?: string,
    @Body('defaultPipelineId') defaultPipelineId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let mappings: ImportMapping[];
    try {
      mappings = JSON.parse(mappingsJson || '[]');
    } catch {
      throw new BadRequestException('Invalid mappings format');
    }

    const content = file.buffer.toString('utf-8');
    return this.bulkImportService.importJobs(
      user.tenantId,
      user.userId,
      content,
      mappings,
      {
        defaultStatus,
        defaultPipelineId,
      },
    );
  }

  // ==================== IMPORT HISTORY ====================

  @Get('history')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get import history' })
  async getImportHistory(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    return this.bulkImportService.getImportHistory(user.tenantId, limit || 20);
  }

  // ==================== BULK RESUME UPLOAD ====================

  @Post('resumes')
  @RequirePermissions(Permission.CANDIDATE_CREATE)
  @UseInterceptors(FilesInterceptor('files', 50))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk upload resumes and create candidates' })
  async bulkUploadResumes(
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('source') source?: string,
    @Body('tags') tagsJson?: string,
    @Body('jobId') jobId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Only PDF and Word documents are allowed.`
        );
      }
    }

    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch {
        tags = tagsJson.split(',').map(t => t.trim());
      }
    }

    const results = {
      total: files.length,
      successful: 0,
      failed: 0,
      candidates: [] as any[],
      errors: [] as { filename: string; error: string }[],
    };

    for (const file of files) {
      try {
        // Parse resume using AI service
        const parsedData = await this.aiService.parseResume(file);
        
        if (!parsedData || !parsedData.email) {
          results.failed++;
          results.errors.push({
            filename: file.originalname,
            error: 'Could not extract email from resume',
          });
          continue;
        }

        // Upload file to storage
        const uploadResult = await this.storageService.uploadFile(file);

        // Create candidate
        const candidate = await this.bulkImportService.createCandidateFromResume(
          user.tenantId,
          user.userId,
          {
            ...parsedData,
            resumeUrl: uploadResult.url,
            source: source || 'Bulk Upload',
            tags,
          },
          jobId,
        );

        results.successful++;
        results.candidates.push({
          id: candidate.id,
          name: `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email,
          filename: file.originalname,
        });
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          filename: file.originalname,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}
