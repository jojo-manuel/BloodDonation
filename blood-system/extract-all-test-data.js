const { MongoClient } = require('mongodb');
const fs = require('fs');

async function extractAllTestData() {
  const client = new MongoClient('mongodb://blood-db:27017/blood-monolith');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 EXTRACTING ALL TEST DATA FROM MONGODB');
    console.log('=========================================\n');
    
    const testData = {
      extractionDate: new Date().toISOString(),
      summary: {
        totalCollections: 0,
        collectionsWithTestData: 0,
        totalTestDocuments: 0
      },
      collections: {}
    };
    
    const collections = await db.listCollections().toArray();
    testData.summary.totalCollections = collections.length;
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`📁 Analyzing collection: ${collectionName}`);
      
      // Search for documents with "test" in various fields
      const testValueQuery = {
        $or: [
          { name: { $regex: /test/i } },
          { email: { $regex: /test/i } },
          { hospital_id: { $regex: /test/i } },
          { donorName: { $regex: /test/i } },
          { patientName: { $regex: /test/i } },
          { notes: { $regex: /test/i } },
          { description: { $regex: /test/i } },
          { serialNumber: { $regex: /test/i } },
          { bookingId: { $regex: /test/i } },
          { title: { $regex: /test/i } },
          { message: { $regex: /test/i } }
        ]
      };
      
      const testDocs = await collection.find(testValueQuery).toArray();
      
      if (testDocs.length > 0) {
        console.log(`   ✅ Found ${testDocs.length} test documents`);
        testData.summary.collectionsWithTestData++;
        testData.summary.totalTestDocuments += testDocs.length;
        
        testData.collections[collectionName] = {
          totalDocuments: await collection.countDocuments(),
          testDocuments: testDocs.length,
          documents: testDocs
        };
        
        // Show summary of what was found
        testDocs.forEach((doc, index) => {
          const testFields = [];
          Object.keys(doc).forEach(key => {
            if (doc[key] && typeof doc[key] === 'string' && doc[key].toLowerCase().includes('test')) {
              testFields.push(`${key}: "${doc[key]}"`);
            }
          });
          console.log(`     Document ${index + 1}: ${testFields.join(', ')}`);
        });
      } else {
        console.log(`   ℹ️  No test data found`);
      }
    }
    
    // Save results
    const outputDir = './test-field-data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save complete test data
    const fullDataFile = `${outputDir}/complete-test-data-${timestamp}.json`;
    fs.writeFileSync(fullDataFile, JSON.stringify(testData, null, 2));
    console.log(`\n📄 Complete test data saved to: ${fullDataFile}`);
    
    // Create summary report
    let report = `MongoDB Test Data Extraction Report
=====================================
Generated: ${testData.extractionDate}

SUMMARY:
--------
Total Collections: ${testData.summary.totalCollections}
Collections with Test Data: ${testData.summary.collectionsWithTestData}
Total Test Documents: ${testData.summary.totalTestDocuments}

DETAILED FINDINGS:
-----------------
`;

    for (const [collectionName, data] of Object.entries(testData.collections)) {
      report += `\n${collectionName.toUpperCase()}:\n`;
      report += `  Total Documents: ${data.totalDocuments}\n`;
      report += `  Test Documents: ${data.testDocuments}\n`;
      report += `  Test Data Found:\n`;
      
      data.documents.forEach((doc, index) => {
        report += `    Document ${index + 1} (ID: ${doc._id}):\n`;
        
        // Show all fields that contain "test"
        Object.keys(doc).forEach(key => {
          if (doc[key] && typeof doc[key] === 'string' && doc[key].toLowerCase().includes('test')) {
            report += `      ${key}: "${doc[key]}"\n`;
          }
        });
        
        // Show other important fields
        const importantFields = ['email', 'name', 'hospital_id', 'status', 'bloodGroup', 'role'];
        importantFields.forEach(field => {
          if (doc[field] && (!doc[field].toLowerCase || !doc[field].toLowerCase().includes('test'))) {
            report += `      ${field}: "${doc[field]}"\n`;
          }
        });
        report += '\n';
      });
    }
    
    const reportFile = `${outputDir}/test-data-report-${timestamp}.txt`;
    fs.writeFileSync(reportFile, report);
    console.log(`📋 Summary report saved to: ${reportFile}`);
    
    // Create CSV for easy analysis
    let csv = 'Collection,Document_ID,Field_Name,Field_Value,Document_Type\n';
    
    for (const [collectionName, data] of Object.entries(testData.collections)) {
      for (const doc of data.documents) {
        Object.keys(doc).forEach(key => {
          if (doc[key] && typeof doc[key] === 'string' && doc[key].toLowerCase().includes('test')) {
            const value = doc[key].replace(/"/g, '""'); // Escape quotes for CSV
            csv += `"${collectionName}","${doc._id}","${key}","${value}","test_data"\n`;
          }
        });
      }
    }
    
    const csvFile = `${outputDir}/test-data-${timestamp}.csv`;
    fs.writeFileSync(csvFile, csv);
    console.log(`📊 CSV data saved to: ${csvFile}`);
    
    console.log('\n📊 EXTRACTION SUMMARY:');
    console.log(`✅ Collections analyzed: ${testData.summary.totalCollections}`);
    console.log(`✅ Collections with test data: ${testData.summary.collectionsWithTestData}`);
    console.log(`✅ Total test documents found: ${testData.summary.totalTestDocuments}`);
    
    return testData;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

extractAllTestData();