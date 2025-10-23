// Quick script to update MongoDB URI in .env file
// Usage: node update-mongo-uri.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 MongoDB URI Updater\n');
console.log('This script will help you update your .env file with new MongoDB credentials.\n');

rl.question('Enter your MongoDB username: ', (username) => {
  rl.question('Enter your MongoDB password: ', (password) => {
    
    // URL encode the password
    const encodedPassword = encodeURIComponent(password);
    
    const newMongoUri = `mongodb+srv://${username}:${encodedPassword}@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log('\n✅ Generated MongoDB URI (password is URL-encoded):');
    console.log(newMongoUri.replace(/:([^:@]+)@/, ':****@'));
    
    // Read .env file
    const envPath = path.join(__dirname, '.env');
    
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace MONGO_URI line
      const updatedContent = envContent.replace(
        /MONGO_URI=.*/,
        `MONGO_URI=${newMongoUri}`
      );
      
      // Write back to .env
      fs.writeFileSync(envPath, updatedContent, 'utf8');
      
      console.log('\n✅ .env file updated successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Test connection: node test-mongo-connection.js');
      console.log('   2. Start server: node server.js\n');
      
    } catch (error) {
      console.error('\n❌ Error updating .env file:', error.message);
      console.log('\n📝 Manual update required:');
      console.log('   Edit backend/.env and set:');
      console.log(`   MONGO_URI=${newMongoUri}\n`);
    }
    
    rl.close();
  });
});

