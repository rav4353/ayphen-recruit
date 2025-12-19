import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminAuthService } from './services/super-admin-auth.service';
import { SuperAdminAuditService } from './services/super-admin-audit.service';
import { SuperAdminTenantsService } from './services/super-admin-tenants.service';
import { SuperAdminUsersService } from './services/super-admin-users.service';
import { SuperAdminSubscriptionsService } from './services/super-admin-subscriptions.service';
import { SuperAdminAnnouncementsService } from './services/super-admin-announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';
import { SuperAdminSupportService } from './services/super-admin-support.service';
import { UpdateTicketStatusDto, AddTicketMessageDto } from './dto/support-ticket.dto';
import { SuperAdminSecurityService } from './services/super-admin-security.service';
import { BlockIpDto } from './dto/security.dto';
import { SuperAdminBillingService } from './services/super-admin-billing.service';
import { SuperAdminMonitoringService } from './services/super-admin-monitoring.service';
import { SuperAdminApiManagementService } from './services/super-admin-api-management.service';
import { SuperAdminSettingsService } from './services/super-admin-settings.service';
import { GetLogsDto } from './dto/monitoring.dto';
import { CreateApiKeyDto, CreateWebhookDto } from './dto/api-management.dto';
import { CreatePlanDto, UpdatePlanDto, UpdatePaymentGatewayDto, UpdateEmailConfigDto, UpdateSettingDto } from './dto/subscriptions.dto';
import { AuthService } from '../auth/auth.service';
import { SuperAdminAnalyticsService } from './services/super-admin-analytics.service';
import { SuperAdminDataService } from './services/super-admin-data.service';
import { SuperAdminNotificationService } from './services/super-admin-notification.service';

// DTOs
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class SetupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(16)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  setupKey: string;
}

class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(16)
  newPassword: string;
}

class ForceChangePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(16)
  newPassword: string;
}

class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @IsNotEmpty()
  ownerFirstName: string;

  @IsString()
  @IsNotEmpty()
  ownerLastName: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsString()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle: string;
}

// Helper to get request metadata
function getRequestMeta(req: Request) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private superAdminService: SuperAdminService,
    private authService: SuperAdminAuthService,
    private auditService: SuperAdminAuditService,
    private tenantsService: SuperAdminTenantsService,
    private usersService: SuperAdminUsersService,
    private subscriptionsService: SuperAdminSubscriptionsService,
    private announcementsService: SuperAdminAnnouncementsService,
    private supportService: SuperAdminSupportService,
    private securityService: SuperAdminSecurityService,
    private billingService: SuperAdminBillingService,
    private monitoringService: SuperAdminMonitoringService,
    private apiManagementService: SuperAdminApiManagementService,
    private settingsService: SuperAdminSettingsService,
    private userAuthService: AuthService,
    private analyticsService: SuperAdminAnalyticsService,
    private dataService: SuperAdminDataService,
    private notificationService: SuperAdminNotificationService,
  ) { }

  // ==================== AUTH ====================

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const { ip, userAgent } = getRequestMeta(req);
    const result = await this.authService.login(dto.email, dto.password, ip, userAgent);
    return { success: true, data: result };
  }

  @Post('auth/setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() dto: SetupDto) {
    const result = await this.authService.setupInitialAdmin(
      dto.email,
      dto.password,
      dto.name,
      dto.setupKey,
    );
    return { success: true, data: result };
  }

  @Post('auth/logout')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const { ip, userAgent } = getRequestMeta(req);
    const user = req.user as any;
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(user.id, token, ip, userAgent);
    return { success: true };
  }

  @Post('auth/force-change-password')
  @HttpCode(HttpStatus.OK)
  async forceChangePassword(@Body() dto: ForceChangePasswordDto, @Req() req: Request) {
    const { ip, userAgent } = getRequestMeta(req);
    const result = await this.authService.forceChangePassword(
      dto.email,
      dto.currentPassword,
      dto.newPassword,
      ip,
      userAgent,
    );
    return { success: true, data: result };
  }

  @Post('auth/change-password')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const { ip, userAgent } = getRequestMeta(req);
    const user = req.user as any;
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      ip,
      userAgent,
    );
    return { success: true };
  }

  @Get('auth/profile')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getProfile(@Req() req: Request) {
    const user = req.user as any;
    const profile = await this.authService.getProfile(user.id);
    return { success: true, data: profile };
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard/stats')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getDashboardStats() {
    const stats = await this.superAdminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('dashboard/health')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSystemHealth() {
    const health = await this.superAdminService.getSystemHealth();
    return { success: true, data: health };
  }

  @Get('dashboard/activity')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getRecentActivity(@Query('limit') limit?: string) {
    const activity = await this.superAdminService.getRecentActivity(
      limit ? parseInt(limit, 10) : 10,
    );
    return { success: true, data: activity };
  }

  // ==================== TENANTS ====================

  @Get('tenants')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTenants(
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    const result = await this.tenantsService.getAll({
      page: page ? parseInt(page, 10) : 1,
      search,
      status,
      plan,
    });
    return { success: true, ...result };
  }

  @Get('tenants/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTenant(@Param('id') id: string) {
    const tenant = await this.tenantsService.getById(id);
    return { success: true, data: tenant };
  }

  @Post('tenants')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createTenant(@Body() dto: CreateTenantDto, @Req() req: Request) {
    const user = req.user as any;
    const tenant = await this.tenantsService.create(dto, user.id);
    return { success: true, data: tenant };
  }

  @Patch('tenants/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const tenant = await this.tenantsService.update(id, dto, user.id);
    return { success: true, data: tenant };
  }

  @Post('tenants/:id/suspend')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async suspendTenant(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    await this.tenantsService.suspend(id, reason, user.id);
    return { success: true };
  }

  @Post('tenants/:id/activate')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async activateTenant(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.tenantsService.activate(id, user.id);
    return { success: true };
  }

  @Delete('tenants/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteTenant(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.tenantsService.delete(id, user.id);
    return { success: true };
  }

  @Get('tenants/:id/users')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTenantUsers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.tenantsService.getUsers(id, {
      page: page ? parseInt(page, 10) : 1,
      search,
    });
    return { success: true, ...result };
  }

  @Get('tenants/:id/stats')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTenantStats(@Param('id') id: string) {
    const stats = await this.tenantsService.getStats(id);
    return { success: true, data: stats };
  }

  @Post('tenants/:tenantId/impersonate')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async impersonateUser(
    @Param('tenantId') tenantId: string,
    @Body('userId') userId: string,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    const result = await this.tenantsService.impersonate(userId, admin.id, this.userAuthService);
    return { success: true, data: result };
  }

  // ==================== USERS ====================

  @Get('users')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getUsers(
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const result = await this.usersService.getAll({
      page: page ? parseInt(page, 10) : 1,
      search,
      role,
      tenantId,
    });
    return { success: true, ...result };
  }

  @Get('users/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.getById(id);
    return { success: true, data: user };
  }

  @Post('users/:id/suspend')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    await this.usersService.suspend(id, reason, user.id);
    return { success: true };
  }

  @Post('users/:id/activate')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.usersService.activate(id, user.id);
    return { success: true };
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.usersService.delete(id, user.id);
    return { success: true };
  }

  @Post('users/:id/reset-password')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.usersService.resetPassword(id, user.id);
    return { success: true };
  }

  // ==================== SUBSCRIPTIONS ====================

  @Get('subscriptions')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSubscriptions(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    const result = await this.subscriptionsService.getAll({
      page: page ? parseInt(page, 10) : 1,
      status,
      plan,
    });
    return { success: true, ...result };
  }

  @Get('subscriptions/plans')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getPlans() {
    const plans = await this.subscriptionsService.getPlans();
    return { success: true, data: plans };
  }

  @Post('subscriptions/plans')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createPlan(@Body() dto: CreatePlanDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const plan = await this.subscriptionsService.createPlan(dto, user.id);
    return { success: true, data: plan };
  }

  @Patch('subscriptions/plans/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const plan = await this.subscriptionsService.updatePlan(id, dto, user.id);
    return { success: true, data: plan };
  }

  @Delete('subscriptions/plans/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deletePlan(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    await this.subscriptionsService.deletePlan(id, user.id);
    return { success: true };
  }

  @Get('subscriptions/stats')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSubscriptionStats() {
    const stats = await this.subscriptionsService.getStats();
    return { success: true, data: stats };
  }

  @Post('subscriptions')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createSubscription(@Body() dto: CreateSubscriptionDto, @Req() req: Request) {
    const user = req.user as any;
    await this.subscriptionsService.create(dto.tenantId, dto, user.id);
    return { success: true };
  }

  @Post('subscriptions/:id/cancel')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Req() req?: Request,
  ) {
    const user = req?.user as any;
    await this.subscriptionsService.cancel(id, reason, user?.id);
    return { success: true };
  }

  @Post('subscriptions/:id/extend')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async extendSubscription(
    @Param('id') id: string,
    @Body('days') days: number,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    await this.subscriptionsService.extend(id, days, user.id);
    return { success: true };
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.auditService.getAll({
      page: page ? parseInt(page, 10) : 1,
      action,
      entityType,
      startDate,
      endDate,
    });
    return { success: true, ...result };
  }

  @Get('audit-logs/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getAuditLog(@Param('id') id: string) {
    const log = await this.auditService.getById(id);
    return { success: true, data: log };
  }

  // ==================== ADVANCED FEATURES ====================

  // --- Monitoring ---
  @Get('monitoring/stats')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getMonitoringStats() {
    return { success: true, data: { status: 'healthy', cpu: 45, memory: 60, disk: 30 } };
  }

  // --- Security ---
  @Get('security/alerts')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSecurityAlerts() {
    const alerts = await this.securityService.getAlerts();
    return { success: true, data: alerts };
  }

  @Post('security/alerts/:id/resolve')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async resolveSecurityAlert(@Param('id') id: string) {
    const alert = await this.securityService.resolveAlert(id);
    return { success: true, data: alert };
  }

  @Get('security/blocked-ips')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getBlockedIps() {
    const ips = await this.securityService.getBlockedIps();
    return { success: true, data: ips };
  }

  @Post('security/blocked-ips')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async blockIp(@Body() dto: BlockIpDto, @Req() req: Request) {
    const user = req.user as any;
    const blockedIp = await this.securityService.blockIp(dto, user.id);
    return { success: true, data: blockedIp };
  }

  @Delete('security/blocked-ips/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async unblockIp(@Param('id') id: string) {
    await this.securityService.unblockIp(id);
    return { success: true };
  }

  @Get('security/login-attempts')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getLoginAttempts(
    @Query('success') success?: string,
    @Query('page') page?: string,
  ) {
    const attempts = await this.securityService.getLoginAttempts({
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
    });
    return { success: true, data: attempts };
  }

  @Get('security/sessions')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getActiveSessions() {
    const sessions = await this.securityService.getActiveSessions();
    return { success: true, data: sessions };
  }

  // --- Announcements ---
  @Get('announcements')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getAnnouncements() {
    const announcements = await this.announcementsService.getAll();
    return { success: true, data: announcements };
  }

  @Post('announcements')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createAnnouncement(@Body() dto: CreateAnnouncementDto, @Req() req: Request) {
    const user = req.user as any;
    const announcement = await this.announcementsService.create(dto, user.id);
    return { success: true, data: announcement };
  }

  @Patch('announcements/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    const announcement = await this.announcementsService.update(id, dto);
    return { success: true, data: announcement };
  }

  @Delete('announcements/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteAnnouncement(@Param('id') id: string) {
    await this.announcementsService.delete(id);
    return { success: true };
  }

  @Post('announcements/:id/publish')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async publishAnnouncement(@Param('id') id: string) {
    const announcement = await this.announcementsService.publish(id);
    return { success: true, data: announcement };
  }



  // --- Support ---
  @Get('support/tickets')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSupportTickets(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.supportService.getAll({
      page: page ? parseInt(page, 10) : 1,
      status,
      priority,
      search,
    });
    return { success: true, ...result };
  }

  @Get('support/tickets/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSupportTicket(@Param('id') id: string) {
    const ticket = await this.supportService.getById(id);
    return { success: true, data: ticket };
  }

  @Patch('support/tickets/:id/status')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    const ticket = await this.supportService.updateStatus(id, dto);
    return { success: true, data: ticket };
  }

  @Post('support/tickets/:id/messages')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async addTicketMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const message = await this.supportService.addMessage(id, dto, user.id);
    return { success: true, data: message };
  }

  @Delete('security/sessions/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async revokeSession(@Param('id') id: string) {
    await this.securityService.revokeSession(id);
    return { success: true };
  }

  // --- Billing ---
  @Get('billing/invoices')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getInvoices(@Query('page') page?: string) {
    const result = await this.billingService.getInvoices({
      page: page ? parseInt(page, 10) : 1,
    });
    return { success: true, ...result };
  }

  @Get('billing/gateways')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getPaymentGateways() {
    const gateways = await this.billingService.getPaymentGateways();
    return { success: true, data: gateways };
  }

  @Post('billing/gateways')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updatePaymentGateway(@Body() dto: UpdatePaymentGatewayDto) {
    const gateway = await this.billingService.updatePaymentGateway(dto);
    return { success: true, data: gateway };
  }

  // --- Data ---
  @Get('data/backups')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getBackups() {
    const backups = await this.billingService.getBackups();
    return { success: true, data: backups };
  }

  // --- Monitoring ---
  @Get('monitoring/logs')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSystemLogs(@Query() query: GetLogsDto) {
    const result = await this.monitoringService.getLogs(query);
    return { success: true, ...result };
  }

  @Get('monitoring/resources')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getResourceUsage() {
    const usage = await this.monitoringService.getResourceUsage();
    return { success: true, data: usage };
  }

  @Get('monitoring/jobs')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getJobStats() {
    const stats = await this.monitoringService.getJobStats();
    return { success: true, data: stats };
  }

  // --- API & Webhooks ---
  @Get('api/keys')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getApiKeys(
    @Query('page') page?: string,
    @Query('tenantId') tenantId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.apiManagementService.getApiKeys({
      page: page ? parseInt(page, 10) : 1,
      tenantId,
      search,
    });
    return { success: true, ...result };
  }

  @Post('api/keys')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createApiKey(@Body() dto: CreateApiKeyDto, @Req() req: Request) {
    const admin = req.user as any;
    const key = await this.apiManagementService.createApiKey(dto, admin.id);
    return { success: true, data: key };
  }

  @Delete('api/keys/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async revokeApiKey(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    await this.apiManagementService.revokeApiKey(id, admin.id);
    return { success: true };
  }

  @Get('api/usage')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getApiUsage(@Query('tenantId') tenantId?: string) {
    const result = await this.apiManagementService.getApiUsage({ tenantId });
    return { success: true, data: result };
  }

  @Get('api/webhooks')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getWebhooks(@Query('tenantId') tenantId?: string) {
    const webhooks = await this.apiManagementService.getWebhookSubscriptions({ tenantId });
    return { success: true, data: webhooks };
  }

  @Post('api/webhooks')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createWebhook(@Body() dto: CreateWebhookDto, @Req() req: Request) {
    const admin = req.user as any;
    const webhook = await this.apiManagementService.createWebhookSubscription(dto, admin.id);
    return { success: true, data: webhook };
  }

  @Delete('api/webhooks/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteWebhook(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    await this.apiManagementService.deleteWebhookSubscription(id, admin.id);
    return { success: true };
  }

  // ==================== SYSTEM SETTINGS ====================

  @Get('settings')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getSettings() {
    const settings = await this.settingsService.getAll();
    return { success: true, data: settings };
  }

  @Patch('settings')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateSetting(@Body() dto: UpdateSettingDto) {
    await this.settingsService.update(dto.key, dto.value);
    return { success: true };
  }

  @Get('settings/email')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getEmailConfig() {
    const config = await this.settingsService.getEmailConfig();
    return { success: true, data: config };
  }

  @Patch('settings/email')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateEmailConfig(@Body() dto: UpdateEmailConfigDto) {
    await this.settingsService.updateEmailConfig(dto);
    return { success: true };
  }

  @Get('settings/feature-flags')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getFeatureFlags() {
    const flags = await this.settingsService.getFeatureFlagsWithMetadata();
    return { success: true, data: flags };
  }

  @Patch('settings/feature-flags/:flag')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async updateFeatureFlag(
    @Param('flag') flag: string,
    @Body('enabled') enabled: boolean,
  ) {
    await this.settingsService.updateFeatureFlag(flag, enabled);
    return { success: true };
  }

  @Get('settings/maintenance')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getMaintenanceMode() {
    const result = await this.settingsService.getMaintenanceMode();
    return { success: true, data: result };
  }

  @Post('settings/maintenance')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async setMaintenanceMode(
    @Body('enabled') enabled: boolean,
    @Body('message') message?: string,
  ) {
    await this.settingsService.setMaintenanceMode(enabled, message);
    return { success: true };
  }

  // ==================== ANALYTICS ====================

  @Get('analytics/overview')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getAnalyticsOverview(@Query('period') period?: 'day' | 'week' | 'month' | 'year') {
    const data = await this.analyticsService.getOverview(period || 'month');
    return { success: true, data };
  }

  @Get('analytics/tenant-growth')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTenantGrowth(@Query('period') period?: 'day' | 'week' | 'month' | 'year') {
    const data = await this.analyticsService.getTenantGrowth(period || 'month');
    return { success: true, data };
  }

  @Get('analytics/user-growth')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getUserGrowth(@Query('period') period?: 'day' | 'week' | 'month' | 'year') {
    const data = await this.analyticsService.getUserGrowth(period || 'month');
    return { success: true, data };
  }

  @Get('analytics/top-tenants')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getTopTenants(@Query('limit') limit?: string) {
    const data = await this.analyticsService.getTopTenants(
      limit ? parseInt(limit, 10) : 10,
    );
    return { success: true, data };
  }

  @Get('analytics/usage')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getUsageMetrics(@Query('tenantId') tenantId?: string) {
    const data = await this.analyticsService.getUsageMetrics(tenantId);
    return { success: true, data };
  }

  @Get('analytics/plan-distribution')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getPlanDistribution() {
    const data = await this.analyticsService.getPlanDistribution();
    return { success: true, data };
  }

  // ==================== DATA MANAGEMENT ====================

  @Get('data/exports')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getDataExports(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.dataService.getDataExports({
      page: page ? parseInt(page, 10) : 1,
      status,
    });
    return { success: true, ...result };
  }

  @Post('data/exports')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async createDataExport(
    @Body() body: { tenantId: string; type: string },
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    const result = await this.dataService.createDataExport(body, user.id);
    return { success: true, data: result };
  }

  @Get('data/gdpr-requests')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getGDPRRequests(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.dataService.getGDPRRequests({
      page: page ? parseInt(page, 10) : 1,
      status,
      type,
    });
    return { success: true, ...result };
  }

  @Post('data/gdpr-requests/:id/process')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async processGDPRRequest(
    @Param('id') id: string,
    @Body('action') action: 'complete' | 'reject',
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    const result = await this.dataService.processGDPRRequest(id, action, user.id);
    return { success: true, data: result };
  }

  @Post('data/cleanup/:task')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async runCleanupTask(
    @Param('task') task: 'audit_logs' | 'sessions' | 'orphaned_files' | 'deleted_records',
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    const result = await this.dataService.runCleanupTask(task, user.id);
    return { success: true, data: result };
  }

  // ==================== NOTIFICATIONS ====================

  @Get('notifications')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getNotifications(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const user = req.user as { id: string };
    const result = await this.notificationService.getAll(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type: type as any,
      priority: priority as any,
      unreadOnly: unreadOnly === 'true',
    });
    return { success: true, ...result };
  }

  @Get('notifications/unread-count')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async getUnreadCount(@Req() req: Request) {
    const user = req.user as { id: string };
    const count = await this.notificationService.getUnreadCount(user.id);
    return { success: true, data: { count } };
  }

  @Post('notifications/mark-read')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async markNotificationsRead(
    @Req() req: Request,
    @Body('notificationIds') notificationIds: string[],
  ) {
    const user = req.user as { id: string };
    const result = await this.notificationService.markAsRead(user.id, notificationIds);
    return { success: true, data: result };
  }

  @Post('notifications/mark-all-read')
  @UseGuards(AuthGuard('super-admin-jwt'))
  @HttpCode(HttpStatus.OK)
  async markAllNotificationsRead(@Req() req: Request) {
    const user = req.user as { id: string };
    const result = await this.notificationService.markAllAsRead(user.id);
    return { success: true, data: result };
  }

  @Delete('notifications/:id')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteNotification(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    const result = await this.notificationService.delete(user.id, id);
    return { success: true, data: result };
  }

  @Delete('notifications')
  @UseGuards(AuthGuard('super-admin-jwt'))
  async deleteAllNotifications(
    @Req() req: Request,
    @Query('readOnly') readOnly?: string,
  ) {
    const user = req.user as { id: string };
    const result = await this.notificationService.deleteAll(user.id, readOnly === 'true');
    return { success: true, data: result };
  }
}
