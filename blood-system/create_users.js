const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/register';

const users = [
    {
        email: 'donor@blood.com',
        password: 'password123',
        name: 'Test Donor',
        role: 'DONOR',
        hospital_id: 'HOSP_001'
    },
    {
        email: 'bloodbank@blood.com',
        password: 'password123',
        name: 'Test Blood Bank',
        role: 'BLOODBANK_ADMIN',
        hospital_id: 'BB_001'
    }
];

async function createUsers() {
    for (const user of users) {
        try {
            console.log(`Creating ${user.role}: ${user.email}...`);
            const response = await axios.post(API_URL, user);
            console.log(`✅ Success! ID: ${response.data.user_id || 'Created'}`);
        } catch (error) {
            console.error(`❌ Failed to create ${user.email}:`);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Message: ${JSON.stringify(error.response.data)}`);
            } else {
                console.error(`   Error: ${error.message}`);
            }
        }
    }
}

createUsers();
