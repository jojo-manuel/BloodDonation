const axios = require('axios');

async function test() {
    try {
        console.log('Attempting to login to http://localhost:5001/api/auth/login ...');
        // Login to grab a token (using backend-login service)
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'redcross@gmail.com',
            password: 'password123',
            role: 'bloodbank'
        });

        const token = loginRes.data.data.accessToken;
        console.log('Logged in successfully.');
        // console.log('Token:', token);

        console.log('Fetching bookings from http://localhost:5004/api/bloodbank/bookings ...');
        // Fetch bookings from bloodbank service
        const bookingsRes = await axios.get('http://localhost:5004/api/bloodbank/bookings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const allData = bookingsRes.data.data;
        const bookings = allData.filter(b => !b.isDonationRequest);
        const donationRequests = allData.filter(b => b.isDonationRequest);

        console.log(`Total items fetched: ${allData.length}`);
        console.log(`- Standard Bookings: ${bookings.length}`);
        console.log(`- Donation Requests: ${donationRequests.length}`);

        if (donationRequests.length > 0) {
            console.log('\n--- Donation Request Samples ---');
            donationRequests.slice(0, 3).forEach(dr => {
                console.log(`ID: ${dr._id}`);
                console.log(`   Status: ${dr.status}`);
                console.log(`   Date: ${dr.date}`);
                console.log(`   Token: ${dr.tokenNumber}`);
                console.log(`   Patient: ${dr.patientName}`);
                console.log(`   HospitalID (on Patient): ${dr.hospital_id}`);
            });
        } else {
            console.log('\nNo Donation Requests found in the response.');
            // Check directly if there are ANY donation requests in DB via separate call if possible or relying on previous mongosh output
            // logic in route: 
            // status IN ['rescheduled', 'booked', 'accepted', 'pending']
            // scheduledDate EXISTS
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

test();
