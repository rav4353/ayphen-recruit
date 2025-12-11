/**
 * Add Sample Resume Text and Trigger Matching
 * Run with: node add-resume-text-and-match.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const CANDIDATE_ID = '073825df-c962-4a41-b167-3aabbf8b94be';

// Sample resume text for Ravanth Raja
const SAMPLE_RESUME_TEXT = `
RAVANTH RAJA
Software Engineer | Full Stack Developer

SUMMARY
Experienced full-stack developer with 5+ years of expertise in building scalable web applications. 
Proficient in React, Node.js, TypeScript, and cloud technologies. Strong background in product 
development and team collaboration.

EXPERIENCE

Senior Software Engineer | Tech Solutions Inc. | 2021 - Present
- Led development of enterprise SaaS platform serving 10,000+ users
- Built CI/CD pipelines reducing deployment time by 60%
- Mentored junior developers and conducted code reviews
- Technologies: React, TypeScript, Node.js, PostgreSQL, AWS

Full Stack Developer | Digital Innovations | 2019 - 2021
- Developed customer-facing web applications using React and Node.js
- Implemented RESTful APIs and microservices architecture
- Collaborated with UX designers to improve user experience
- Technologies: JavaScript, Express.js, MongoDB, Docker

EDUCATION
Bachelor of Technology in Computer Science | 2015 - 2019
XYZ University

SKILLS
Programming: JavaScript, TypeScript, Python, Java
Frontend: React, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, NestJS, FastAPI
Databases: PostgreSQL, MongoDB, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD, Git
Tools: VS Code, Jira, Postman, Figma

CERTIFICATIONS
- AWS Certified Developer Associate
- MongoDB Certified Developer
`;

async function updateCandidateWithResumeText() {
    console.log('📝 Adding resume text to candidate...');

    try {
        await prisma.candidate.update({
            where: { id: CANDIDATE_ID },
            data: {
                resumeText: SAMPLE_RESUME_TEXT,
                summary: 'Experienced full-stack developer with 5+ years of expertise in building scalable web applications.',
                skills: [
                    'JavaScript', 'TypeScript', 'Python', 'Java',
                    'React', 'Next.js', 'Vue.js', 'Node.js', 'Express',
                    'NestJS', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis',
                    'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git'
                ]
            }
        });

        console.log('✅ Resume text added successfully\n');
        return true;

    } catch (error) {
        console.error('❌ Failed to update candidate:', error.message);
        return false;
    }
}

async function triggerMatching() {
    console.log('🤖 Triggering AI matching for applications...\n');

    try {
        const applications = await prisma.application.findMany({
            where: { candidateId: CANDIDATE_ID },
            include: {
                candidate: {
                    select: {
                        resumeText: true,
                        firstName: true,
                        lastName: true
                    }
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        description: true
                    }
                }
            }
        });

        console.log(`Found ${applications.length} application(s)\n`);

        if (applications.length === 0) {
            console.log('⚠️  No applications found for this candidate');
            return;
        }

        let successCount = 0;

        for (const app of applications) {
            console.log(`Processing: ${app.job.title}`);

            if (!app.candidate.resumeText || !app.job.description) {
                console.log(`  ⚠️  Missing data - skipping\n`);
                continue;
            }

            try {
                console.log(`  🤖 Calling AI service...`);
                const response = await axios.post(`${AI_SERVICE_URL}/match`, {
                    resumeText: app.candidate.resumeText,
                    jobDescription: app.job.description
                }, {
                    timeout: 60000 // 60 second timeout for AI processing
                });

                console.log(`  ✅ AI responded with score: ${response.data.score.toFixed(1)}%`);

                await prisma.application.update({
                    where: { id: app.id },
                    data: {
                        matchScore: response.data.score,
                        matchSummary: response.data.summary
                    }
                });

                console.log(`  💾 Saved to database`);
                console.log(`  📝 Summary: ${response.data.summary.substring(0, 100)}...\n`);
                successCount++;

            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.error(`  ❌ AI Service is not running! Please start it with: pnpm dev:ai\n`);
                } else {
                    console.error(`  ❌ Error:`, error.response?.data?.detail || error.message, '\n');
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('='.repeat(60));
        console.log(`✅ Successfully matched ${successCount}/${applications.length} application(s)`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Failed to trigger matching:', error.message);
    }
}

async function main() {
    try {
        console.log('🚀 Starting Resume Update and AI Matching\n');
        console.log('Candidate: Ravanth Raja');
        console.log(`ID: ${CANDIDATE_ID}\n`);

        // Step 1: Add resume text
        const updated = await updateCandidateWithResumeText();
        if (!updated) {
            console.error('\n❌ Cannot proceed without updating candidate');
            process.exit(1);
        }

        // Step 2: Trigger matching
        await triggerMatching();

        console.log('\n✨ Complete!');
        console.log('\n📱 Next steps:');
        console.log('   1. Refresh the candidate detail page in your browser');
        console.log('   2. You should now see the AI Match Score and Analysis');
        console.log('   3. URL: http://localhost:3000/d7b3e2a0-5c9f-4b1a-9d8e-3f2c1b0a6e5d/candidates/073825df-c962-4a41-b167-3aabbf8b94be\n');

    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
