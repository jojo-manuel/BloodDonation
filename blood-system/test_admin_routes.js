const http = require('http');

const loginPayload = JSON.stringify({
    email: "admin@blood.com",
    password: "password123"
});

function request(path, method, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function test() {
    console.log('Logging in...');
    const loginRes = await request('/api/auth/login', 'POST', {}, loginPayload);

    if (!loginRes.data.success) {
        console.error('Login failed:', loginRes.data);
        return;
    }

    const token = loginRes.data.data.token;
    console.log('Login successful. Token obtained.');
    const fs = require('fs');
    fs.writeFileSync('token.txt', token);
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const endpoints = [
        '/api/admin/users',
        '/api/admin/admins',
        '/api/admin/bloodbanks',
        '/api/admin/donors'
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTesting ${endpoint}...`);
        const res = await request(endpoint, 'GET', authHeaders);
        console.log(`Status: ${res.statusCode}`);
        if (res.data.success) {
            console.log(`Success! Count: ${res.data.data ? (Array.isArray(res.data.data) ? res.data.data.length : 'Object') : 'N/A'}`);
        } else {
            console.log('Failed:', res.data);
        }
    }
}

test();
