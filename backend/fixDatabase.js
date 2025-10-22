const mongoose = require('mongoose');

// Use the same connection string as the main application
const MONGO_URI = "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
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
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixDatabase();
