import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting fresh seed with REAL Tenant ID...');

    // 1. Cleanup potentially conflicting users to ensure clean login
    // We delete the old demo user so AuthService doesn't pick the wrong one by mistake
    try {
        await prisma.user.deleteMany({
            where: { email: 'recruiter@demo.com' }
        });
        console.log('Cleaned up old demo users.');
    } catch (e) {
        // Ignore if not found
    }

    // 2. Create a new Tenant with a REAL UUID (letting Prisma generate it)
    // We use a unique domain to avoid conflicts if run multiple times
    const domain = `ayphen-${Date.now()}.com`;
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Ayphen Recruit',
            domain: domain,
            settings: {},
        }
    });

    console.log(`Created Tenant: ${tenant.name} (ID: ${tenant.id})`);

    // 3. Create the User linked to this new Tenant
    const passwordHash = await bcrypt.hash('password123', 10);
    const email = 'recruiter@ayphen.com';

    const user = await prisma.user.create({
        data: {
            email,
            firstName: 'Jane',
            lastName: 'Recruiter',
            tenantId: tenant.id,
            role: 'RECRUITER',
            status: 'ACTIVE',
            passwordHash,
        },
    });

    console.log(`Created User: ${user.email}`);

    // 4. Create Default Pipeline
    const pipeline = await prisma.pipeline.create({
        data: {
            name: 'Standard Recruitment Pipeline',
            isDefault: true,
            tenantId: tenant.id,
            stages: {
                create: [
                    { name: 'Applied', order: 0, color: '#6366f1' },
                    { name: 'Screening', order: 1, color: '#8b5cf6' },
                    { name: 'Interview', order: 2, color: '#a855f7' },
                    { name: 'Offer', order: 3, color: '#22c55e' },
                    { name: 'Hired', order: 4, color: '#10b981' },
                ],
            },
        },
        include: { stages: true },
    });

    // 5. Create a Job
    const job = await prisma.job.create({
        data: {
            title: 'Senior Full Stack Engineer',
            description: 'We are looking for an experienced Full Stack Engineer to join our team...',
            tenantId: tenant.id,
            pipelineId: pipeline.id,
            status: 'OPEN',
            recruiterId: user.id,
            hiringManagerId: user.id,
        },
    });

    // 6. Create Candidates
    const candidates = [
        { firstName: 'Alice', lastName: 'Chen', email: 'alice.chen@example.com', stageName: 'Applied' },
        { firstName: 'Marcus', lastName: 'Johnson', email: 'marcus.j@example.com', stageName: 'Screening' },
        { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com', stageName: 'Interview' },
    ];

    for (const c of candidates) {
        const candidate = await prisma.candidate.create({
            data: {
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                tenantId: tenant.id,
            }
        });

        const stage = pipeline.stages.find(s => s.name === c.stageName);
        if (stage) {
            await prisma.application.create({
                data: {
                    candidateId: candidate.id,
                    jobId: job.id,
                    currentStageId: stage.id,
                    status: 'APPLIED',
                }
            });
        }
    }

    console.log('\n================================================');
    console.log('SEEDING COMPLETE');
    console.log('------------------------------------------------');
    console.log('Login Credentials:');
    console.log(`Email:    ${email}`);
    console.log(`Password: password123`);
    console.log(`Tenant ID: ${tenant.id} (Real UUID)`);
    console.log('================================================\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
