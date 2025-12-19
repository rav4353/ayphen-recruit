import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateJdDto } from './dto/generate-jd.dto';

import { CheckBiasDto } from './dto/check-bias.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { FeatureFlagGuard, RequireFeature } from '../../common/guards/feature-flag.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-jd')
    @RequireFeature('ai_jd_generation')
    @ApiOperation({ summary: 'Generate a job description using AI' })
    async generateJd(@Body() dto: GenerateJdDto) {
        const result = await this.aiService.generateJd(dto);
        return ApiResponse.success(result, 'Job description generated successfully');
    }

    @Post('parse-resume')
    @RequireFeature('ai_resume_parsing')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Parse a resume file' })
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
    async parseResume(@UploadedFile() file: Express.Multer.File) {
        const result = await this.aiService.parseResume(file);
        return ApiResponse.success(result, 'Resume parsed successfully');
    }


    @Post('check-bias')
    @RequireFeature('ai_jd_generation')
    @ApiOperation({ summary: 'Check for biased language' })
    async checkBias(@Body() dto: CheckBiasDto) {
        const result = await this.aiService.checkBias(dto.text);
        return ApiResponse.success(result, 'Bias check completed successfully');
    }

    @Post('generate-subject-lines')
    @RequireFeature('ai_jd_generation')
    @ApiOperation({ summary: 'Generate AI-powered email subject line suggestions' })
    async generateSubjectLines(
        @Body() dto: { context: string; candidateName?: string; jobTitle?: string; companyName?: string },
    ) {
        const result = await this.aiService.generateSubjectLines(dto);
        return ApiResponse.success(result, 'Subject lines generated successfully');
    }
}
