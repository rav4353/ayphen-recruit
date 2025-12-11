
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2] || 'imbharath656@gmail.com';
    console.log(`Testing job flow for user: ${email}`);

    const user = await prisma.user.findFirst({
        where: { email },
    });

    if (!user) {
        console.error('User not found');
        process.exit(1);
    }

    console.log(`Found user: ${user.id}`);

    // 1. Create Job
    console.log('Creating job...');
    const job = await prisma.job.create({
        data: {
            title: 'Test Job for Approval',
            description: 'Test Description',
            tenantId: user.tenantId,
            recruiterId: user.id,
            hiringManagerId: user.id, // Set HM as same user
            status: 'DRAFT',
        },
    });

    console.log(`Job created: ${job.id}`);
    console.log(`Job HiringManagerId: ${job.hiringManagerId}`);

    if (!job.hiringManagerId) {
        console.error('ERROR: hiringManagerId was not saved!');
    } else {
        console.log('SUCCESS: hiringManagerId saved correctly.');
    }

    // 2. Simulate Submit for Approval
    console.log('Simulating submit for approval...');

    // Logic from JobsService.submitForApproval
    let finalApproverIds = [];
    if (finalApproverIds.length === 0) {
        if (job.hiringManagerId) {
            console.log(`Using hiring manager ${job.hiringManagerId} as approver`);
            finalApproverIds = [job.hiringManagerId];
        } else {
            console.error('ERROR: No approvers and no HM!');
        }
    }

    if (finalApproverIds.length > 0) {
        console.log(`Creating approvals for: ${finalApproverIds.join(', ')}`);
        await prisma.jobApproval.createMany({
            data: finalApproverIds.map((approverId, index) => ({
                jobId: job.id,
                approverId,
                order: index + 1,
                status: 'PENDING'
            }))
        });
        console.log('Approvals created.');

        await prisma.job.update({
            where: { id: job.id },
            data: { status: 'PENDING_APPROVAL' }
        });
        console.log('Job status updated to PENDING_APPROVAL.');
    }

    // Cleanup
    console.log('Cleaning up...');
    await prisma.jobApproval.deleteMany({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
