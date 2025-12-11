"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CheckrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckrService = void 0;
const common_1 = require("@nestjs/common");
let CheckrService = CheckrService_1 = class CheckrService {
    constructor() {
        this.logger = new common_1.Logger(CheckrService_1.name);
    }
    getBaseUrl(sandboxMode) {
        return sandboxMode
            ? 'https://api.checkr-staging.com/v1'
            : 'https://api.checkr.com/v1';
    }
    async createCandidate(config, data) {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        const response = await fetch(`${baseUrl}/candidates`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: data.email,
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
                dob: data.dob,
                ssn: data.ssn,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Checkr create candidate failed:', error);
            throw new Error(`Failed to create candidate: ${error}`);
        }
        return response.json();
    }
    async createInvitation(config, candidateId, packageName = 'driver_pro') {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        const response = await fetch(`${baseUrl}/invitations`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate_id: candidateId,
                package: packageName,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Checkr create invitation failed:', error);
            throw new Error(`Failed to create invitation: ${error}`);
        }
        return response.json();
    }
    async getReport(config, reportId) {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        const response = await fetch(`${baseUrl}/reports/${reportId}`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
            },
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Checkr get report failed:', error);
            throw new Error(`Failed to get report: ${error}`);
        }
        return response.json();
    }
    async getCandidateReports(config, candidateId) {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        const response = await fetch(`${baseUrl}/candidates/${candidateId}/reports`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
            },
        });
        if (!response.ok) {
            const error = await response.text();
            this.logger.error('Checkr get candidate reports failed:', error);
            throw new Error(`Failed to get reports: ${error}`);
        }
        const data = await response.json();
        return data.data || [];
    }
    mapStatus(checkrStatus, checkrResult) {
        switch (checkrStatus) {
            case 'pending':
                return 'INITIATED';
            case 'processing':
                return 'IN_PROGRESS';
            case 'complete':
                if (checkrResult === 'clear')
                    return 'CLEAR';
                if (checkrResult === 'consider')
                    return 'CONSIDER';
                return 'COMPLETED';
            case 'suspended':
            case 'dispute':
                return 'IN_PROGRESS';
            default:
                return 'PENDING';
        }
    }
    async getPackages(config) {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        const response = await fetch(`${baseUrl}/packages`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
            },
        });
        if (!response.ok) {
            return [
                { id: 'tasker_standard', name: 'Basic', screenings: ['ssn_trace', 'national_criminal_search'] },
                { id: 'driver_pro', name: 'Standard', screenings: ['ssn_trace', 'national_criminal_search', 'county_criminal_search', 'motor_vehicle_report'] },
                { id: 'employee_pro', name: 'Comprehensive', screenings: ['ssn_trace', 'national_criminal_search', 'county_criminal_search', 'federal_criminal_search', 'education_verification', 'employment_verification'] },
            ];
        }
        const data = await response.json();
        return data.data || [];
    }
};
exports.CheckrService = CheckrService;
exports.CheckrService = CheckrService = CheckrService_1 = __decorate([
    (0, common_1.Injectable)()
], CheckrService);
//# sourceMappingURL=checkr.service.js.map