const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Selenium Test Suite...\n');
console.log('═'.repeat(70));
console.log('  Blood Donation System - End-to-End Testing');
console.log('═'.repeat(70));
console.log('');

const testFiles = [
  'tests/login.test.js',
  'tests/navigation.test.js',
  'tests/donor-flow.test.js',
  'tests/bloodbank-flow.test.js',
  'tests/admin-flow.test.js'
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  testDetails: []
};

const startTime = Date.now();

console.log(`📋 Test Files to Execute: ${testFiles.length}\n`);

testFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\n' + '─'.repeat(70) + '\n');

// Run all tests together
try {
  console.log('🧪 Executing all tests...\n');
  
  const output = execSync('npm run test:selenium -- --verbose', {
    cwd: __dirname,
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  // Parse results from output
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const totalMatch = output.match(/Tests:\s+(\d+)/);
  
  if (passMatch) results.passed = parseInt(passMatch[1]);
  if (failMatch) results.failed = parseInt(failMatch[1]);
  if (totalMatch) results.total = parseInt(totalMatch[1]);
  
  results.duration = Date.now() - startTime;
  
  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ TEST EXECUTION COMPLETED');
  console.log('═'.repeat(70));
  console.log(`\n📊 Results Summary:`);
  console.log(`   Total Tests: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏱️  Duration: ${(results.duration / 1000).toFixed(2)}s`);
  console.log(`   📈 Success Rate: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);
  console.log('');
  
} catch (error) {
  console.error('\n❌ Test execution encountered errors:');
  console.error(error.stdout || error.message);
  
  // Try to parse partial results
  const output = error.stdout || error.stderr || '';
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  
  if (passMatch) results.passed = parseInt(passMatch[1]);
  if (failMatch) results.failed = parseInt(failMatch[1]);
  results.total = results.passed + results.failed;
  results.duration = Date.now() - startTime;
  
  console.log('\n' + '═'.repeat(70));
  console.log('  ⚠️  TEST EXECUTION COMPLETED WITH ERRORS');
  console.log('═'.repeat(70));
  console.log(`\n📊 Partial Results:`);
  console.log(`   Total Tests: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏱️  Duration: ${(results.duration / 1000).toFixed(2)}s`);
  console.log('');
}

console.log('─'.repeat(70));
console.log('💾 Generating detailed report...');
console.log('📄 Report will be saved to: SELENIUM-TEST-REPORT-2025.md');
console.log('─'.repeat(70) + '\n');

// Save results for report generation
fs.writeFileSync(
  path.join(__dirname, 'test-results.json'),
  JSON.stringify(results, null, 2)
);

console.log('✅ Test execution complete!');
console.log('📊 Run report generation script to create detailed report.\n');

process.exit(results.failed > 0 ? 1 : 0);

