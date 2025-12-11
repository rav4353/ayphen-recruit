
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data population for specific tenant...');

    const tenantId = 'e4abb675-e78f-4621-84b4-97e7ccb7cbfd';

    // 1. Get the tenant
    let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
        console.log(`Tenant ${tenantId} not found.Creating it...`);
        // Try to create it if it doesn't exist, though usually we expect it to exist
        try {
            tenant = await prisma.tenant.create({
                data: {
                    id: tenantId,
                    name: 'Target Organization',
                    domain: 'target-org-' + uuidv4(),
                }
            });
        } catch (e) {
            console.error("Could not create tenant, maybe it exists but findUnique failed?", e);
            return;
        }
    }
    console.log(`Using tenant: ${tenant.name} (${tenant.id})`);

    // 2. Create Departments
    const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR'];
    for (const dept of departments) {
        await prisma.department.upsert({
            where: { name_tenantId: { name: dept, tenantId: tenant.id } },
            update: {},
            create: { name: dept, tenantId: tenant.id }
        });
    }
    console.log('Departments created.');

    // 3. Create Locations
    const locations = ['New York, NY', 'San Francisco, CA', 'London, UK', 'Remote'];
    for (const loc of locations) {
        const city = loc.split(',')[0];
        const country = loc.split(',')[1]?.trim() || 'Global';

        const existingLocation = await prisma.location.findFirst({
            where: {
                city,
                country,
                tenantId: tenant.id
            }
        });

        if (!existingLocation) {
            await prisma.location.create({
                data: {
                    name: loc,
                    city,
                    country,
                    tenantId: tenant.id
                }
            });
        }
    }
    console.log('Locations created.');

    // 4. Create Pipeline & Stages
    let pipeline = await prisma.pipeline.findFirst({ where: { tenantId: tenant.id, isDefault: true } });
    if (!pipeline) {
        pipeline = await prisma.pipeline.create({
            data: {
                name: 'Standard Hiring Pipeline',
                tenantId: tenant.id,
                isDefault: true,
                stages: {
                    create: [
                        { name: 'Applied', order: 1, color: '#3b82f6' },
                        { name: 'Screening', order: 2, color: '#8b5cf6' },
                        { name: 'Interview', order: 3, color: '#f59e0b' },
                        { name: 'Offer', order: 4, color: '#10b981' },
                        { name: 'Hired', order: 5, color: '#059669', isTerminal: true },
                    ]
                }
            }
        });
    }
    console.log('Pipeline created.');

    // 5. Create User
    const userEmail = 'admin@target-org.com';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await prisma.user.findUnique({
        where: { email_tenantId: { email: userEmail, tenantId: tenant.id } }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: userEmail,
                passwordHash: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                status: 'ACTIVE',
                tenantId: tenant.id,
            }
        });
        console.log(`User created: ${userEmail} / ${password}`);
    } else {
        console.log(`User already exists: ${userEmail}`);
    }

    // 6. Create Jobs
    const jobTitles = ['Senior Frontend Engineer', 'Product Manager', 'Sales Representative', 'HR Specialist'];

    // Get IDs for department and location
    const engineeringDept = await prisma.department.findFirst({ where: { name: 'Engineering', tenantId: tenant.id } });
    const remoteLoc = await prisma.location.findFirst({ where: { city: 'Remote', tenantId: tenant.id } });

    const createdJobs = [];
    for (const title of jobTitles) {
        const job = await prisma.job.create({
            data: {
                title,
                departmentId: engineeringDept?.id,
                locationId: remoteLoc?.id,
                tenantId: tenant.id,
                pipelineId: pipeline.id,
                status: 'OPEN',
                description: `We are looking for a talented ${title} to join our team.`,
                requirements: '- 5+ years of experience\n- Strong communication skills',
                benefits: '- Competitive salary\n- Remote work options',
                salaryMin: 100000,
                salaryMax: 150000,
                salaryCurrency: 'USD',
                recruiterId: user.id,
                hiringManagerId: user.id,
            }
        });
        createdJobs.push(job);
    }
    console.log('Jobs created.');

    // 7. Create Candidates & Applications for ALL jobs
    const stages = await prisma.pipelineStage.findMany({ where: { pipelineId: pipeline.id }, orderBy: { order: 'asc' } });

    for (const job of createdJobs) {
        const candidates = [
            { firstName: 'Alice', lastName: 'Smith', email: `alice-${job.id.substring(0, 4)}-${uuidv4()}@example.com` },
            { firstName: 'Bob', lastName: 'Jones', email: `bob-${job.id.substring(0, 4)}-${uuidv4()}@example.com` },
            { firstName: 'Charlie', lastName: 'Brown', email: `charlie-${job.id.substring(0, 4)}-${uuidv4()}@example.com` },
            { firstName: 'Diana', lastName: 'Prince', email: `diana-${job.id.substring(0, 4)}-${uuidv4()}@example.com` },
            { firstName: 'Evan', lastName: 'Wright', email: `evan-${job.id.substring(0, 4)}-${uuidv4()}@example.com` },
        ];

        for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            const candidate = await prisma.candidate.create({
                data: {
                    ...c,
                    tenantId: tenant.id,
                    source: 'LinkedIn',
                }
            });

            // Distribute across stages
            const stage = stages[i % stages.length];

            let status = 'APPLIED';
            if (stage.name === 'Screening') status = 'SCREENING';
            if (stage.name === 'Interview') status = 'INTERVIEW';
            if (stage.name === 'Offer') status = 'OFFER';
            if (stage.name === 'Hired') status = 'HIRED';

            const sources = ['LinkedIn', 'Referral', 'Website', 'Indeed', 'Agency'];
            const source = sources[i % sources.length];

            // Update candidate source
            await prisma.candidate.update({
                where: { id: candidate.id },
                data: { source }
            });

            await prisma.application.create({
                data: {
                    candidateId: candidate.id,
                    jobId: job.id,
                    currentStageId: stage.id,
                    status: status,
                    appliedAt: new Date(),
                }
            });
        }
    }
    console.log('Candidates and Applications created for all jobs.');

    console.log('Data population complete for tenant ' + tenantId);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
