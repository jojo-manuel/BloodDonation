const http = require('http');

// Test function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Test cases
async function testPatientAccess() {
  console.log('🩸 Testing Patient Access Control\n');

  // Test 1: Public access to patient search (should work)
  console.log('Test 1: Public access to patient search endpoint');
  try {
    const response = await makeRequest('/api/patients/search/TEST123');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${JSON.stringify(response.body, null, 2)}\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  // Test 2: Authenticated access to patients list (should fail without proper auth)
  console.log('Test 2: Authenticated access to patients list (without auth)');
  try {
    const response = await makeRequest('/api/patients');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${JSON.stringify(response.body, null, 2)}\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  // Test 3: Access to patient by MRID (should fail without auth)
  console.log('Test 3: Access to patient by MRID (without auth)');
  try {
    const response = await makeRequest('/api/patients/mrid/TEST123');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${JSON.stringify(response.body, null, 2)}\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  // Test 4: Admin access to all patients (should fail without auth)
  console.log('Test 4: Admin access to all patients (without auth)');
  try {
    const response = await makeRequest('/api/patients/admin/all');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${JSON.stringify(response.body, null, 2)}\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  console.log('✅ Patient access testing completed');
}

// Run the tests
testPatientAccess().catch(console.error);
