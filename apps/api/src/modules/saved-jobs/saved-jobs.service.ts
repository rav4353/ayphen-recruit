import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
    constructor(private prisma: PrismaService) { }

    async saveJob(userId: string, jobId: string) {
        // Check if job exists
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        try {
            return await this.prisma.savedJob.create({
                data: {
                    userId,
                    jobId,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException('Job already saved');
            }
            throw error;
        }
    }

    async unsaveJob(userId: string, jobId: string) {
        try {
            // Use deleteMany to safely handle if it doesn't exist without error or complex unique key construction
            // Actually deleteMany returns count, delete throws if not found. 
            // Using delete with unique constraint is cleaner but requires knowing the constraint name.
            // Default constraint name for @@unique([userId, jobId]) is SavedJob_userId_jobId_key or similar?
            // Or simply userId_jobId.
            // Easiest is to try delete with userId_jobId.
            return await this.prisma.savedJob.delete({
                where: {
                    userId_jobId: {
                        userId,
                        jobId,
                    },
                },
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Saved job not found');
            }
            throw error;
        }
    }

    async getSavedJobs(userId: string) {
        return this.prisma.savedJob.findMany({
            where: { userId },
            include: {
                job: {
                    include: {
                        department: true,
                        locations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async isJobSaved(userId: string, jobId: string) {
        const saved = await this.prisma.savedJob.findUnique({
            where: {
                userId_jobId: {
                    userId,
                    jobId,
                },
            },
        });
        return !!saved;
    }
}
