import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOnboarding() {
    console.log('🌱 Seeding Onboarding Data...');

    // Get an existing application (from seed data)
    const application = await prisma.application.findFirst({
        include: {
            candidate: true,
            job: true,
        },
    });

    if (!application) {
        console.log('❌ No applications found. Please run main seed first.');
        return;
    }

    // Check if onboarding already exists
    const existing = await prisma.onboardingWorkflow.findUnique({
        where: { applicationId: application.id },
    });

    if (existing) {
        console.log('⚠️  Onboarding already exists for this application');
        return;
    }

    // Create onboarding workflow
    const workflow = await prisma.onboardingWorkflow.create({
        data: {
            tenantId: application.job.tenantId,
            applicationId: application.id,
            status: 'IN_PROGRESS',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            progress: 0,
            tasks: {
                create: [
                    {
                        title: 'Upload Profile Photo',
                        description: 'Please upload a professional photo for your ID badge.',
                        assigneeRole: 'CANDIDATE',
                        order: 1,
                        status: 'PENDING',
                        isRequiredDoc: true,
                    },
                    {
                        title: 'Complete Personal Information',
                        description: 'Verify your contact details and emergency contacts.',
                        assigneeRole: 'CANDIDATE',
                        order: 2,
                        status: 'PENDING',
                    },
                    {
                        title: 'Provision Laptop',
                        description: 'Prepare and ship laptop to new hire.',
                        assigneeRole: 'IT',
                        order: 3,
                        status: 'PENDING',
                    },
                    {
                        title: 'Schedule Welcome Lunch',
                        description: 'Organize a team lunch for the first day.',
                        assigneeRole: 'MANAGER',
                        order: 4,
                        status: 'PENDING',
                    },
                    {
                        title: 'Verify Documents',
                        description: 'Check ID and tax forms.',
                        assigneeRole: 'HR',
                        order: 5,
                        status: 'PENDING',
                        isRequiredDoc: true,
                    },
                ],
            },
        },
        include: {
            tasks: true,
        },
    });

    console.log(`✅ Onboarding workflow created for ${application.candidate.firstName} ${application.candidate.lastName}`);
    console.log(`   Workflow ID: ${workflow.id}`);
    console.log(`   Portal Link: http://localhost:3000/portal/onboarding/${workflow.id}`);
    console.log(`   Tasks: ${workflow.tasks.length}`);
}

seedOnboarding()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
