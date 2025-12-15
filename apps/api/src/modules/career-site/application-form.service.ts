import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'rating'
  | 'yesno';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    allowedFileTypes?: string[];
    maxFileSize?: number; // in MB
  };
  options?: { value: string; label: string }[];
  conditionalLogic?: {
    showIf?: { fieldId: string; operator: 'equals' | 'notEquals' | 'contains'; value: any };
  };
  section?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
}

export interface ApplicationFormConfig {
  // Standard fields
  standardFields: {
    firstName: { enabled: boolean; required: boolean };
    lastName: { enabled: boolean; required: boolean };
    email: { enabled: boolean; required: boolean };
    phone: { enabled: boolean; required: boolean };
    resume: { enabled: boolean; required: boolean; allowedTypes: string[] };
    coverLetter: { enabled: boolean; required: boolean };
    linkedinUrl: { enabled: boolean; required: boolean };
    portfolioUrl: { enabled: boolean; required: boolean };
    currentCompany: { enabled: boolean; required: boolean };
    currentTitle: { enabled: boolean; required: boolean };
    expectedSalary: { enabled: boolean; required: boolean };
    noticePeriod: { enabled: boolean; required: boolean };
    workAuthorization: { enabled: boolean; required: boolean };
    referralSource: { enabled: boolean; required: boolean };
  };
  
  // Custom fields
  customFields: FormField[];
  
  // Sections
  sections: FormSection[];
  
  // Settings
  settings: {
    allowSaveProgress: boolean;
    showProgressBar: boolean;
    requireGdprConsent: boolean;
    gdprConsentText?: string;
    confirmationMessage: string;
    redirectUrl?: string;
    sendConfirmationEmail: boolean;
    confirmationEmailTemplateId?: string;
  };
  
  // Screening questions (per job)
  screeningQuestionsEnabled: boolean;
}

export interface JobApplicationForm {
  jobId: string;
  useGlobalForm: boolean;
  customFields?: FormField[];
  screeningQuestions?: FormField[];
}

const APPLICATION_FORM_CONFIG_KEY = 'application_form_config';
const JOB_APPLICATION_FORM_KEY = 'job_application_form';

@Injectable()
export class ApplicationFormService {
  private readonly logger = new Logger(ApplicationFormService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get global application form configuration
   */
  async getGlobalFormConfig(tenantId: string): Promise<ApplicationFormConfig> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: APPLICATION_FORM_CONFIG_KEY } },
    });

    const defaultConfig: ApplicationFormConfig = {
      standardFields: {
        firstName: { enabled: true, required: true },
        lastName: { enabled: true, required: true },
        email: { enabled: true, required: true },
        phone: { enabled: true, required: false },
        resume: { enabled: true, required: true, allowedTypes: ['pdf', 'doc', 'docx'] },
        coverLetter: { enabled: true, required: false },
        linkedinUrl: { enabled: true, required: false },
        portfolioUrl: { enabled: true, required: false },
        currentCompany: { enabled: true, required: false },
        currentTitle: { enabled: true, required: false },
        expectedSalary: { enabled: false, required: false },
        noticePeriod: { enabled: false, required: false },
        workAuthorization: { enabled: true, required: false },
        referralSource: { enabled: true, required: false },
      },
      customFields: [],
      sections: [
        { id: 'personal', title: 'Personal Information', order: 0 },
        { id: 'professional', title: 'Professional Background', order: 1 },
        { id: 'additional', title: 'Additional Information', order: 2 },
      ],
      settings: {
        allowSaveProgress: false,
        showProgressBar: true,
        requireGdprConsent: true,
        gdprConsentText: 'I consent to the processing of my personal data for recruitment purposes.',
        confirmationMessage: 'Thank you for your application! We will review it and get back to you soon.',
        sendConfirmationEmail: true,
      },
      screeningQuestionsEnabled: true,
    };

    if (!setting) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...(setting.value as unknown as Partial<ApplicationFormConfig>),
    };
  }

  /**
   * Update global application form configuration
   */
  async updateGlobalFormConfig(tenantId: string, config: Partial<ApplicationFormConfig>): Promise<ApplicationFormConfig> {
    const currentConfig = await this.getGlobalFormConfig(tenantId);
    const newConfig = { ...currentConfig, ...config };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: APPLICATION_FORM_CONFIG_KEY } },
      update: { value: newConfig as any },
      create: {
        tenantId,
        key: APPLICATION_FORM_CONFIG_KEY,
        value: newConfig as any,
        category: 'APPLICATION_FORM',
        isPublic: false,
      },
    });

    return newConfig;
  }

  /**
   * Add a custom field to the global form
   */
  async addCustomField(tenantId: string, field: Omit<FormField, 'id' | 'order'>): Promise<FormField> {
    const config = await this.getGlobalFormConfig(tenantId);

    const newField: FormField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      order: config.customFields.length,
    };

    config.customFields.push(newField);
    await this.updateGlobalFormConfig(tenantId, { customFields: config.customFields });

    return newField;
  }

  /**
   * Update a custom field
   */
  async updateCustomField(tenantId: string, fieldId: string, updates: Partial<FormField>): Promise<FormField> {
    const config = await this.getGlobalFormConfig(tenantId);
    const fieldIndex = config.customFields.findIndex(f => f.id === fieldId);

    if (fieldIndex === -1) {
      throw new NotFoundException('Field not found');
    }

    config.customFields[fieldIndex] = { ...config.customFields[fieldIndex], ...updates };
    await this.updateGlobalFormConfig(tenantId, { customFields: config.customFields });

    return config.customFields[fieldIndex];
  }

  /**
   * Delete a custom field
   */
  async deleteCustomField(tenantId: string, fieldId: string): Promise<{ success: boolean }> {
    const config = await this.getGlobalFormConfig(tenantId);
    config.customFields = config.customFields.filter(f => f.id !== fieldId);
    
    // Reorder remaining fields
    config.customFields = config.customFields.map((f, i) => ({ ...f, order: i }));
    
    await this.updateGlobalFormConfig(tenantId, { customFields: config.customFields });
    return { success: true };
  }

  /**
   * Reorder custom fields
   */
  async reorderCustomFields(tenantId: string, fieldIds: string[]): Promise<FormField[]> {
    const config = await this.getGlobalFormConfig(tenantId);
    
    const reordered = fieldIds.map((id, index) => {
      const field = config.customFields.find(f => f.id === id);
      if (!field) throw new NotFoundException(`Field ${id} not found`);
      return { ...field, order: index };
    });

    config.customFields = reordered;
    await this.updateGlobalFormConfig(tenantId, { customFields: config.customFields });

    return reordered;
  }

  /**
   * Get job-specific application form
   */
  async getJobForm(tenantId: string, jobId: string): Promise<{
    globalConfig: ApplicationFormConfig;
    jobConfig: JobApplicationForm | null;
    effectiveForm: ApplicationFormConfig;
  }> {
    const globalConfig = await this.getGlobalFormConfig(tenantId);

    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: `${JOB_APPLICATION_FORM_KEY}_${jobId}` } },
    });

    const jobConfig = setting?.value as unknown as JobApplicationForm | null;

    // If job uses global form or no custom config, return global
    if (!jobConfig || jobConfig.useGlobalForm) {
      return {
        globalConfig,
        jobConfig,
        effectiveForm: globalConfig,
      };
    }

    // Merge job-specific customizations
    const effectiveForm: ApplicationFormConfig = {
      ...globalConfig,
      customFields: jobConfig.customFields || globalConfig.customFields,
    };

    return { globalConfig, jobConfig, effectiveForm };
  }

  /**
   * Set job-specific form configuration
   */
  async setJobForm(tenantId: string, jobId: string, config: Partial<JobApplicationForm>): Promise<JobApplicationForm> {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const currentConfig = await this.getJobForm(tenantId, jobId);
    const newConfig: JobApplicationForm = {
      jobId,
      useGlobalForm: config.useGlobalForm ?? currentConfig.jobConfig?.useGlobalForm ?? true,
      customFields: config.customFields,
      screeningQuestions: config.screeningQuestions,
    };

    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: `${JOB_APPLICATION_FORM_KEY}_${jobId}` } },
      update: { value: newConfig as any },
      create: {
        tenantId,
        key: `${JOB_APPLICATION_FORM_KEY}_${jobId}`,
        value: newConfig as any,
        category: 'APPLICATION_FORM',
        isPublic: false,
      },
    });

    return newConfig;
  }

  /**
   * Add screening question to a job
   */
  async addScreeningQuestion(tenantId: string, jobId: string, question: Omit<FormField, 'id' | 'order'>): Promise<FormField> {
    const { jobConfig } = await this.getJobForm(tenantId, jobId);

    const newQuestion: FormField = {
      ...question,
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      order: (jobConfig?.screeningQuestions?.length || 0),
    };

    const questions = [...(jobConfig?.screeningQuestions || []), newQuestion];
    await this.setJobForm(tenantId, jobId, { screeningQuestions: questions });

    return newQuestion;
  }

  /**
   * Get public application form for a job
   */
  async getPublicApplicationForm(tenantId: string, jobId: string) {
    const { effectiveForm, jobConfig } = await this.getJobForm(tenantId, jobId);

    // Filter to only enabled fields
    const enabledStandardFields = Object.entries(effectiveForm.standardFields)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({
        id: key,
        type: this.getFieldType(key),
        label: this.getFieldLabel(key),
        required: config.required,
        ...(key === 'resume' && { allowedTypes: (config as any).allowedTypes }),
      }));

    const enabledCustomFields = effectiveForm.customFields.filter(f => f.enabled);
    const screeningQuestions = jobConfig?.screeningQuestions?.filter(q => q.enabled) || [];

    return {
      standardFields: enabledStandardFields,
      customFields: enabledCustomFields,
      screeningQuestions,
      sections: effectiveForm.sections,
      settings: {
        showProgressBar: effectiveForm.settings.showProgressBar,
        requireGdprConsent: effectiveForm.settings.requireGdprConsent,
        gdprConsentText: effectiveForm.settings.gdprConsentText,
      },
    };
  }

  /**
   * Validate application submission
   */
  async validateSubmission(tenantId: string, jobId: string, data: Record<string, any>): Promise<{
    valid: boolean;
    errors: { field: string; message: string }[];
  }> {
    const form = await this.getPublicApplicationForm(tenantId, jobId);
    const errors: { field: string; message: string }[] = [];

    // Validate standard fields
    for (const field of form.standardFields) {
      if (field.required && !data[field.id]) {
        errors.push({ field: field.id, message: `${field.label} is required` });
      }
    }

    // Validate custom fields
    for (const field of form.customFields) {
      const value = data[field.id];
      
      if (field.required && !value) {
        errors.push({ field: field.id, message: `${field.label} is required` });
        continue;
      }

      if (value && field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors.push({ field: field.id, message: `${field.label} must be at least ${field.validation.minLength} characters` });
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors.push({ field: field.id, message: `${field.label} must be at most ${field.validation.maxLength} characters` });
        }
        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
          errors.push({ field: field.id, message: `${field.label} has an invalid format` });
        }
      }
    }

    // Validate screening questions
    for (const question of form.screeningQuestions) {
      if (question.required && !data[question.id]) {
        errors.push({ field: question.id, message: `${question.label} is required` });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get available field types
   */
  getAvailableFieldTypes() {
    return [
      { type: 'text', label: 'Text Input', icon: 'type' },
      { type: 'textarea', label: 'Long Text', icon: 'align-left' },
      { type: 'email', label: 'Email', icon: 'mail' },
      { type: 'phone', label: 'Phone Number', icon: 'phone' },
      { type: 'url', label: 'URL', icon: 'link' },
      { type: 'number', label: 'Number', icon: 'hash' },
      { type: 'date', label: 'Date', icon: 'calendar' },
      { type: 'select', label: 'Dropdown', icon: 'chevron-down' },
      { type: 'multiselect', label: 'Multi-Select', icon: 'check-square' },
      { type: 'radio', label: 'Radio Buttons', icon: 'circle' },
      { type: 'checkbox', label: 'Checkbox', icon: 'check' },
      { type: 'file', label: 'File Upload', icon: 'paperclip' },
      { type: 'rating', label: 'Rating Scale', icon: 'star' },
      { type: 'yesno', label: 'Yes/No', icon: 'toggle-left' },
    ];
  }

  private getFieldType(key: string): FieldType {
    const typeMap: Record<string, FieldType> = {
      email: 'email',
      phone: 'phone',
      linkedinUrl: 'url',
      portfolioUrl: 'url',
      resume: 'file',
      coverLetter: 'textarea',
      expectedSalary: 'number',
      noticePeriod: 'select',
      workAuthorization: 'select',
      referralSource: 'select',
    };
    return typeMap[key] || 'text';
  }

  private getFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'Phone Number',
      resume: 'Resume/CV',
      coverLetter: 'Cover Letter',
      linkedinUrl: 'LinkedIn Profile',
      portfolioUrl: 'Portfolio URL',
      currentCompany: 'Current Company',
      currentTitle: 'Current Job Title',
      expectedSalary: 'Expected Salary',
      noticePeriod: 'Notice Period',
      workAuthorization: 'Work Authorization',
      referralSource: 'How did you hear about us?',
    };
    return labelMap[key] || key;
  }
}
