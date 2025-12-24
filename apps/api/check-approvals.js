/**
 * Script to check job approvals in database
 * Run: node check-approvals.js <jobId>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const jobId = process.argv[2];

    if (!jobId) {
        console.error('❌ Please provide a job ID');
        console.log('Usage: node check-approvals.js <jobId>');
        process.exit(1);
    }

    console.log(`\n🔍 Checking approvals for job: ${jobId}\n`);

    const approvals = await prisma.jobApproval.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' },
        include: {
            approver: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    console.log(`📊 Found ${approvals.length} approval record(s):\n`);

    approvals.forEach((approval, index) => {
        console.log(`─────────────────────────────────────────────`);
        console.log(`Approval #${index + 1}:`);
        console.log(`  ID: ${approval.id}`);
        console.log(`  Approver: ${approval.approver.firstName} ${approval.approver.lastName}`);
        console.log(`  Status: ${approval.status}`);
        console.log(`  Order: ${approval.order}`);
        console.log(`  Rejection Reason: ${approval.rejectionReason || 'N/A'}`);
        console.log(`  Resubmission Comment: ${approval.resubmissionComment || 'N/A'}`);
        console.log(`  Comment: ${approval.comment || 'N/A'}`);
        console.log(`  Created: ${approval.createdAt}`);
        console.log(`  Updated: ${approval.updatedAt}`);
        console.log(`  Reviewed: ${approval.reviewedAt || 'N/A'}`);
        console.log(`  Approved: ${approval.approvedAt || 'N/A'}`);
        console.log(`  Rejected: ${approval.rejectedAt || 'N/A'}`);
    });

    console.log(`─────────────────────────────────────────────\n`);

    if (approvals.length === 1) {
        console.log('⚠️  WARNING: Only ONE approval record found!');
        console.log('   Expected: Multiple records for each rejection/resubmission cycle\n');
    } else if (approvals.length > 1) {
        console.log('✅ Multiple approval records found - this is correct!\n');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
