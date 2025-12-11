/**
 * Parse Resume for Ravanth Raja and Trigger Matching
 * Run with: node parse-and-match-ravanth.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const CANDIDATE_ID = '073825df-c962-4a41-b167-3aabbf8b94be';
const RESUME_PATH = '/Users/ravanthrajas/Documents/ayphen recruit/apps/api/uploads/6839ea4b-1354-4cf9-918a-ee93050e52be.pdf';

async function parseResume() {
    console.log('📄 Parsing resume...');

    if (!fs.existsSync(RESUME_PATH)) {
        console.error(`❌ Resume file not found at: ${RESUME_PATH}`);
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(RESUME_PATH));

        const response = await axios.post(`${AI_SERVICE_URL}/parse-resume`, formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log('✅ Resume parsed successfully');
        return response.data;

    } catch (error) {
        console.error('❌ Failed to parse resume:', error.response?.data || error.message);
        return null;
    }
}

async function updateCandidate(parsedData) {
    console.log('\n💾 Updating candidate with parsed data...');

    try {
        await prisma.candidate.update({
            where: { id: CANDIDATE_ID },
            data: {
                resumeText: parsedData.text || parsedData.raw_text,
                summary: parsedData.summary || undefined,
                skills: parsedData.skills || [],
                experience: parsedData.experience ? JSON.parse(JSON.stringify(parsedData.experience)) : undefined,
                education: parsedData.education ? JSON.parse(JSON.stringify(parsedData.education)) : undefined,
            }
        });

        console.log('✅ Candidate updated');
        return true;

    } catch (error) {
        console.error('❌ Failed to update candidate:', error.message);
        return false;
    }
}

async function triggerMatching() {
    console.log('\n🤖 Triggering AI matching for applications...');

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

        console.log(`Found ${applications.length} applications\n`);

        let successCount = 0;

        for (const app of applications) {
            console.log(`  Processing: ${app.job.title}`);

            if (!app.candidate.resumeText || !app.job.description) {
                console.log(`    ⚠️  Missing data - skipping`);
                continue;
            }

            try {
                const response = await axios.post(`${AI_SERVICE_URL}/match`, {
                    resumeText: app.candidate.resumeText,
                    jobDescription: app.job.description
                });

                await prisma.application.update({
                    where: { id: app.id },
                    data: {
                        matchScore: response.data.score,
                        matchSummary: response.data.summary
                    }
                });

                console.log(`    ✅ Score: ${response.data.score.toFixed(1)}%`);
                successCount++;

            } catch (error) {
                console.error(`    ❌ Error:`, error.response?.data?.detail || error.message);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n✅ Successfully matched ${successCount}/${applications.length} applications`);

    } catch (error) {
        console.error('❌ Failed to trigger matching:', error.message);
    }
}

async function main() {
    try {
        console.log('🚀 Starting Resume Parse and Match for Ravanth Raja\n');

        // Step 1: Parse resume
        const parsedData = await parseResume();
        if (!parsedData) {
            console.error('\n❌ Cannot proceed without parsed resume data');
            process.exit(1);
        }

        // Step 2: Update candidate
        const updated = await updateCandidate(parsedData);
        if (!updated) {
            console.error('\n❌ Cannot proceed without updating candidate');
            process.exit(1);
        }

        // Step 3: Trigger matching
        await triggerMatching();

        console.log('\n✨ Complete! Refresh the candidate detail page to see the match scores.');

    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
