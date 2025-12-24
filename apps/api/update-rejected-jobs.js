/**
 * Script to update jobs with rejected approvals to have REJECTED status
 * Run: node update-rejected-jobs.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Finding jobs with rejected approvals...');

    // Find all job IDs that have rejected approvals
    const rejectedApprovals = await prisma.jobApproval.findMany({
        where: {
            status: 'REJECTED'
        },
        select: {
            jobId: true
        },
        distinct: ['jobId']
    });

    const jobIds = rejectedApprovals.map(a => a.jobId);

    console.log(`📋 Found ${jobIds.length} jobs with rejected approvals`);

    if (jobIds.length === 0) {
        console.log('✅ No jobs to update!');
        return;
    }

    // Update these jobs to REJECTED status if they're currently DRAFT
    const result = await prisma.job.updateMany({
        where: {
            id: { in: jobIds },
            status: 'DRAFT'
        },
        data: {
            status: 'REJECTED'
        }
    });

    console.log(`✅ Updated ${result.count} jobs from DRAFT to REJECTED`);

    // Show the updated jobs
    const updatedJobs = await prisma.job.findMany({
        where: {
            id: { in: jobIds }
        },
        select: {
            id: true,
            title: true,
            status: true
        }
    });

    console.log('\n📊 Jobs with rejected approvals:');
    updatedJobs.forEach(job => {
        console.log(`  - ${job.title} (${job.id}): ${job.status}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
