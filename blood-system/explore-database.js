const { MongoClient } = require('mongodb');

async function exploreData() {
  const client = new MongoClient('mongodb://blood-db:27017/blood-monolith');
  
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log('🔍 EXPLORING DATABASE CONTENT');
    console.log('==============================\n');
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      
      console.log(`📁 Collection: ${collectionName} (${count} documents)`);
      
      if (count > 0) {
        // Get a sample document to see the structure
        const sample = await collection.findOne();
        console.log('   Sample document structure:');
        console.log('   Keys:', Object.keys(sample).join(', '));
        
        // Look for any field that might contain test data
        const testRelatedFields = Object.keys(sample).filter(key => 
          key.toLowerCase().includes('test') || 
          key.toLowerCase().includes('field') ||
          key.toLowerCase().includes('data') ||
          key.toLowerCase().includes('info')
        );
        
        if (testRelatedFields.length > 0) {
          console.log('   🔍 Potential test-related fields:', testRelatedFields.join(', '));
        }
        
        // Show some sample values for interesting fields
        const interestingFields = ['name', 'email', 'hospital_id', 'type', 'status', 'notes', 'description', 'donorName', 'patientName'];
        for (const field of interestingFields) {
          if (sample[field]) {
            console.log(`   ${field}: ${JSON.stringify(sample[field])}`);
          }
        }
        
        // Look for documents that might have "test" in their values
        const testValueQuery = {
          $or: [
            { name: { $regex: /test/i } },
            { email: { $regex: /test/i } },
            { hospital_id: { $regex: /test/i } },
            { donorName: { $regex: /test/i } },
            { patientName: { $regex: /test/i } },
            { notes: { $regex: /test/i } },
            { description: { $regex: /test/i } }
          ]
        };
        
        const testDocs = await collection.find(testValueQuery).limit(5).toArray();
        if (testDocs.length > 0) {
          console.log(`   ✅ Found ${testDocs.length} documents with "test" in values:`);
          testDocs.forEach((doc, index) => {
            console.log(`     Document ${index + 1}:`, JSON.stringify(doc, null, 2).substring(0, 200) + '...');
          });
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

exploreData();