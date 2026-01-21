const axios = require('axios');

async function testAuth() {
    try {
        console.log('Testing Login...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'bleeding@test.com',
            password: 'password123'
        });

        const token = loginRes.data.data.token || loginRes.data.data.accessToken;
        console.log('Login Success. Token prefix:', token.substring(0, 10));

        console.log('Testing Bloodbank Bookings...');
        try {
            const bookingRes = await axios.get('http://backend-bloodbank:3000/bloodbank/bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Bookings Success:', bookingRes.status);
        } catch (err) {
            console.log('Bookings Failed:', err.response?.status, err.response?.data);
        }

    } catch (err) {
        console.error('Login Failed:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

testAuth();
