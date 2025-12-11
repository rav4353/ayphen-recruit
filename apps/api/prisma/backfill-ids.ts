import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateEmployeeId() {
    const count = await prisma.user.count();
    // Start mainly from 1000 + count to ensure some uniqueness foundation, 
    // but better to just randomise or sequential if we could lock.
    // For backfill, simple sequential per record is fine.
    return `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function generateCandidateId() {
    return `CAN-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function main() {
    console.log('Starting backfill of IDs...');

    // Backfill Users
    const users = await prisma.user.findMany({
        where: { employeeId: null },
    });

    console.log(`Found ${users.length} users to backfill.`);

    for (const user of users) {
        let employeeId = await generateEmployeeId();
        let unique = false;
        while (!unique) {
            const existing = await prisma.user.findUnique({ where: { employeeId } });
            if (!existing) unique = true;
            else employeeId = await generateEmployeeId();
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { employeeId },
        });
        console.log(`Updated user ${user.email} with ID ${employeeId}`);
    }

    // Backfill Candidates
    const candidates = await prisma.candidate.findMany({
        where: { candidateId: null },
    });

    console.log(`Found ${candidates.length} candidates to backfill.`);

    for (const candidate of candidates) {
        let candidateId = await generateCandidateId();
        let unique = false;
        while (!unique) {
            const existing = await prisma.candidate.findUnique({ where: { candidateId } });
            if (!existing) unique = true;
            else candidateId = await generateCandidateId();
        }

        await prisma.candidate.update({
            where: { id: candidate.id },
            data: { candidateId },
        });
        console.log(`Updated candidate ${candidate.email} with ID ${candidateId}`);
    }

    // Backfill Jobs
    const jobs = await prisma.job.findMany({
        where: { jobCode: null },
    });

    console.log(`Found ${jobs.length} jobs to backfill.`);

    async function generateJobCode() {
        return `JOB-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    for (const job of jobs) {
        let jobCode = await generateJobCode();
        let unique = false;
        while (!unique) {
            const existing = await prisma.job.findUnique({ where: { jobCode } });
            if (!existing) unique = true;
            else jobCode = await generateJobCode();
        }

        await prisma.job.update({
            where: { id: job.id },
            data: { jobCode },
        });
        console.log(`Updated job ${job.title} with ID ${jobCode}`);
    }

    console.log('Backfill completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
