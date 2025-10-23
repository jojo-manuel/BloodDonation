const http = require('http');

// Test the direct-book-slot endpoint
async function testDirectBookSlot() {
  const baseURL = 'http://localhost:5000/api';

  console.log('Testing /users/direct-book-slot endpoint...\n');

  // Test 1: Missing required fields
  console.log('Test 1: Missing required fields');
  const postData1 = JSON.stringify({});

  const options1 = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/direct-book-slot',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData1),
      'Authorization': 'Bearer test-token'
    }
  };

  const req1 = http.request(options1, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('✅ Status:', res.statusCode);
      try {
        const response = JSON.parse(data);
        console.log('   Response:', response.message);
      } catch (e) {
        console.log('   Raw response:', data);
      }
    });
  });

  req1.on('error', (e) => {
    console.log('❌ Request failed:', e.message);
  });

  req1.write(postData1);
  req1.end();

  // Wait a bit before next test
  setTimeout(() => {
    // Test 2: Invalid donorId
    console.log('\nTest 2: Invalid donorId');
    const postData2 = JSON.stringify({
      donorId: 'invalid-id',
      bloodBankId: 'some-bloodbank-id',
      requestedDate: '2024-01-01',
      requestedTime: '10:00 AM',
      donationRequestId: 'some-request-id'
    });

    const options2 = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/direct-book-slot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData2),
        'Authorization': 'Bearer test-token'
      }
    };

    const req2 = http.request(options2, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ Status:', res.statusCode);
        try {
          const response = JSON.parse(data);
          console.log('   Response:', response.message);
        } catch (e) {
          console.log('   Raw response:', data);
        }
      });
    });

    req2.on('error', (e) => {
      console.log('❌ Request failed:', e.message);
    });

    req2.write(postData2);
    req2.end();

    // Wait before finishing
    setTimeout(() => {
      console.log('\nBackend API tests completed.');
      console.log('Note: Full end-to-end testing requires authentication and test data.');
    }, 1000);
  }, 1000);
}

testDirectBookSlot().catch(console.error);
