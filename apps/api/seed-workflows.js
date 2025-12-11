const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('No tenant found');
        return;
    }

    const pipeline = await prisma.pipeline.findFirst({
        where: { tenantId: tenant.id, isDefault: true },
        include: { stages: true },
    });

    if (!pipeline) {
        console.error('No default pipeline found');
        return;
    }

    const interviewStage = pipeline.stages.find(s => s.name === 'Interview');
    if (!interviewStage) {
        console.error('Interview stage not found');
        return;
    }

    console.log(`Creating workflow for stage: ${interviewStage.name} (${interviewStage.id})`);

    await prisma.workflowAutomation.create({
        data: {
            name: 'Send Interview Confirmation',
            description: 'Sends an email to the candidate when they are moved to the Interview stage.',
            stageId: interviewStage.id,
            trigger: 'STAGE_ENTER',
            isActive: true,
            conditions: {},
            actions: [
                {
                    type: 'SEND_EMAIL',
                    config: {
                        to: 'CANDIDATE',
                        subject: 'Interview Invitation - {{job_title}}',
                        body: '<p>Hi {{candidate_name}},</p><p>We are excited to invite you to an interview for the {{job_title}} position.</p><p>Best,<br>TalentX Team</p>',
                    },
                },
            ],
        },
    });

    console.log('Workflow created successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
