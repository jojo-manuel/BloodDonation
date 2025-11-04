const reporter = require('cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const options = {
  theme: 'bootstrap',
  jsonFile: 'reports/bloodbank-donor-management-report.json',
  output: 'reports/bloodbank-donor-management-report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: true,
  metadata: {
    'App Name': 'Blood Donation System',
    'Test Environment': 'Local Development',
    'Browser': 'Chrome',
    'Platform': process.platform,
    'Feature': 'Blood Bank Donor Management',
    'Executed': new Date().toLocaleString()
  },
  screenshots: {
    enabled: true,
    path: 'reports/screenshots'
  }
};

try {
  // Check if JSON file exists
  if (!fs.existsSync(options.jsonFile)) {
    console.log('⚠️  JSON report file not found. Running tests first...');
    console.log('Please run: npm run test:bdd:bloodbank-donor');
    process.exit(1);
  }

  reporter.generate(options);
  console.log('\n✅ HTML Report generated successfully!');
  console.log(`📄 Report location: ${path.join(reportsDir, 'bloodbank-donor-management-report.html')}`);
  console.log('\n📊 Opening report in browser...');
} catch (error) {
  console.error('❌ Error generating report:', error.message);
  process.exit(1);
}

