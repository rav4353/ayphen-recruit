import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { Permission } from "../../common/constants/permissions";

import { CareerSiteService } from "./career-site.service";
import { ApplicationFormService } from "./application-form.service";
import { CustomDomainService } from "./custom-domain.service";

// ==================== CAREER SITE CONFIG (Admin) ====================

@ApiTags("career-site-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("career-site/admin")
export class CareerSiteAdminController {
  constructor(
    private readonly careerSiteService: CareerSiteService,
    private readonly domainService: CustomDomainService,
  ) {}

  @Get("config")
  @ApiOperation({ summary: "Get career site configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.careerSiteService.getConfig(user.tenantId);
  }

  @Put("config")
  @ApiOperation({ summary: "Update career site configuration" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateConfig(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, body);
  }

  @Put("branding")
  @ApiOperation({ summary: "Update branding settings" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateBranding(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, {
      branding: body,
    });
  }

  @Put("layout")
  @ApiOperation({ summary: "Update layout settings" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateLayout(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, { layout: body });
  }

  @Put("company-info")
  @ApiOperation({ summary: "Update company info" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateCompanyInfo(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, {
      companyInfo: body,
    });
  }

  @Put("seo")
  @ApiOperation({ summary: "Update SEO settings" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateSeo(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, { seo: body });
  }

  @Put("custom-code")
  @ApiOperation({ summary: "Update custom CSS/JS" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateCustomCode(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.updateConfig(user.tenantId, {
      customCode: body,
    });
  }

  // Pages
  @Post("pages")
  @ApiOperation({ summary: "Add a custom page" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  addPage(
    @CurrentUser() user: JwtPayload,
    @Body() body: { title: string; slug: string; content: string },
  ) {
    return this.careerSiteService.addPage(user.tenantId, body);
  }

  @Put("pages/:pageId")
  @ApiOperation({ summary: "Update a custom page" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updatePage(
    @CurrentUser() user: JwtPayload,
    @Param("pageId") pageId: string,
    @Body() body: any,
  ) {
    return this.careerSiteService.updatePage(user.tenantId, pageId, body);
  }

  @Delete("pages/:pageId")
  @ApiOperation({ summary: "Delete a custom page" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  deletePage(@CurrentUser() user: JwtPayload, @Param("pageId") pageId: string) {
    return this.careerSiteService.deletePage(user.tenantId, pageId);
  }

  // Testimonials
  @Post("testimonials")
  @ApiOperation({ summary: "Add a testimonial" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  addTestimonial(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.careerSiteService.addTestimonial(user.tenantId, body);
  }

  @Delete("testimonials/:testimonialId")
  @ApiOperation({ summary: "Delete a testimonial" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  deleteTestimonial(
    @CurrentUser() user: JwtPayload,
    @Param("testimonialId") testimonialId: string,
  ) {
    return this.careerSiteService.deleteTestimonial(
      user.tenantId,
      testimonialId,
    );
  }

  // Preview
  @Get("preview-url")
  @ApiOperation({ summary: "Generate preview URL" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getPreviewUrl(@CurrentUser() user: JwtPayload) {
    return this.careerSiteService.generatePreviewUrl(user.tenantId);
  }
}

// ==================== CUSTOM DOMAIN (Admin) ====================

@ApiTags("career-site-domain")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("career-site/domain")
export class CustomDomainController {
  constructor(private readonly domainService: CustomDomainService) {}

  @Get("status")
  @ApiOperation({ summary: "Get domain configuration status" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getDomainStatus(@CurrentUser() user: JwtPayload) {
    return this.domainService.checkDomainStatus(user.tenantId);
  }

  @Post("subdomain")
  @ApiOperation({ summary: "Set subdomain" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  setSubdomain(
    @CurrentUser() user: JwtPayload,
    @Body() body: { subdomain: string },
  ) {
    return this.domainService.setSubdomain(user.tenantId, body.subdomain);
  }

  @Post("custom")
  @ApiOperation({ summary: "Add custom domain" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  addCustomDomain(
    @CurrentUser() user: JwtPayload,
    @Body() body: { domain: string },
  ) {
    return this.domainService.addCustomDomain(user.tenantId, body.domain);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify custom domain" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  verifyDomain(@CurrentUser() user: JwtPayload) {
    return this.domainService.verifyCustomDomain(user.tenantId);
  }

  @Delete("custom")
  @ApiOperation({ summary: "Remove custom domain" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  removeCustomDomain(@CurrentUser() user: JwtPayload) {
    return this.domainService.removeCustomDomain(user.tenantId);
  }

  @Get("dns-instructions")
  @ApiOperation({ summary: "Get DNS configuration instructions" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  async getDnsInstructions(@CurrentUser() user: JwtPayload) {
    const config = await this.domainService.getDomainConfig(user.tenantId);
    if (!config?.customDomain || !config?.verificationToken) {
      return { error: "No custom domain configured" };
    }
    return this.domainService.getDnsInstructions(
      config.customDomain,
      config.verificationToken,
    );
  }
}

// ==================== APPLICATION FORM (Admin) ====================

@ApiTags("application-form-admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("career-site/application-form")
export class ApplicationFormAdminController {
  constructor(private readonly formService: ApplicationFormService) {}

  @Get("config")
  @ApiOperation({ summary: "Get global application form configuration" })
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.formService.getGlobalFormConfig(user.tenantId);
  }

  @Put("config")
  @ApiOperation({ summary: "Update global application form configuration" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateConfig(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.formService.updateGlobalFormConfig(user.tenantId, body);
  }

  @Get("field-types")
  @ApiOperation({ summary: "Get available field types" })
  getFieldTypes() {
    return this.formService.getAvailableFieldTypes();
  }

  // Custom Fields
  @Post("fields")
  @ApiOperation({ summary: "Add a custom field" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  addField(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.formService.addCustomField(user.tenantId, body);
  }

  @Put("fields/:fieldId")
  @ApiOperation({ summary: "Update a custom field" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  updateField(
    @CurrentUser() user: JwtPayload,
    @Param("fieldId") fieldId: string,
    @Body() body: any,
  ) {
    return this.formService.updateCustomField(user.tenantId, fieldId, body);
  }

  @Delete("fields/:fieldId")
  @ApiOperation({ summary: "Delete a custom field" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  deleteField(
    @CurrentUser() user: JwtPayload,
    @Param("fieldId") fieldId: string,
  ) {
    return this.formService.deleteCustomField(user.tenantId, fieldId);
  }

  @Put("fields/reorder")
  @ApiOperation({ summary: "Reorder custom fields" })
  @RequirePermissions(Permission.SETTINGS_EDIT)
  reorderFields(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fieldIds: string[] },
  ) {
    return this.formService.reorderCustomFields(user.tenantId, body.fieldIds);
  }

  // Job-specific form
  @Get("job/:jobId")
  @ApiOperation({ summary: "Get job-specific application form" })
  @RequirePermissions(Permission.JOB_VIEW)
  getJobForm(@CurrentUser() user: JwtPayload, @Param("jobId") jobId: string) {
    return this.formService.getJobForm(user.tenantId, jobId);
  }

  @Put("job/:jobId")
  @ApiOperation({ summary: "Set job-specific form configuration" })
  @RequirePermissions(Permission.JOB_EDIT)
  setJobForm(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
    @Body() body: any,
  ) {
    return this.formService.setJobForm(user.tenantId, jobId, body);
  }

  @Post("job/:jobId/screening-questions")
  @ApiOperation({ summary: "Add screening question to job" })
  @RequirePermissions(Permission.JOB_EDIT)
  addScreeningQuestion(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string,
    @Body() body: any,
  ) {
    return this.formService.addScreeningQuestion(user.tenantId, jobId, body);
  }
}

// ==================== PUBLIC CAREER SITE ====================

@ApiTags("public-career-site")
@Controller("careers")
export class PublicCareerSiteController {
  constructor(
    private readonly careerSiteService: CareerSiteService,
    private readonly formService: ApplicationFormService,
    private readonly domainService: CustomDomainService,
  ) {}

  @Get(":tenantId")
  @ApiOperation({ summary: "Get public career site data" })
  getCareerSite(@Param("tenantId") tenantId: string) {
    return this.careerSiteService.getPublicCareerSite(tenantId);
  }

  @Get(":tenantId/jobs")
  @ApiOperation({ summary: "Get public job listings" })
  getJobs(
    @Param("tenantId") tenantId: string,
    @Query("search") search?: string,
    @Query("department") department?: string,
    @Query("location") location?: string,
    @Query("employmentType") employmentType?: string,
    @Query("workLocation") workLocation?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.careerSiteService.getPublicJobs(tenantId, {
      search,
      department,
      location,
      employmentType,
      workLocation,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(":tenantId/jobs/:jobId")
  @ApiOperation({ summary: "Get public job details" })
  getJob(@Param("tenantId") tenantId: string, @Param("jobId") jobId: string) {
    return this.careerSiteService.getPublicJob(tenantId, jobId);
  }

  @Get(":tenantId/jobs/:jobId/application-form")
  @ApiOperation({ summary: "Get application form for a job" })
  getApplicationForm(
    @Param("tenantId") tenantId: string,
    @Param("jobId") jobId: string,
  ) {
    return this.formService.getPublicApplicationForm(tenantId, jobId);
  }

  @Post(":tenantId/jobs/:jobId/validate")
  @ApiOperation({ summary: "Validate application submission" })
  validateApplication(
    @Param("tenantId") tenantId: string,
    @Param("jobId") jobId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.formService.validateSubmission(tenantId, jobId, body);
  }

  // Domain resolution endpoint
  @Get("resolve/:domain")
  @ApiOperation({ summary: "Resolve tenant from domain" })
  async resolveDomain(@Param("domain") domain: string) {
    const tenantId = await this.domainService.resolveTenantFromDomain(domain);
    return { tenantId };
  }
}
