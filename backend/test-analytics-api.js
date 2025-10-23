// Test blood bank analytics API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testAnalyticsAPI() {
  try {
    console.log('\n🔐 Step 1: Login as Admin');
    console.log('═'.repeat(60));
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log(`   Token: ${accessToken.substring(0, 30)}...`);

    // Set up axios with auth header
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Test 1: Patients per blood bank
    console.log('\n\n📊 Test 1: Patients Per Blood Bank');
    console.log('═'.repeat(60));
    try {
      const { data } = await api.get('/bloodbank-analytics/patients-per-bloodbank');
      console.log('✅ Success!');
      console.log('\nOverall Stats:');
      console.log(`   Total Blood Banks: ${data.data.overallStats.totalBloodBanks}`);
      console.log(`   Total Patients: ${data.data.overallStats.totalPatients}`);
      console.log(`   Total Units Required: ${data.data.overallStats.totalUnitsRequired}`);
      console.log(`   Avg Patients/Bank: ${data.data.overallStats.avgPatientsPerBloodBank}`);
      
      if (data.data.bloodBankStats.length > 0) {
        console.log('\nTop Blood Bank:');
        const top = data.data.bloodBankStats[0];
        console.log(`   Name: ${top.bloodBankName}`);
        console.log(`   Patients: ${top.statistics.totalPatients}`);
        console.log(`   Units: ${top.statistics.totalUnitsRequired}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Donation request report
    console.log('\n\n📋 Test 2: Donation Request Report');
    console.log('═'.repeat(60));
    try {
      const { data } = await api.get('/bloodbank-analytics/donation-request-report');
      console.log('✅ Success!');
      if (data.data.length > 0) {
        data.data.slice(0, 3).forEach((stat, i) => {
          console.log(`\n${i + 1}. ${stat.bloodBankName || 'Unknown'}`);
          console.log(`   Total Requests: ${stat.totalRequests}`);
          console.log(`   Pending: ${stat.pendingRequests}`);
          console.log(`   Completed: ${stat.completedRequests}`);
          console.log(`   Success Rate: ${stat.successRate}%`);
        });
      } else {
        console.log('⚠️  No donation requests found');
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Blood group demand
    console.log('\n\n🩸 Test 3: Blood Group Demand');
    console.log('═'.repeat(60));
    try {
      const { data } = await api.get('/bloodbank-analytics/blood-group-demand');
      console.log('✅ Success!');
      if (data.data.length > 0) {
        data.data.forEach((demand, i) => {
          console.log(`\n${i + 1}. Blood Group: ${demand.bloodGroup}`);
          console.log(`   Patients: ${demand.totalPatients}`);
          console.log(`   Units Needed: ${demand.totalUnitsNeeded}`);
          console.log(`   Blood Banks: ${demand.numberOfBloodBanks}`);
        });
      } else {
        console.log('⚠️  No upcoming blood group demands');
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 4: Timeline report
    console.log('\n\n📈 Test 4: Timeline Report (Last 6 Months)');
    console.log('═'.repeat(60));
    try {
      const { data } = await api.get('/bloodbank-analytics/timeline-report?months=6');
      console.log('✅ Success!');
      console.log(`\nPatient Timeline: ${data.data.patientTimeline.length} months`);
      console.log(`Request Timeline: ${data.data.requestTimeline.length} months`);
      
      if (data.data.patientTimeline.length > 0) {
        console.log('\nRecent Months:');
        data.data.patientTimeline.slice(-3).forEach(month => {
          console.log(`   ${month.month}: ${month.patients} patients, ${month.unitsRequired} units`);
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n\n✅ All tests completed!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Integrate these endpoints into your frontend');
    console.log('   2. Create dashboard visualizations');
    console.log('   3. Add export functionality (PDF/CSV)');
    console.log('   4. Set up automated reports');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
console.log('🧪 Blood Bank Analytics API Test');
console.log('═'.repeat(60));
console.log('Testing endpoints with admin authentication...\n');

testAnalyticsAPI();

