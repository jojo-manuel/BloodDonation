const axios = require('axios');

async function verifyDashboardAccess() {
    try {
        const GATEWAY_URL = 'http://localhost:3000/api';

        // 1. Login as Donor
        console.log('🔑 Logging in as Donor...');
        const loginRes = await axios.post(`${GATEWAY_URL}/auth/login`, {
            email: 'donor@blood.com',
            password: 'password123'
        });

        const { token, refreshToken, user } = loginRes.data.data;
        const username = user ? user.username : 'Unknown';
        console.log('✅ Login Successful. User:', user ? user.name : 'Unknown');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Add User Headers (Simulating Gateway logic if calling directly, but here we call Gateway)
        // Gateway should handle header injection from token, but wait... 
        // Our test script calls Gateway, so we just provide Bearer token. 
        // The Gateway's 'auth' middleware verifies token and sets req.user.
        // Then proxy middleware injects headers.

        // 3. Test Cities Available
        console.log('\nTesting /donors/cities/available...');
        try {
            const cityRes = await axios.get(`${GATEWAY_URL}/donors/cities/available`, { headers });
            console.log('✅ Cities Success:', cityRes.data.data);
        } catch (e) {
            console.error('❌ Cities Failed:', e.message);
        }

        // 4. Test Requests (My Requests)
        console.log('\nTesting /requests (My Requests)...');
        try {
            const reqRes = await axios.get(`${GATEWAY_URL}/requests`, { headers });
            console.log('✅ Requests Success. Count:', reqRes.data.data.pagination.total);
        } catch (e) {
            console.error('❌ Requests Failed:', e.message, e.response?.data);
        }

        // 5. Test Reviews Stub
        console.log('\nTesting /reviews/reviewable-bloodbanks...');
        try {
            const reviewRes = await axios.get(`${GATEWAY_URL}/reviews/reviewable-bloodbanks`, { headers });
            console.log('✅ Reviews Success:', reviewRes.data);
        } catch (e) {
            console.error('❌ Reviews Failed:', e.message);
        }

    } catch (error) {
        console.error('❌ Fatal Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

verifyDashboardAccess();
