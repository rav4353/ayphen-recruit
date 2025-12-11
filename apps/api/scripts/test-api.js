const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
            email: 'ravanthsri20@gmail.com',
            password: 'Test@123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('Login successful');

        const listRes = await axios.get('http://localhost:3001/api/v1/settings/scorecards/all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Templates List Response Data:', JSON.stringify(listRes.data, null, 2));

    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

test();
