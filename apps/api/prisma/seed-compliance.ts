import { PrismaClient, JobStatus, UserRole, BGVProvider, BGVStatus, BGVCheckType, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting compliance data seed...');

  // Get tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'ayphen-recruit' } });
  if (!tenant) {
    console.error('❌ Default tenant not found. Please run main seed first.');
    return;
  }
  const tenantId = tenant.id;

  // Get a user for attribution
  const recruiter = await prisma.user.findFirst({ where: { tenantId, role: UserRole.RECRUITER } });
  const userId = recruiter?.id;

  // 1. GDPR - Old candidates (Data Retention)
  // Create a candidate created > 1 year ago
  await prisma.candidate.create({
    data: {
      tenantId,
      firstName: 'Old',
      lastName: 'Candidate',
      email: 'old.candidate@example.com',
      gdprConsent: true,
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // ~13 months ago
      updatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    }
  });

  // 2. GDPR - Recent candidate missing consent
  await prisma.candidate.create({
    data: {
      tenantId,
      firstName: 'NoConsent',
      lastName: 'Candidate',
      email: 'noconsent.candidate@example.com',
      gdprConsent: false, // TRIGGER
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }
  });

  // 3. Background Check - Failed
  // Need a candidate and application first
  const bgvCandidate = await prisma.candidate.create({
    data: {
      tenantId,
      firstName: 'Bgv',
      lastName: 'Failed',
      email: 'bgv.failed@example.com',
      gdprConsent: true,
    }
  });

  const job = await prisma.job.findFirst({ where: { tenantId } });
  if (job) {
    const app = await prisma.application.create({
      data: {
        candidateId: bgvCandidate.id,
        jobId: job.id,
        status: ApplicationStatus.OFFER,
      }
    });

    await prisma.bGVCheck.create({
      data: {
        provider: BGVProvider.CHECKR,
        status: BGVStatus.CONSIDER, // TRIGGER
        candidateId: bgvCandidate.id,
        applicationId: app.id,
        checkTypes: [BGVCheckType.CRIMINAL],
        initiatedById: userId,
      }
    });

     // 4. Background Check - Stuck Pending (> 14 days)
    const bgvStuckCandidate = await prisma.candidate.create({
        data: {
        tenantId,
        firstName: 'Bgv',
        lastName: 'Stuck',
        email: 'bgv.stuck@example.com',
        gdprConsent: true,
        }
    });
    const stuckApp = await prisma.application.create({
        data: {
            candidateId: bgvStuckCandidate.id,
            jobId: job.id,
            status: ApplicationStatus.OFFER,
        }
    });

    await prisma.bGVCheck.create({
        data: {
            provider: BGVProvider.CHECKR,
            status: BGVStatus.PENDING, // TRIGGER condition part 1
            candidateId: bgvStuckCandidate.id,
            applicationId: stuckApp.id,
            checkTypes: [BGVCheckType.IDENTITY],
            initiatedById: userId,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (TRIGGER condition part 2)
        }
    });

    // 5. SLA - Stale Application (> 7 days no activity)
    const staleCandidate = await prisma.candidate.create({
        data: {
            tenantId,
            firstName: 'Stale',
            lastName: 'App',
            email: 'stale.app@example.com',
            gdprConsent: true,
        }
    });

    await prisma.application.create({
        data: {
            candidateId: staleCandidate.id,
            jobId: job.id,
            status: ApplicationStatus.INTERVIEW,
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (TRIGGER)
            appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        }
    });
  }

    // 6. Diversity - Department with > 20 active applications
    // Create a specific department for this test
    const divDept = await prisma.department.create({
        data: {
            tenantId,
            name: 'High Volume Dept',
        }
    });

    // Create a job in this department
    const divJob = await prisma.job.create({
        data: {
            tenantId,
            departmentId: divDept.id,
            title: 'Mass Hiring Role',
            description: 'Testing diversity alert',
            status: JobStatus.OPEN,
        }
    });

    // Create 21 applications
    const candidatesData = Array.from({ length: 22 }).map((_, i) => ({
        tenantId,
        firstName: `DivCand${i}`,
        lastName: 'Test',
        email: `div.test.${i}@example.com`,
        gdprConsent: true,
    }));

    await prisma.candidate.createMany({ data: candidatesData });
    const newCandidates = await prisma.candidate.findMany({
        where: { email: { startsWith: 'div.test.' }, tenantId },
        select: { id: true }
    });

    const appsData = newCandidates.map(c => ({
        candidateId: c.id,
        jobId: divJob.id,
        status: ApplicationStatus.APPLIED,
    }));

    await prisma.application.createMany({ data: appsData });

  console.log('✅ Compliance data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
