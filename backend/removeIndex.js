const { MongoClient } = require('mongodb');

async function removeEncryptedMridIndex() {
  let client;
  
  try {
    // Connect to MongoDB using the same URI as your app
    const uri = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    console.log('Connecting to MongoDB...');
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('patients');

    // List all indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Remove the encryptedMrid_1 index
    try {
      await collection.dropIndex('encryptedMrid_1');
      console.log('✅ Successfully removed encryptedMrid_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  encryptedMrid_1 index not found');
      } else {
        console.log('❌ Error removing encryptedMrid_1 index:', error.message);
      }
    }

    // Also try to remove any other encryptedMrid related indexes
    try {
      await collection.dropIndex({ encryptedMrid: 1 });
      console.log('✅ Successfully removed encryptedMrid index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  encryptedMrid index not found');
      } else {
        console.log('❌ Error removing encryptedMrid index:', error.message);
      }
    }

    // List indexes after removal
    console.log('\nIndexes after removal:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index removal completed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

removeEncryptedMridIndex();
