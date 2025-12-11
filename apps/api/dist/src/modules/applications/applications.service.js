"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const workflows_service_1 = require("../workflows/workflows.service");
const sla_service_1 = require("../sla/sla.service");
const ai_service_1 = require("../ai/ai.service");
let ApplicationsService = class ApplicationsService {
    constructor(prisma, workflowsService, slaService, aiService) {
        this.prisma = prisma;
        this.workflowsService = workflowsService;
        this.slaService = slaService;
        this.aiService = aiService;
    }
    async create(dto) {
        const existing = await this.prisma.application.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId: dto.candidateId,
                    jobId: dto.jobId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Candidate has already applied to this job');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: dto.jobId },
            include: {
                pipeline: {
                    include: {
                        stages: { orderBy: { order: 'asc' }, take: 1 },
                    },
                },
            },
        });
        const firstStageId = job?.pipeline?.stages[0]?.id;
        let matchScore = null;
        let matchSummary = null;
        try {
            const candidate = await this.prisma.candidate.findUnique({
                where: { id: dto.candidateId },
                select: {
                    resumeText: true,
                    skills: true,
                    summary: true,
                    experience: true,
                    education: true,
                    firstName: true,
                    lastName: true
                }
            });
            let textToMatch = candidate?.resumeText;
            if (!textToMatch && candidate) {
                textToMatch = `Candidate: ${candidate.firstName} ${candidate.lastName}\n`;
                if (candidate.summary)
                    textToMatch += `Summary: ${candidate.summary}\n`;
                if (candidate.skills?.length)
                    textToMatch += `Skills: ${candidate.skills.join(', ')}\n`;
                if (candidate.experience)
                    textToMatch += `Experience: ${JSON.stringify(candidate.experience)}\n`;
                if (candidate.education)
                    textToMatch += `Education: ${JSON.stringify(candidate.education)}\n`;
            }
            if (textToMatch && job?.description) {
                const matchResult = await this.aiService.matchCandidate(textToMatch, job.description);
                matchScore = matchResult.score;
                matchSummary = matchResult.summary;
            }
        }
        catch (error) {
            console.error('Failed to calculate match score:', error);
        }
        return this.prisma.application.create({
            data: {
                candidateId: dto.candidateId,
                jobId: dto.jobId,
                coverLetter: dto.coverLetter,
                answers: dto.answers,
                currentStageId: firstStageId,
                status: 'APPLIED',
                matchScore,
                matchSummary,
            },
            include: {
                candidate: true,
                job: true,
                currentStage: true,
            },
        });
    }
    async createPublic(dto) {
        const job = await this.prisma.job.findUnique({
            where: { id: dto.jobId },
            include: {
                pipeline: {
                    include: {
                        stages: { orderBy: { order: 'asc' }, take: 1 },
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        let candidate = await this.prisma.candidate.findUnique({
            where: {
                email_tenantId: {
                    email: dto.email,
                    tenantId: job.tenantId,
                },
            },
        });
        if (!candidate) {
            candidate = await this.prisma.candidate.create({
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone,
                    linkedinUrl: dto.linkedinUrl,
                    portfolioUrl: dto.portfolioUrl,
                    resumeUrl: dto.resumeUrl,
                    gdprConsent: dto.gdprConsent || false,
                    tenantId: job.tenantId,
                    source: 'Career Page',
                },
            });
        }
        else {
            if (dto.resumeUrl) {
                await this.prisma.candidate.update({
                    where: { id: candidate.id },
                    data: { resumeUrl: dto.resumeUrl },
                });
            }
        }
        const existingApplication = await this.prisma.application.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId: candidate.id,
                    jobId: dto.jobId,
                },
            },
        });
        if (existingApplication) {
            throw new common_1.ConflictException('You have already applied to this position.');
        }
        const firstStageId = job.pipeline?.stages[0]?.id;
        let matchScore = null;
        let matchSummary = null;
        try {
            const candidateFull = await this.prisma.candidate.findUnique({
                where: { id: candidate.id }
            });
            let textToMatch = candidateFull?.resumeText;
            if (!textToMatch && candidateFull) {
                textToMatch = `Candidate: ${candidateFull.firstName} ${candidateFull.lastName}\n`;
                if (candidateFull.summary)
                    textToMatch += `Summary: ${candidateFull.summary}\n`;
                if (candidateFull.skills?.length)
                    textToMatch += `Skills: ${candidateFull.skills.join(', ')}\n`;
                if (candidateFull.experience)
                    textToMatch += `Experience: ${JSON.stringify(candidateFull.experience)}\n`;
                if (candidateFull.education)
                    textToMatch += `Education: ${JSON.stringify(candidateFull.education)}\n`;
            }
            if (textToMatch && job.description) {
                const matchResult = await this.aiService.matchCandidate(textToMatch, job.description);
                matchScore = matchResult.score;
                matchSummary = matchResult.summary;
            }
        }
        catch (error) {
            console.error('Failed to calculate match score for public app:', error);
        }
        const application = await this.prisma.application.create({
            data: {
                candidateId: candidate.id,
                jobId: dto.jobId,
                coverLetter: dto.coverLetter,
                currentStageId: firstStageId,
                status: 'APPLIED',
                matchScore,
                matchSummary,
            },
            include: {
                candidate: true,
                job: true,
                currentStage: true,
            },
        });
        await this.prisma.activityLog.create({
            data: {
                action: 'APPLICATION_CREATED',
                description: `Applied to ${job.title}`,
                candidateId: candidate.id,
                applicationId: application.id,
                metadata: { source: 'Career Page' },
            },
        });
        this.calculateMatch(application.id).catch(err => console.error('AI Match failed', err));
        return application;
    }
    async findAll(tenantId) {
        return this.prisma.application.findMany({
            where: { job: { tenantId } },
            include: {
                candidate: true,
                job: {
                    include: {
                        hiringManager: { select: { firstName: true, lastName: true } },
                        department: true,
                        location: true
                    }
                },
                currentStage: true,
            },
            orderBy: { appliedAt: 'desc' },
        });
    }
    async findByJob(jobId, options) {
        const where = { jobId };
        if (options?.status) {
            where.status = options.status;
        }
        if (options?.stageId) {
            where.currentStageId = options.stageId;
        }
        const applications = await this.prisma.application.findMany({
            where,
            include: {
                candidate: true,
                currentStage: true,
                job: { select: { title: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
                activities: {
                    where: { action: 'STAGE_CHANGED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { appliedAt: 'desc' },
        });
        const applicationsWithSla = await Promise.all(applications.map(async (app) => {
            const slaStatus = await this.slaService.calculateSlaStatus(app.id);
            return { ...app, slaStatus };
        }));
        return applicationsWithSla;
    }
    async findById(id) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                candidate: true,
                job: {
                    include: {
                        pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
                    },
                },
                currentStage: true,
                interviews: {
                    include: {
                        interviewer: { select: { id: true, firstName: true, lastName: true } },
                        feedbacks: true,
                    },
                },
                offers: true,
                activities: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return application;
    }
    async moveToStage(id, stageId, userId) {
        const application = await this.findById(id);
        const oldStageId = application.currentStageId;
        const updated = await this.prisma.application.update({
            where: { id },
            data: { currentStageId: stageId },
            include: { currentStage: true },
        });
        await this.prisma.activityLog.create({
            data: {
                action: 'STAGE_CHANGED',
                description: `Moved to ${updated.currentStage?.name}`,
                applicationId: id,
                userId,
                metadata: {
                    fromStageId: oldStageId,
                    toStageId: stageId,
                },
            },
        });
        try {
            await this.workflowsService.executeStageWorkflows(id, stageId, oldStageId || undefined);
        }
        catch (error) {
            console.error('Failed to execute workflows:', error);
        }
        return updated;
    }
    async updateStatus(id, status, reason) {
        const data = { status };
        if (status === 'REJECTED') {
            data.rejectionReason = reason;
        }
        else if (status === 'WITHDRAWN') {
            data.withdrawalReason = reason;
        }
        return this.prisma.application.update({
            where: { id },
            data,
        });
    }
    async assignTo(id, userId) {
        return this.prisma.application.update({
            where: { id },
            data: { assignedToId: userId },
        });
    }
    async calculateMatch(applicationId) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                candidate: true,
                job: true,
            }
        });
        if (!app || !app.candidate.resumeText || !app.job.description) {
            return;
        }
        try {
            const result = await this.aiService.matchCandidate(app.candidate.resumeText, app.job.description);
            await this.prisma.application.update({
                where: { id: applicationId },
                data: {
                    matchScore: result.score,
                    matchSummary: result.summary,
                }
            });
        }
        catch (error) {
            console.error(`Match calculation failed for ${applicationId}`, error);
        }
    }
    async copyToJob(applicationIds, targetJobId, userId) {
        const results = [];
        const targetJob = await this.prisma.job.findUnique({
            where: { id: targetJobId },
            include: {
                pipeline: {
                    include: {
                        stages: { orderBy: { order: 'asc' }, take: 1 },
                    },
                },
            },
        });
        if (!targetJob) {
            throw new common_1.NotFoundException('Target job not found');
        }
        const firstStageId = targetJob.pipeline?.stages[0]?.id;
        for (const appId of applicationIds) {
            try {
                const sourceApp = await this.prisma.application.findUnique({
                    where: { id: appId },
                });
                if (!sourceApp)
                    continue;
                const existing = await this.prisma.application.findUnique({
                    where: {
                        candidateId_jobId: {
                            candidateId: sourceApp.candidateId,
                            jobId: targetJobId,
                        },
                    },
                });
                if (existing) {
                    results.push({ id: appId, status: 'SKIPPED', message: 'Candidate already applied to target job' });
                    continue;
                }
                const newApp = await this.prisma.application.create({
                    data: {
                        candidateId: sourceApp.candidateId,
                        jobId: targetJobId,
                        currentStageId: firstStageId,
                        status: 'APPLIED',
                    },
                });
                await this.prisma.activityLog.create({
                    data: {
                        action: 'APPLICATION_COPIED',
                        description: `Copied from job ${sourceApp.jobId} to ${targetJob.title}`,
                        applicationId: newApp.id,
                        userId,
                        candidateId: sourceApp.candidateId,
                    },
                });
                results.push({ id: appId, status: 'SUCCESS', newApplicationId: newApp.id });
                this.calculateMatch(newApp.id).catch(console.error);
            }
            catch (error) {
                console.error(`Failed to copy application ${appId}`, error);
                results.push({ id: appId, status: 'ERROR', message: error.message });
            }
        }
        return results;
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        workflows_service_1.WorkflowsService,
        sla_service_1.SlaService,
        ai_service_1.AiService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map