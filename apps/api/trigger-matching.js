/**
 * Trigger AI Matching for All Applications
 * Run with: node trigger-matching.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function matchApplication(application) {
    console.log(`\nProcessing application ${application.id}...`);
    console.log(`  Candidate: ${application.candidate.firstName} ${application.candidate.lastName}`);
    console.log(`  Job: ${application.job.title}`);

    if (!application.candidate.resumeText) {
        console.log(`  ⚠️  No resume text found - skipping`);
        return false;
    }

    if (!application.job.description) {
        console.log(`  ⚠️  No job description found - skipping`);
        return false;
    }

    try {
        // Call AI service
        console.log(`  🤖 Calling AI service...`);
        const response = await axios.post(`${AI_SERVICE_URL}/match`, {
            resumeText: application.candidate.resumeText,
            jobDescription: application.job.description
        });

        const { score, summary } = response.data;

        // Update application in database
        await prisma.application.update({
            where: { id: application.id },
            data: {
                matchScore: score,
                matchSummary: summary
            }
        });

        console.log(`  ✅ Match score: ${score.toFixed(1)}%`);
        console.log(`  📝 Summary: ${summary.substring(0, 80)}...`);
        return true;

    } catch (error) {
        console.error(`  ❌ Error:`, error.response?.data || error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('🚀 Starting AI Matching Process...\n');
        console.log('Fetching applications...');

        // Get all applications without match scores
        const applications = await prisma.application.findMany({
            where: {
                OR: [
                    { matchScore: null },
                    { matchSummary: null }
                ]
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        resumeText: true
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

        console.log(`Found ${applications.length} applications needing matching\n`);

        if (applications.length === 0) {
            console.log('✨ All applications are already matched!');
            return;
        }

        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const app of applications) {
            const result = await matchApplication(app);
            if (result === true) {
                successCount++;
            } else if (result === false) {
                skippedCount++;
            } else {
                failedCount++;
            }

            // Small delay to avoid overwhelming the AI service
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary:');
        console.log(`  Total applications: ${applications.length}`);
        console.log(`  ✅ Successfully matched: ${successCount}`);
        console.log(`  ⚠️  Skipped (missing data): ${skippedCount}`);
        console.log(`  ❌ Failed: ${failedCount}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
