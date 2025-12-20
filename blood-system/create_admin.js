const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/register';

const adminUser = {
    email: 'admin@blood.com',
    password: 'password123',
    name: 'Super Admin',
    role: 'admin', // Role required for sys-admin-frontend
    hospital_id: 'ADMIN_001'
};

async function createAdmin() {
    try {
        console.log(`Creating Admin: ${adminUser.email}...`);
        const response = await axios.post(API_URL, adminUser);
        console.log(`✅ Success! ID: ${response.data.user_id || 'Created'}`);
    } catch (error) {
        console.error(`❌ Failed to create admin:`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

createAdmin();
