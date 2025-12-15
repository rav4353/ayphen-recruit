import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  aggregatable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'between' | 'isNull' | 'isNotNull';
  value: any;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportGroupBy {
  field: string;
  aggregations: {
    field: string;
    function: 'count' | 'sum' | 'avg' | 'min' | 'max';
    alias: string;
  }[];
}

export interface ReportDefinition {
  id?: string;
  name: string;
  description?: string;
  entityType: 'candidates' | 'jobs' | 'applications' | 'interviews' | 'offers';
  columns: string[];
  filters: ReportFilter[];
  sorts: ReportSort[];
  groupBy?: ReportGroupBy;
  dateRange?: {
    field: string;
    start?: string;
    end?: string;
    preset?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear';
  };
  limit?: number;
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  definition: ReportDefinition;
  isPublic: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CustomReportsService {
  private readonly logger = new Logger(CustomReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Get available columns for each entity type
  getAvailableColumns(entityType: string): ReportColumn[] {
    const columns: Record<string, ReportColumn[]> = {
      candidates: [
        { id: 'firstName', field: 'firstName', label: 'First Name', type: 'string', filterable: true, sortable: true },
        { id: 'lastName', field: 'lastName', label: 'Last Name', type: 'string', filterable: true, sortable: true },
        { id: 'email', field: 'email', label: 'Email', type: 'string', filterable: true, sortable: true },
        { id: 'phone', field: 'phone', label: 'Phone', type: 'string', filterable: true },
        { id: 'currentTitle', field: 'currentTitle', label: 'Current Title', type: 'string', filterable: true, sortable: true },
        { id: 'currentCompany', field: 'currentCompany', label: 'Current Company', type: 'string', filterable: true, sortable: true },
        { id: 'location', field: 'location', label: 'Location', type: 'string', filterable: true, sortable: true },
        { id: 'source', field: 'source', label: 'Source', type: 'string', filterable: true, aggregatable: true },
        { id: 'skills', field: 'skills', label: 'Skills', type: 'array', filterable: true },
        { id: 'tags', field: 'tags', label: 'Tags', type: 'array', filterable: true },
        { id: 'createdAt', field: 'createdAt', label: 'Created Date', type: 'date', filterable: true, sortable: true },
        { id: 'applicationsCount', field: '_count.applications', label: 'Applications', type: 'number', aggregatable: true },
      ],
      jobs: [
        { id: 'title', field: 'title', label: 'Job Title', type: 'string', filterable: true, sortable: true },
        { id: 'jobCode', field: 'jobCode', label: 'Job Code', type: 'string', filterable: true },
        { id: 'status', field: 'status', label: 'Status', type: 'string', filterable: true, aggregatable: true },
        { id: 'department', field: 'department.name', label: 'Department', type: 'string', filterable: true, aggregatable: true },
        { id: 'location', field: 'location.name', label: 'Location', type: 'string', filterable: true, aggregatable: true },
        { id: 'employmentType', field: 'employmentType', label: 'Employment Type', type: 'string', filterable: true, aggregatable: true },
        { id: 'workLocation', field: 'workLocation', label: 'Work Location', type: 'string', filterable: true, aggregatable: true },
        { id: 'openings', field: 'openings', label: 'Openings', type: 'number', aggregatable: true },
        { id: 'salaryMin', field: 'salaryMin', label: 'Min Salary', type: 'number', aggregatable: true },
        { id: 'salaryMax', field: 'salaryMax', label: 'Max Salary', type: 'number', aggregatable: true },
        { id: 'hiringManager', field: 'hiringManager.firstName', label: 'Hiring Manager', type: 'string', filterable: true },
        { id: 'recruiter', field: 'recruiter.firstName', label: 'Recruiter', type: 'string', filterable: true },
        { id: 'createdAt', field: 'createdAt', label: 'Created Date', type: 'date', filterable: true, sortable: true },
        { id: 'publishedAt', field: 'publishedAt', label: 'Published Date', type: 'date', filterable: true, sortable: true },
        { id: 'applicationsCount', field: '_count.applications', label: 'Applications', type: 'number', aggregatable: true },
      ],
      applications: [
        { id: 'candidateName', field: 'candidate.firstName', label: 'Candidate Name', type: 'string', filterable: true, sortable: true },
        { id: 'candidateEmail', field: 'candidate.email', label: 'Candidate Email', type: 'string', filterable: true },
        { id: 'jobTitle', field: 'job.title', label: 'Job Title', type: 'string', filterable: true, sortable: true },
        { id: 'status', field: 'status', label: 'Status', type: 'string', filterable: true, aggregatable: true },
        { id: 'stage', field: 'currentStage.name', label: 'Current Stage', type: 'string', filterable: true, aggregatable: true },
        { id: 'matchScore', field: 'matchScore', label: 'Match Score', type: 'number', aggregatable: true, sortable: true },
        { id: 'source', field: 'candidate.source', label: 'Source', type: 'string', filterable: true, aggregatable: true },
        { id: 'appliedAt', field: 'appliedAt', label: 'Applied Date', type: 'date', filterable: true, sortable: true },
        { id: 'department', field: 'job.department.name', label: 'Department', type: 'string', filterable: true, aggregatable: true },
        { id: 'location', field: 'job.location.name', label: 'Location', type: 'string', filterable: true, aggregatable: true },
        { id: 'interviewsCount', field: '_count.interviews', label: 'Interviews', type: 'number', aggregatable: true },
      ],
      interviews: [
        { id: 'candidateName', field: 'application.candidate.firstName', label: 'Candidate Name', type: 'string', filterable: true },
        { id: 'jobTitle', field: 'application.job.title', label: 'Job Title', type: 'string', filterable: true },
        { id: 'type', field: 'type', label: 'Interview Type', type: 'string', filterable: true, aggregatable: true },
        { id: 'status', field: 'status', label: 'Status', type: 'string', filterable: true, aggregatable: true },
        { id: 'interviewer', field: 'interviewer.firstName', label: 'Interviewer', type: 'string', filterable: true },
        { id: 'scheduledAt', field: 'scheduledAt', label: 'Scheduled Date', type: 'date', filterable: true, sortable: true },
        { id: 'duration', field: 'duration', label: 'Duration (min)', type: 'number', aggregatable: true },
        { id: 'rating', field: 'feedback.rating', label: 'Rating', type: 'number', aggregatable: true },
      ],
      offers: [
        { id: 'candidateName', field: 'application.candidate.firstName', label: 'Candidate Name', type: 'string', filterable: true },
        { id: 'jobTitle', field: 'application.job.title', label: 'Job Title', type: 'string', filterable: true },
        { id: 'status', field: 'status', label: 'Status', type: 'string', filterable: true, aggregatable: true },
        { id: 'salary', field: 'salary', label: 'Salary', type: 'number', aggregatable: true },
        { id: 'startDate', field: 'startDate', label: 'Start Date', type: 'date', filterable: true, sortable: true },
        { id: 'expiresAt', field: 'expiresAt', label: 'Expires At', type: 'date', filterable: true, sortable: true },
        { id: 'createdAt', field: 'createdAt', label: 'Created Date', type: 'date', filterable: true, sortable: true },
      ],
    };

    return columns[entityType] || [];
  }

  // Get filter operators for a field type
  getFilterOperators(fieldType: string): string[] {
    const operators: Record<string, string[]> = {
      string: ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'isNull', 'isNotNull'],
      number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
      date: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
      boolean: ['equals'],
      array: ['contains', 'isNull', 'isNotNull'],
    };

    return operators[fieldType] || operators.string;
  }

  // Execute a report
  async executeReport(
    tenantId: string,
    definition: ReportDefinition,
  ): Promise<{ data: any[]; total: number; executedAt: Date }> {
    const { entityType, columns, filters, sorts, groupBy, dateRange, limit } = definition;

    // Build where clause
    const where: any = { tenantId };
    
    // Apply filters
    for (const filter of filters) {
      where[filter.field] = this.buildFilterCondition(filter);
    }

    // Apply date range
    if (dateRange) {
      const { start, end } = this.resolveDateRange(dateRange);
      if (start || end) {
        where[dateRange.field] = {};
        if (start) where[dateRange.field].gte = new Date(start);
        if (end) where[dateRange.field].lte = new Date(end);
      }
    }

    // Build select/include
    const select = this.buildSelect(entityType, columns);
    const orderBy = sorts.map(s => ({ [s.field]: s.direction }));

    let data: any[];
    let total: number;

    // Execute query based on entity type
    switch (entityType) {
      case 'candidates':
        [data, total] = await Promise.all([
          this.prisma.candidate.findMany({
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: limit || 1000,
          }),
          this.prisma.candidate.count({ where }),
        ]);
        break;

      case 'jobs':
        [data, total] = await Promise.all([
          this.prisma.job.findMany({
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: limit || 1000,
          }),
          this.prisma.job.count({ where }),
        ]);
        break;

      case 'applications':
        [data, total] = await Promise.all([
          this.prisma.application.findMany({
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: limit || 1000,
          }),
          this.prisma.application.count({ where }),
        ]);
        break;

      case 'interviews':
        [data, total] = await Promise.all([
          this.prisma.interview.findMany({
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: limit || 1000,
          }),
          this.prisma.interview.count({ where }),
        ]);
        break;

      case 'offers':
        [data, total] = await Promise.all([
          this.prisma.offer.findMany({
            where,
            select,
            orderBy: orderBy.length > 0 ? orderBy : undefined,
            take: limit || 1000,
          }),
          this.prisma.offer.count({ where }),
        ]);
        break;

      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }

    // Flatten nested data for easier consumption
    const flattenedData = data.map(row => this.flattenObject(row));

    return {
      data: flattenedData,
      total,
      executedAt: new Date(),
    };
  }

  private buildFilterCondition(filter: ReportFilter): any {
    switch (filter.operator) {
      case 'equals': return filter.value;
      case 'notEquals': return { not: filter.value };
      case 'contains': return { contains: filter.value, mode: 'insensitive' };
      case 'startsWith': return { startsWith: filter.value, mode: 'insensitive' };
      case 'endsWith': return { endsWith: filter.value, mode: 'insensitive' };
      case 'gt': return { gt: filter.value };
      case 'gte': return { gte: filter.value };
      case 'lt': return { lt: filter.value };
      case 'lte': return { lte: filter.value };
      case 'in': return { in: filter.value };
      case 'notIn': return { notIn: filter.value };
      case 'between': return { gte: filter.value[0], lte: filter.value[1] };
      case 'isNull': return null;
      case 'isNotNull': return { not: null };
      default: return filter.value;
    }
  }

  private resolveDateRange(dateRange: ReportDefinition['dateRange']): { start?: string; end?: string } {
    if (!dateRange) return {};

    if (dateRange.start || dateRange.end) {
      return { start: dateRange.start, end: dateRange.end };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange.preset) {
      case 'today':
        return { start: today.toISOString(), end: now.toISOString() };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday.toISOString(), end: today.toISOString() };
      case 'thisWeek':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { start: weekStart.toISOString(), end: now.toISOString() };
      case 'lastWeek':
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        return { start: lastWeekStart.toISOString(), end: lastWeekEnd.toISOString() };
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart.toISOString(), end: now.toISOString() };
      case 'lastMonth':
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() };
      case 'thisQuarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
        return { start: quarterStart.toISOString(), end: now.toISOString() };
      case 'thisYear':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart.toISOString(), end: now.toISOString() };
      default:
        return {};
    }
  }

  private buildSelect(entityType: string, columns: string[]): any {
    const select: any = {};
    const availableColumns = this.getAvailableColumns(entityType);

    for (const colId of columns) {
      const column = availableColumns.find(c => c.id === colId);
      if (column) {
        const parts = column.field.split('.');
        if (parts.length === 1) {
          select[parts[0]] = true;
        } else {
          // Handle nested fields
          let current = select;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = { select: {} };
            }
            current = current[parts[i]].select;
          }
          current[parts[parts.length - 1]] = true;
        }
      }
    }

    // Always include id
    select.id = true;

    return select;
  }

  private flattenObject(obj: any, prefix = ''): any {
    const result: any = {};

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  // Save a report definition
  async saveReport(
    tenantId: string,
    userId: string,
    report: Omit<SavedReport, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>,
  ): Promise<SavedReport> {
    const saved = await this.prisma.savedView.create({
      data: {
        tenantId,
        userId,
        name: report.name,
        entity: report.definition.entityType,
        filters: report.definition as any,
        isShared: report.isPublic,
      },
    });

    return {
      id: saved.id,
      name: saved.name,
      description: report.description,
      definition: saved.filters as any as ReportDefinition,
      isPublic: report.isPublic,
      createdById: saved.userId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  // Get saved reports
  async getSavedReports(tenantId: string, userId: string): Promise<SavedReport[]> {
    const views = await this.prisma.savedView.findMany({
      where: {
        tenantId,
        OR: [
          { userId },
          { isShared: true }, // Public reports
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return views.map(v => ({
      id: v.id,
      name: v.name,
      description: undefined,
      definition: v.filters as any as ReportDefinition,
      isPublic: v.isShared,
      createdById: v.userId,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  // Delete a saved report
  async deleteReport(tenantId: string, userId: string, reportId: string): Promise<void> {
    const report = await this.prisma.savedView.findFirst({
      where: { id: reportId, tenantId, userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.savedView.delete({ where: { id: reportId } });
  }

  // Export report to CSV
  async exportToCSV(
    tenantId: string,
    definition: ReportDefinition,
  ): Promise<string> {
    const { data } = await this.executeReport(tenantId, definition);
    const availableColumns = this.getAvailableColumns(definition.entityType);
    
    // Get headers
    const headers = definition.columns
      .map(colId => availableColumns.find(c => c.id === colId)?.label || colId)
      .join(',');

    // Get rows
    const rows = data.map(row => {
      return definition.columns
        .map(colId => {
          const column = availableColumns.find(c => c.id === colId);
          const value = column ? row[column.field] || row[colId] : row[colId];
          
          if (value === null || value === undefined) return '';
          if (Array.isArray(value)) return `"${value.join(', ')}"`;
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return String(value);
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }
}
