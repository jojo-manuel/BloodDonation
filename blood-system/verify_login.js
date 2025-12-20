const axios = require('axios');

const LOGIN_URL = 'http://localhost:3000/api/auth/login';

const users = [
    { email: 'donor@blood.com', password: 'password123' },
    { email: 'bloodbank@blood.com', password: 'password123' },
    { email: 'admin@blood.com', password: 'password123' }
];

async function verifyLogin() {
    for (const user of users) {
        try {
            console.log(`Logging in ${user.email}...`);
            const response = await axios.post(LOGIN_URL, user);
            console.log(`✅ Success! Token received.`);
        } catch (error) {
            console.error(`❌ Login failed for ${user.email}:`);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Message: ${error.response.data.message}`);
            } else {
                console.error(`   Error: ${error.message}`);
            }
        }
    }
}

verifyLogin();
