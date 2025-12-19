import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferenceService } from './reference.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

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

    @Get('timezones')
    @ApiOperation({ summary: 'Get list of supported timezones' })
    @ApiResponse({ status: 200, description: 'Return all timezones.' })
    getTimezones() {
        return this.referenceService.getTimezones();
    }

    // Locations CRUD
    @Get('locations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all locations for tenant' })
    async getLocations(@CurrentUser() user: JwtPayload) {
        return this.referenceService.getLocations(user.tenantId);
    }

    @Post('locations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new location' })
    async createLocation(
        @CurrentUser() user: JwtPayload,
        @Body() data: { name: string; address?: string; city?: string; state?: string; country: string; timezone?: string },
    ) {
        return this.referenceService.createLocation(user.tenantId, data);
    }

    @Patch('locations/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a location' })
    async updateLocation(
        @Param('id') id: string,
        @Body() data: Partial<{ name: string; address?: string; city?: string; state?: string; country: string; timezone?: string }>,
    ) {
        return this.referenceService.updateLocation(id, data);
    }

    @Delete('locations/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a location' })
    async deleteLocation(@Param('id') id: string) {
        return this.referenceService.deleteLocation(id);
    }
}
