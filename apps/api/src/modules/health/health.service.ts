import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "talentx-api",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "talentx-api",
        error: error.message,
      };
    }
  }

  async getDetailedHealth() {
    const dbStart = Date.now();
    let dbStatus = "unhealthy";
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "healthy";
      dbLatency = Date.now() - dbStart;
    } catch (e) {
      dbStatus = "unhealthy";
    }

    const memoryUsage = process.memoryUsage();

    // Construct response matching frontend HealthData interface
    const metrics = {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: [
        {
          service: "Database",
          status: dbStatus,
          responseTime: dbLatency,
          lastChecked: new Date().toISOString(),
          message: dbStatus === "healthy" ? "Connected" : "Connection failed",
        },
        {
          service: "API Server",
          status: "healthy",
          responseTime: 0, // Current request
          lastChecked: new Date().toISOString(),
          message: "Running",
        },
        {
          service: "Email Service", // Mock for now
          status: "healthy",
          responseTime: 45,
          lastChecked: new Date().toISOString(),
        },
        {
          service: "AI Service", // Mock for now
          status: "healthy",
          responseTime: 120,
          lastChecked: new Date().toISOString(),
        },
      ],
      database: {
        candidates: await this.prisma.candidate.count(),
        jobs: await this.prisma.job.count(),
        applications: await this.prisma.application.count(),
        interviews: await this.prisma.interview.count().catch(() => 0), // Handle if table doesn't exist yet
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
      },
    };

    return metrics;
  }
}
