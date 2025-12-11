import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReferenceService } from './reference.service';

@ApiTags('reference')
@Controller('reference')
export class ReferenceController {
    constructor(private readonly referenceService: ReferenceService) { }

    @Get('currencies')
    @ApiOperation({ summary: 'Get list of supported currencies' })
    @ApiResponse({ status: 200, description: 'Return all currencies.' })
    getCurrencies() {
        return this.referenceService.getCurrencies();
    }
}
