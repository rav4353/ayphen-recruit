import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OfferTemplatesService } from './offer-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateOfferTemplateDto, UpdateOfferTemplateDto } from './dto/offer-template.dto';

@ApiTags('offer-templates')
@Controller('offer-templates')
@UseGuards(JwtAuthGuard)
export class OfferTemplatesController {
    constructor(private readonly offerTemplatesService: OfferTemplatesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new offer template' })
    create(@Request() req: any, @Body() createOfferTemplateDto: CreateOfferTemplateDto) {
        return this.offerTemplatesService.create(req.user.tenantId, createOfferTemplateDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all offer templates' })
    async findAll(@Request() req: any) {
        console.log(`[OfferTemplates] findAll for tenant: ${req.user.tenantId}`);
        const results = await this.offerTemplatesService.findAll(req.user.tenantId);
        console.log(`[OfferTemplates] Found ${results.length} templates`);
        return results;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific offer template' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.offerTemplatesService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an offer template' })
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateOfferTemplateDto: UpdateOfferTemplateDto,
    ) {
        return this.offerTemplatesService.update(req.user.tenantId, id, updateOfferTemplateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an offer template' })
    remove(@Request() req: any, @Param('id') id: string) {
        return this.offerTemplatesService.remove(req.user.tenantId, id);
    }
}
