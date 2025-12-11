const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const EMAIL = 'admin@target-org.com';
const PASSWORD = 'Password123!';

async function testInterviewUpdate() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD,
        });

        const payload = JSON.parse(Buffer.from(loginRes.data.data.accessToken.split('.')[1], 'base64').toString());
        const token = loginRes.data.data.accessToken;
        const tenantId = payload.tenantId;
        console.log('Logged in. Tenant ID:', tenantId);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get interviews
        console.log('\nFetching interviews...');
        const interviewsRes = await axios.get(`${API_URL}/interviews`, { headers });
        const interviews = interviewsRes.data.data || interviewsRes.data;

        if (!interviews || interviews.length === 0) {
            console.error('No interviews found.');
            return;
        }

        const interview = interviews[0];
        console.log('Found interview:', {
            id: interview.id,
            currentStatus: interview.status,
            type: interview.type,
        });

        // 3. Try to update status
        console.log('\nAttempting to update interview status to COMPLETED...');
        try {
            const updateRes = await axios.patch(
                `${API_URL}/interviews/${interview.id}`,
                { status: 'COMPLETED' },
                { headers }
            );
            console.log('✓ Update successful!');
            console.log('Response:', JSON.stringify(updateRes.data, null, 2));
        } catch (err) {
            console.error('✗ Update failed:');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error(err.message);
            }
        }

    } catch (error) {
        console.error('Error in test script:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testInterviewUpdate();
