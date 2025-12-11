import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get system health status' })
    async getHealth() {
        return this.healthService.checkHealth();
    }

    @Public()
    @Get('detailed')
    @ApiOperation({ summary: 'Get detailed health metrics' })
    async getDetailedHealth() {
        return this.healthService.getDetailedHealth();
    }
}
