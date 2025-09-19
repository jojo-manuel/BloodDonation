const http = require('http');

// Test the book-slot endpoint
async function testBookSlot() {
  const baseURL = 'http://localhost:5000/api';

  console.log('Testing /users/book-slot endpoint...\n');

  // Test 1: Missing requestId
  console.log('Test 1: Missing requestId');
  const postData1 = JSON.stringify({});

  const options1 = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/book-slot',
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
    // Test 2: Invalid requestId format
    console.log('\nTest 2: Invalid requestId format');
    const postData2 = JSON.stringify({ requestId: 'invalid-id' });

    const options2 = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/book-slot',
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

testBookSlot().catch(console.error);
