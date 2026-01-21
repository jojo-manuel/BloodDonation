const axios = require('axios');

async function test() {
    try {
        // Login to get token
        const loginRes = await axios.post('http://localhost:8002/api/auth/login', {
            email: 'redcross@gmail.com', // Assuming a bloodbank user
            password: 'password123',
            role: 'bloodbank'
        });

        const token = loginRes.data.data.accessToken;
        console.log('Logged in. Token:', token.substring(0, 20) + '...');

        // Fetch bookings
        const bookingsRes = await axios.get('http://localhost:8002/api/bloodbank/bookings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const bookings = bookingsRes.data.data;
        console.log(`Fetched ${bookings.length} bookings.`);

        const donationRequests = bookings.filter(b => b.isDonationRequest);
        console.log(`Found ${donationRequests.length} donation requests in bookings.`);

        donationRequests.forEach(dr => {
            console.log(`- ID: ${dr._id}, Status: ${dr.status}, Date: ${dr.date}, Token: ${dr.tokenNumber}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();
