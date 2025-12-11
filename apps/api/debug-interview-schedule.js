const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const EMAIL = 'admin@target-org.com';
const PASSWORD = 'Password123!';

async function debugInterviewSchedule() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD,
        });

        console.log('Login response:', JSON.stringify(loginRes.data, null, 2));

        // Handle both wrapped and unwrapped responses
        const loginData = loginRes.data.data || loginRes.data;
        const token = loginData.accessToken;

        // Decode JWT to get user info (simple base64 decode, no verification needed for debugging)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('JWT Payload:', payload);

        const tenantId = payload.tenantId;
        const userId = payload.sub;
        console.log('Logged in. Tenant ID:', tenantId);
        console.log('User ID:', userId);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get candidates with applications
        console.log('\nFetching candidates...');
        const candidatesRes = await axios.get(`${API_URL}/candidates`, { headers });
        console.log('Candidates response status:', candidatesRes.status);
        const candidates = candidatesRes.data.data?.candidates || candidatesRes.data.data || candidatesRes.data;

        if (!candidates || candidates.length === 0) {
            console.error('No candidates found.');
            return;
        }

        // Find a candidate with applications
        let applicationId = null;
        for (const candidate of candidates) {
            if (candidate.applications && candidate.applications.length > 0) {
                applicationId = candidate.applications[0].id;
                console.log('Found candidate with application:', candidate.firstName, candidate.lastName);
                console.log('Using Application ID:', applicationId);
                break;
            }
        }

        if (!applicationId) {
            console.error('No applications found for any candidate.');
            return;
        }

        // 3. Get an interviewer (current user)
        const interviewerId = userId;
        console.log('Using Interviewer ID:', interviewerId);

        // 4. Attempt to schedule interview
        const interviewPayload = {
            applicationId: applicationId,
            interviewerId: interviewerId,
            type: 'VIDEO',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            duration: 60,
            location: 'Zoom',
            meetingLink: 'https://zoom.us/j/123456789',
            notes: 'Debug interview',
        };

        console.log('\nSending interview payload:', interviewPayload);

        try {
            const scheduleRes = await axios.post(`${API_URL}/interviews`, interviewPayload, { headers });
            console.log('Interview scheduled successfully:', scheduleRes.data);
        } catch (err) {
            console.error('Failed to schedule interview:');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error(err.message);
            }
        }

    } catch (error) {
        console.error('Error in debug script:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

debugInterviewSchedule();
