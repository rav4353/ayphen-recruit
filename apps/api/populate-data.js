const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data population...');

    // 1. Get the first tenant (or create one if none exists)
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('No tenant found. Creating one...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Demo Organization',
                domain: 'demo-org-' + uuidv4(),
            }
        });
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

    // 5. Create Jobs
    const jobTitles = ['Senior Frontend Engineer', 'Product Manager', 'Sales Representative', 'HR Specialist'];

    // Get IDs for department and location
    const engineeringDept = await prisma.department.findFirst({ where: { name: 'Engineering', tenantId: tenant.id } });
    const remoteLoc = await prisma.location.findFirst({ where: { city: 'Remote', tenantId: tenant.id } });

    for (const title of jobTitles) {
        await prisma.job.create({
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
            }
        });
    }
    console.log('Jobs created.');

    // 6. Create Candidates & Applications
    const firstJob = await prisma.job.findFirst({ where: { tenantId: tenant.id } });
    if (firstJob) {
        const candidates = [
            { firstName: 'Alice', lastName: 'Smith', email: `alice-${uuidv4()}@example.com` },
            { firstName: 'Bob', lastName: 'Jones', email: `bob-${uuidv4()}@example.com` },
            { firstName: 'Charlie', lastName: 'Brown', email: `charlie-${uuidv4()}@example.com` },
            { firstName: 'Diana', lastName: 'Prince', email: `diana-${uuidv4()}@example.com` },
            { firstName: 'Evan', lastName: 'Wright', email: `evan-${uuidv4()}@example.com` },
        ];

        const stages = await prisma.pipelineStage.findMany({ where: { pipelineId: pipeline.id }, orderBy: { order: 'asc' } });

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

            await prisma.application.create({
                data: {
                    candidateId: candidate.id,
                    jobId: firstJob.id,
                    currentStageId: stage.id,
                    status: 'APPLIED',
                    appliedAt: new Date(),
                }
            });
        }
        console.log('Candidates and Applications created.');
    }

    console.log('Data population complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
