import { Injectable, Logger } from '@nestjs/common';

export interface CheckrConfig {
    apiKey: string;
    sandboxMode?: boolean;
}

interface CheckrCandidate {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface CheckrInvitation {
    id: string;
    status: string;
    invitation_url: string;
    candidate_id: string;
}

interface CheckrReport {
    id: string;
    status: string;
    result: string;
    completed_at?: string;
    package: string;
    candidate_id: string;
}

@Injectable()
export class CheckrService {
    private readonly logger = new Logger(CheckrService.name);

    private getBaseUrl(sandboxMode: boolean): string {
        return sandboxMode 
            ? 'https://api.checkr-staging.com/v1'
            : 'https://api.checkr.com/v1';
    }

    /**
     * Create a candidate in Checkr
     */
    async createCandidate(
        config: CheckrConfig,
        data: { email: string; firstName: string; lastName: string; phone?: string; dob?: string; ssn?: string }
    ): Promise<CheckrCandidate> {
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

    /**
     * Create an invitation for a candidate to complete their BGV
     */
    async createInvitation(
        config: CheckrConfig,
        candidateId: string,
        packageName: string = 'driver_pro'
    ): Promise<CheckrInvitation> {
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

    /**
     * Get report status
     */
    async getReport(config: CheckrConfig, reportId: string): Promise<CheckrReport> {
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

    /**
     * Get candidate's reports
     */
    async getCandidateReports(config: CheckrConfig, candidateId: string): Promise<CheckrReport[]> {
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

    /**
     * Map Checkr status to our BGV status
     */
    mapStatus(checkrStatus: string, checkrResult?: string): string {
        switch (checkrStatus) {
            case 'pending':
                return 'INITIATED';
            case 'processing':
                return 'IN_PROGRESS';
            case 'complete':
                if (checkrResult === 'clear') return 'CLEAR';
                if (checkrResult === 'consider') return 'CONSIDER';
                return 'COMPLETED';
            case 'suspended':
            case 'dispute':
                return 'IN_PROGRESS';
            default:
                return 'PENDING';
        }
    }

    /**
     * Get available packages
     */
    async getPackages(config: CheckrConfig): Promise<{ id: string; name: string; screenings: string[] }[]> {
        const baseUrl = this.getBaseUrl(config.sandboxMode || false);
        
        const response = await fetch(`${baseUrl}/packages`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
            },
        });

        if (!response.ok) {
            // Return default packages if API fails
            return [
                { id: 'tasker_standard', name: 'Basic', screenings: ['ssn_trace', 'national_criminal_search'] },
                { id: 'driver_pro', name: 'Standard', screenings: ['ssn_trace', 'national_criminal_search', 'county_criminal_search', 'motor_vehicle_report'] },
                { id: 'employee_pro', name: 'Comprehensive', screenings: ['ssn_trace', 'national_criminal_search', 'county_criminal_search', 'federal_criminal_search', 'education_verification', 'employment_verification'] },
            ];
        }

        const data = await response.json();
        return data.data || [];
    }
}
