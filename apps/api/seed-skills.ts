import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMMON_SKILLS = [
    { name: 'JavaScript', synonyms: ['JS', 'ECMAScript'], category: 'Language' },
    { name: 'TypeScript', synonyms: ['TS'], category: 'Language' },
    { name: 'Python', synonyms: ['Py'], category: 'Language' },
    { name: 'Java', synonyms: [], category: 'Language' },
    { name: 'C#', synonyms: ['CSharp', '.NET'], category: 'Language' },
    { name: 'Go', synonyms: ['Golang'], category: 'Language' },
    { name: 'Rust', synonyms: [], category: 'Language' },
    { name: 'PHP', synonyms: [], category: 'Language' },
    { name: 'Ruby', synonyms: [], category: 'Language' },
    { name: 'Swift', synonyms: [], category: 'Language' },
    { name: 'Kotlin', synonyms: [], category: 'Language' },

    { name: 'React', synonyms: ['ReactJS', 'React.js'], category: 'Frontend' },
    { name: 'Angular', synonyms: ['AngularJS', 'Angular.js'], category: 'Frontend' },
    { name: 'Vue.js', synonyms: ['Vue', 'VueJS'], category: 'Frontend' },
    { name: 'Svelte', synonyms: [], category: 'Frontend' },
    { name: 'Next.js', synonyms: ['NextJS'], category: 'Frontend' },
    { name: 'Nuxt.js', synonyms: ['Nuxt'], category: 'Frontend' },
    { name: 'Tailwind CSS', synonyms: ['Tailwind'], category: 'Frontend' },
    { name: 'Bootstrap', synonyms: [], category: 'Frontend' },

    { name: 'Node.js', synonyms: ['Node', 'NodeJS'], category: 'Backend' },
    { name: 'Express.js', synonyms: ['Express'], category: 'Backend' },
    { name: 'NestJS', synonyms: ['Nest'], category: 'Backend' },
    { name: 'Django', synonyms: [], category: 'Backend' },
    { name: 'Flask', synonyms: [], category: 'Backend' },
    { name: 'FastAPI', synonyms: [], category: 'Backend' },
    { name: 'Spring Boot', synonyms: ['Spring'], category: 'Backend' },
    { name: 'ASP.NET Core', synonyms: [], category: 'Backend' },
    { name: 'Laravel', synonyms: [], category: 'Backend' },
    { name: 'Ruby on Rails', synonyms: ['Rails'], category: 'Backend' },

    { name: 'PostgreSQL', synonyms: ['Postgres'], category: 'Database' },
    { name: 'MySQL', synonyms: [], category: 'Database' },
    { name: 'MongoDB', synonyms: ['Mongo'], category: 'Database' },
    { name: 'Redis', synonyms: [], category: 'Database' },
    { name: 'Elasticsearch', synonyms: [], category: 'Database' },
    { name: 'DynamoDB', synonyms: [], category: 'Database' },

    { name: 'Docker', synonyms: [], category: 'DevOps' },
    { name: 'Kubernetes', synonyms: ['K8s'], category: 'DevOps' },
    { name: 'AWS', synonyms: ['Amazon Web Services'], category: 'Cloud' },
    { name: 'Azure', synonyms: ['Microsoft Azure'], category: 'Cloud' },
    { name: 'Google Cloud Platform', synonyms: ['GCP'], category: 'Cloud' },
    { name: 'Terraform', synonyms: [], category: 'DevOps' },
    { name: 'Jenkins', synonyms: [], category: 'DevOps' },
    { name: 'GitHub Actions', synonyms: [], category: 'DevOps' },
    { name: 'GitLab CI', synonyms: [], category: 'DevOps' },

    { name: 'Git', synonyms: [], category: 'Tool' },
    { name: 'Jira', synonyms: [], category: 'Tool' },
    { name: 'Figma', synonyms: [], category: 'Design' },
];

async function main() {
    // Get the first tenant (or a specific one if you know the ID)
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
        console.error('No tenant found. Please create a tenant first.');
        return;
    }

    console.log(`Seeding skills for tenant: ${tenant.name} (${tenant.id})`);

    for (const skill of COMMON_SKILLS) {
        const exists = await prisma.skill.findUnique({
            where: {
                name_tenantId: {
                    name: skill.name,
                    tenantId: tenant.id,
                },
            },
        });

        if (!exists) {
            await prisma.skill.create({
                data: {
                    ...skill,
                    tenantId: tenant.id,
                },
            });
            console.log(`Created skill: ${skill.name}`);
        } else {
            console.log(`Skill already exists: ${skill.name}`);
        }
    }

    console.log('Skill seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
