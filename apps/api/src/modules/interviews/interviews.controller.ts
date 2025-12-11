import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) { }

    @Post()
    @ApiOperation({ summary: 'Schedule an interview' })
    create(@CurrentUser() user: JwtPayload, @Body() createInterviewDto: CreateInterviewDto) {
        return this.interviewsService.create(createInterviewDto, user.tenantId, user.sub);
    }

    @Get()
    @ApiOperation({ summary: 'Get all interviews' })
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('applicationId') applicationId?: string,
        @Query('interviewerId') interviewerId?: string,
        @Query('candidateId') candidateId?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.interviewsService.findAll(user.tenantId, {
            applicationId,
            interviewerId,
            candidateId,
            status,
            startDate,
            endDate,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get interview details' })
    findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.interviewsService.findOne(id, user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update interview details' })
    update(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() updateInterviewDto: UpdateInterviewDto,
    ) {
        return this.interviewsService.update(id, updateInterviewDto, user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel/Delete interview' })
    remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.interviewsService.remove(id, user.tenantId);
    }

    // Feedback endpoints
    @Post('feedback')
    @ApiOperation({ summary: 'Submit interview feedback' })
    createFeedback(@CurrentUser() user: JwtPayload, @Body() createFeedbackDto: CreateFeedbackDto) {
        return this.interviewsService.createFeedback(createFeedbackDto, user.sub, user.tenantId);
    }

    @Patch('feedback/:id')
    @ApiOperation({ summary: 'Update interview feedback' })
    updateFeedback(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() updateFeedbackDto: UpdateFeedbackDto,
    ) {
        return this.interviewsService.updateFeedback(id, updateFeedbackDto, user.sub, user.tenantId);
    }

    @Get(':id/feedback')
    @ApiOperation({ summary: 'Get feedback for an interview' })
    getFeedback(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.interviewsService.getFeedbackByInterview(id, user.tenantId);
    }
}
