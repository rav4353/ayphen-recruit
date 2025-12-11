/**
 * Backfill Match Scores for Existing Applications
 * 
 * This script triggers AI matching for all applications that don't have a match score yet.
 * Run with: node backfill-match-scores.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TENANT_ID = process.env.TENANT_ID || 'd7b3e2a0-5c9f-4b1a-9d8e-3f2c1b0a6e5d';

async function login() {
    try {
        console.log('Logging in...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ayphen.com',
            password: 'Admin@123',
            tenantId: TENANT_ID
        });
        return response.data.data.accessToken;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getApplications(token) {
    try {
        console.log('Fetching applications...');
        const response = await axios.get(`${API_URL}/applications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch applications:', error.response?.data || error.message);
        throw error;
    }
}

async function triggerMatching(applicationId, token) {
    try {
        console.log(`Triggering match for application ${applicationId}...`);
        await axios.post(`${API_URL}/applications/${applicationId}/match`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✓ Match triggered for ${applicationId}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to match ${applicationId}:`, error.response?.data || error.message);
        return false;
    }
}

async function main() {
    try {
        const token = await login();
        const applications = await getApplications(token);

        console.log(`\nFound ${applications.length} applications`);

        const applicationsNeedingMatch = applications.filter(app =>
            app.matchScore === null || app.matchScore === undefined
        );

        console.log(`${applicationsNeedingMatch.length} applications need matching\n`);

        let successCount = 0;
        let failCount = 0;

        for (const app of applicationsNeedingMatch) {
            const success = await triggerMatching(app.id, token);
            if (success) successCount++;
            else failCount++;

            // Add a small delay to avoid overwhelming the AI service
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n=== Summary ===`);
        console.log(`Total applications: ${applications.length}`);
        console.log(`Already matched: ${applications.length - applicationsNeedingMatch.length}`);
        console.log(`Successfully matched: ${successCount}`);
        console.log(`Failed: ${failCount}`);
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
}

main();
