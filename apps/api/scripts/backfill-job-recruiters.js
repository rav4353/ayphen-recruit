/**
 * Backfill script to set recruiterId for jobs that don't have one.
 * This assigns the job's creator (if available) or the first admin of the tenant as the recruiter.
 * 
 * Run with: node scripts/backfill-job-recruiters.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillJobRecruiters() {
  console.log('Starting job recruiter backfill...');

  // Find all jobs without a recruiterId
  const jobsWithoutRecruiter = await prisma.job.findMany({
    where: {
      recruiterId: null,
    },
    select: {
      id: true,
      title: true,
      tenantId: true,
      hiringManagerId: true,
      createdAt: true,
    },
  });

  console.log(`Found ${jobsWithoutRecruiter.length} jobs without a recruiter`);

  if (jobsWithoutRecruiter.length === 0) {
    console.log('No jobs need updating');
    return;
  }

  // Group jobs by tenant
  const jobsByTenant = {};
  for (const job of jobsWithoutRecruiter) {
    if (!jobsByTenant[job.tenantId]) {
      jobsByTenant[job.tenantId] = [];
    }
    jobsByTenant[job.tenantId].push(job);
  }

  let updated = 0;
  let skipped = 0;

  for (const [tenantId, jobs] of Object.entries(jobsByTenant)) {
    // Find the first admin or recruiter for this tenant
    const defaultRecruiter = await prisma.user.findFirst({
      where: {
        tenantId,
        role: { in: ['ADMIN', 'RECRUITER'] },
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!defaultRecruiter) {
      console.log(`No admin/recruiter found for tenant ${tenantId}, skipping ${jobs.length} jobs`);
      skipped += jobs.length;
      continue;
    }

    console.log(`Using ${defaultRecruiter.firstName} ${defaultRecruiter.lastName} (${defaultRecruiter.role}) for tenant ${tenantId}`);

    // Update all jobs for this tenant
    for (const job of jobs) {
      // Prefer hiring manager if available, otherwise use default recruiter
      const recruiterId = job.hiringManagerId || defaultRecruiter.id;

      await prisma.job.update({
        where: { id: job.id },
        data: { recruiterId },
      });

      console.log(`  Updated job "${job.title}" (${job.id}) with recruiter ${recruiterId}`);
      updated++;
    }
  }

  console.log(`\nBackfill complete: ${updated} jobs updated, ${skipped} jobs skipped`);
}

backfillJobRecruiters()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
