const mongoose = require('mongoose');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Get the patients collection
    const db = mongoose.connection.db;
    if (!db) {
      console.log('⚠️  Database not connected yet');
      return;
    }
    
    const collection = db.collection('patients');
    
    // List current indexes
    const indexes = await collection.indexes();
    console.log('📋 Current patient indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Try to remove problematic indexes
    const problematicIndexes = ['encryptedMrid_1', 'encryptedMrid'];
    
    for (const indexName of problematicIndexes) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Removed problematic index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`ℹ️  Index ${indexName} not found (already removed)`);
        } else {
          console.log(`⚠️  Could not remove index ${indexName}: ${error.message}`);
        }
      }
    }
    
    // List indexes after cleanup
    const indexesAfter = await collection.indexes();
    console.log('📋 Patient indexes after cleanup:');
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

module.exports = initializeDatabase;
