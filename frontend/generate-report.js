const reporter = require('cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

const options = {
  theme: 'bootstrap',
  jsonFile: 'reports/cucumber-report.json',
  output: 'reports/cucumber-report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    'App Name': 'Blood Donation System',
    'Test Environment': 'Local Development',
    'Browser': 'Chrome Headless',
    'Platform': process.platform,
    'Executed': new Date().toLocaleString()
  }
};

try {
  reporter.generate(options);
  console.log('\n✅ HTML Report generated successfully!');
  console.log(`📄 Report location: ${path.join(reportsDir, 'cucumber-report.html')}`);
} catch (error) {
  console.error('❌ Error generating report:', error.message);
}

