import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ImportField {
  name: string;
  label: string;
  required: boolean;
  type: 'string' | 'email' | 'phone' | 'date' | 'number' | 'select';
  options?: string[];
}

export interface ImportMapping {
  sourceColumn: string;
  targetField: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; field: string; message: string }[];
  createdIds: string[];
}

export interface ImportPreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMappings: ImportMapping[];
}

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);

  constructor(private readonly prisma: PrismaService) { }

  // Get available fields for candidate import
  getCandidateImportFields(): ImportField[] {
    return [
      { name: 'firstName', label: 'First Name', required: true, type: 'string' },
      { name: 'lastName', label: 'Last Name', required: true, type: 'string' },
      { name: 'email', label: 'Email', required: true, type: 'email' },
      { name: 'phone', label: 'Phone', required: false, type: 'phone' },
      { name: 'linkedinUrl', label: 'LinkedIn URL', required: false, type: 'string' },
      { name: 'currentTitle', label: 'Current Title', required: false, type: 'string' },
      { name: 'currentCompany', label: 'Current Company', required: false, type: 'string' },
      { name: 'location', label: 'Location', required: false, type: 'string' },
      { name: 'skills', label: 'Skills (comma-separated)', required: false, type: 'string' },
      { name: 'experience', label: 'Years of Experience', required: false, type: 'number' },
      { name: 'source', label: 'Source', required: false, type: 'select', options: ['LinkedIn', 'Indeed', 'Referral', 'Website', 'Other'] },
      { name: 'notes', label: 'Notes', required: false, type: 'string' },
      { name: 'tags', label: 'Tags (comma-separated)', required: false, type: 'string' },
    ];
  }

  // Get available fields for job import
  getJobImportFields(): ImportField[] {
    return [
      { name: 'title', label: 'Job Title', required: true, type: 'string' },
      { name: 'department', label: 'Department', required: false, type: 'string' },
      { name: 'location', label: 'Location', required: false, type: 'string' },
      { name: 'employmentType', label: 'Employment Type', required: false, type: 'select', options: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] },
      { name: 'workLocation', label: 'Work Location', required: false, type: 'select', options: ['ONSITE', 'REMOTE', 'HYBRID'] },
      { name: 'salaryMin', label: 'Min Salary', required: false, type: 'number' },
      { name: 'salaryMax', label: 'Max Salary', required: false, type: 'number' },
      { name: 'salaryCurrency', label: 'Currency', required: false, type: 'string' },
      { name: 'description', label: 'Description', required: false, type: 'string' },
      { name: 'requirements', label: 'Requirements', required: false, type: 'string' },
      { name: 'skills', label: 'Skills (comma-separated)', required: false, type: 'string' },
      { name: 'openings', label: 'Number of Openings', required: false, type: 'number' },
    ];
  }

  // Parse CSV content
  parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Preview import with sample data and suggested mappings
  previewImport(
    content: string,
    entityType: 'candidates' | 'jobs',
  ): ImportPreview {
    const { headers, rows } = this.parseCSV(content);
    const fields = entityType === 'candidates'
      ? this.getCandidateImportFields()
      : this.getJobImportFields();

    // Auto-suggest mappings based on header similarity
    const suggestedMappings: ImportMapping[] = [];

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const field of fields) {
        const normalizedField = field.name.toLowerCase();
        const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normalizedHeader === normalizedField ||
          normalizedHeader === normalizedLabel ||
          normalizedHeader.includes(normalizedField) ||
          normalizedField.includes(normalizedHeader)) {
          suggestedMappings.push({
            sourceColumn: header,
            targetField: field.name,
          });
          break;
        }
      }
    }

    return {
      headers,
      sampleRows: rows.slice(0, 5),
      totalRows: rows.length,
      suggestedMappings,
    };
  }

  // Import candidates
  async importCandidates(
    tenantId: string,
    userId: string,
    content: string,
    mappings: ImportMapping[],
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      defaultSource?: string;
      defaultTags?: string[];
    } = {},
  ): Promise<ImportResult> {
    const { rows } = this.parseCSV(content);
    const result: ImportResult = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [],
      createdIds: [],
    };

    const mappingMap = new Map(mappings.map(m => [m.targetField, m.sourceColumn]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      try {
        // Extract mapped values
        const getValue = (field: string) => {
          const column = mappingMap.get(field);
          return column ? row[column]?.trim() : undefined;
        };

        const email = getValue('email');
        const firstName = getValue('firstName');
        const lastName = getValue('lastName');

        // Validate required fields
        if (!email) {
          result.errors.push({ row: rowNum, field: 'email', message: 'Email is required' });
          result.failed++;
          continue;
        }

        if (!firstName) {
          result.errors.push({ row: rowNum, field: 'firstName', message: 'First name is required' });
          result.failed++;
          continue;
        }

        // Check for existing candidate
        const existing = await this.prisma.candidate.findFirst({
          where: { tenantId, email },
        });

        if (existing) {
          if (options.skipDuplicates) {
            result.failed++;
            result.errors.push({ row: rowNum, field: 'email', message: 'Duplicate email - skipped' });
            continue;
          }

          if (options.updateExisting) {
            // Update existing candidate
            const updated = await this.prisma.candidate.update({
              where: { id: existing.id },
              data: this.buildCandidateData(getValue, options),
            });
            result.successful++;
            result.createdIds.push(updated.id);
            continue;
          }
        }

        // Create new candidate
        const skillsStr = getValue('skills');
        const tagsStr = getValue('tags');

        const candidate = await this.prisma.candidate.create({
          data: {
            tenantId,
            email,
            firstName,
            lastName: lastName || '',
            phone: getValue('phone'),
            linkedinUrl: getValue('linkedinUrl'),
            currentTitle: getValue('currentTitle'),
            currentCompany: getValue('currentCompany'),
            location: getValue('location'),
            skills: skillsStr ? skillsStr.split(',').map(s => s.trim()) : [],
            source: getValue('source') || options.defaultSource || 'Import',
            tags: tagsStr
              ? tagsStr.split(',').map(t => t.trim())
              : options.defaultTags || [],
          },
        });

        result.successful++;
        result.createdIds.push(candidate.id);

      } catch (error) {
        this.logger.error(`Error importing row ${rowNum}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNum,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log import activity
    this.logger.log(`Bulk import completed: ${result.successful}/${result.total} candidates imported for tenant ${tenantId}`);

    return result;
  }

  private buildCandidateData(
    getValue: (field: string) => string | undefined,
    options: { defaultSource?: string; defaultTags?: string[] },
  ) {
    const skillsStr = getValue('skills');
    const tagsStr = getValue('tags');

    return {
      firstName: getValue('firstName'),
      lastName: getValue('lastName'),
      phone: getValue('phone'),
      linkedinUrl: getValue('linkedinUrl'),
      currentTitle: getValue('currentTitle'),
      currentCompany: getValue('currentCompany'),
      location: getValue('location'),
      skills: skillsStr ? skillsStr.split(',').map(s => s.trim()) : undefined,
      source: getValue('source') || options.defaultSource,
      tags: tagsStr
        ? tagsStr.split(',').map(t => t.trim())
        : options.defaultTags,
    };
  }

  // Import jobs
  async importJobs(
    tenantId: string,
    userId: string,
    content: string,
    mappings: ImportMapping[],
    options: {
      defaultStatus?: string;
      defaultPipelineId?: string;
    } = {},
  ): Promise<ImportResult> {
    const { rows } = this.parseCSV(content);
    const result: ImportResult = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [],
      createdIds: [],
    };

    const mappingMap = new Map(mappings.map(m => [m.targetField, m.sourceColumn]));

    // Get default pipeline
    let pipelineId = options.defaultPipelineId;
    if (!pipelineId) {
      const defaultPipeline = await this.prisma.pipeline.findFirst({
        where: { tenantId, isDefault: true },
      });
      pipelineId = defaultPipeline?.id;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const getValue = (field: string) => {
          const column = mappingMap.get(field);
          return column ? row[column]?.trim() : undefined;
        };

        const title = getValue('title');

        if (!title) {
          result.errors.push({ row: rowNum, field: 'title', message: 'Job title is required' });
          result.failed++;
          continue;
        }

        // Find or create department
        let departmentId: string | undefined;
        const deptName = getValue('department');
        if (deptName) {
          const dept = await this.prisma.department.findFirst({
            where: { tenantId, name: deptName },
          });
          departmentId = dept?.id;
        }

        // Find or create location
        let locationId: string | undefined;
        const locName = getValue('location');
        if (locName) {
          const loc = await this.prisma.location.findFirst({
            where: { tenantId, name: locName },
          });
          locationId = loc?.id;
        }

        const skillsStr = getValue('skills');

        const job = await this.prisma.job.create({
          data: {
            tenantId,
            title,
            departmentId,
            locations: locationId ? { connect: { id: locationId } } : undefined,
            employmentType: (getValue('employmentType') as any) || 'FULL_TIME',
            workLocation: (getValue('workLocation') as any) || 'ONSITE',
            salaryMin: getValue('salaryMin') ? parseFloat(getValue('salaryMin')!) : undefined,
            salaryMax: getValue('salaryMax') ? parseFloat(getValue('salaryMax')!) : undefined,
            salaryCurrency: getValue('salaryCurrency') || 'USD',
            description: getValue('description') || '',
            requirements: getValue('requirements') || '',
            skills: skillsStr ? skillsStr.split(',').map(s => s.trim()) : [],
            openings: getValue('openings') ? parseInt(getValue('openings')!) : 1,
            status: (options.defaultStatus as any) || 'DRAFT',
            pipelineId,
          },
        });

        result.successful++;
        result.createdIds.push(job.id);

      } catch (error) {
        this.logger.error(`Error importing job row ${rowNum}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNum,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log import activity
    this.logger.log(`Bulk import completed: ${result.successful}/${result.total} jobs imported for tenant ${tenantId}`);

    return result;
  }

  // Get import history - simplified version
  async getImportHistory(tenantId: string, limit = 20) {
    // Note: This would need proper activity log schema support
    // For now, return empty array
    this.logger.log(`Getting import history for tenant ${tenantId}, limit ${limit}`);
    return [];
  }

  // Generate sample CSV template
  generateTemplate(entityType: 'candidates' | 'jobs'): string {
    const fields = entityType === 'candidates'
      ? this.getCandidateImportFields()
      : this.getJobImportFields();

    const headers = fields.map(f => f.label).join(',');

    // Add sample row
    const sampleRow = fields.map(f => {
      if (f.type === 'email') return 'john@example.com';
      if (f.type === 'phone') return '+1234567890';
      if (f.type === 'number') return '5';
      if (f.type === 'select') return f.options?.[0] || '';
      if (f.name === 'firstName') return 'John';
      if (f.name === 'lastName') return 'Doe';
      if (f.name === 'title') return 'Software Engineer';
      return 'Sample';
    }).join(',');

    return `${headers}\n${sampleRow}`;
  }

  // Create candidate from parsed resume data
  async createCandidateFromResume(
    tenantId: string,
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email: string;
      phone?: string;
      currentTitle?: string;
      currentCompany?: string;
      location?: string;
      skills?: string[];
      experience?: any;
      education?: any;
      summary?: string;
      resumeUrl?: string;
      resumeText?: string;
      source?: string;
      tags?: string[];
    },
    jobId?: string,
  ) {
    // Check for duplicate
    const existing = await this.prisma.candidate.findFirst({
      where: { email: data.email, tenantId },
    });

    if (existing) {
      throw new Error(`Candidate with email ${data.email} already exists`);
    }

    // Create candidate
    const candidate = await this.prisma.candidate.create({
      data: {
        tenantId,
        email: data.email,
        firstName: data.firstName || 'Unknown',
        lastName: data.lastName || 'Candidate',
        phone: data.phone,
        currentTitle: data.currentTitle,
        currentCompany: data.currentCompany,
        location: data.location,
        skills: data.skills || [],
        experience: data.experience,
        education: data.education,
        summary: data.summary,
        resumeUrl: data.resumeUrl,
        resumeText: data.resumeText,
        source: data.source || 'Bulk Upload',
        tags: data.tags || [],
        gdprConsent: false,
      },
    });

    // If jobId provided, create application
    if (jobId) {
      try {
        await this.prisma.application.create({
          data: {
            candidateId: candidate.id,
            jobId,
            status: 'APPLIED',
          },
        });
      } catch (error) {
        this.logger.warn(`Could not create application for candidate ${candidate.id}: ${error}`);
      }
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'CANDIDATE_CREATED',
        description: `Candidate created from bulk resume upload: ${candidate.firstName} ${candidate.lastName}`,
        userId,
        candidateId: candidate.id,
      },
    });

    return candidate;
  }
}
