const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodbank';
const OUTPUT_DIR = './test-field-data';

class TestFieldExtractor {
  constructor() {
    this.client = null;
    this.results = {
      collections: {},
      summary: {
        totalCollections: 0,
        collectionsWithTestField: 0,
        totalDocuments: 0,
        documentsWithTestField: 0
      }
    };
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB...');
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      console.log('✅ Connected to MongoDB');
      
      // Test connection
      await this.client.db().admin().ping();
      console.log('✅ Connection verified');
      
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async findTestFields() {
    console.log('\n🔍 Searching for "test" fields in all collections...');
    
    const db = this.client.db();
    const collections = await db.listCollections().toArray();
    
    console.log(`📁 Found ${collections.length} collections to analyze`);
    this.results.summary.totalCollections = collections.length;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n📊 Analyzing collection: ${collectionName}`);
      
      const collection = db.collection(collectionName);
      const totalDocs = await collection.countDocuments();
      console.log(`  📄 Total documents: ${totalDocs}`);
      
      this.results.summary.totalDocuments += totalDocs;
      
      // Initialize collection results
      this.results.collections[collectionName] = {
        totalDocuments: totalDocs,
        documentsWithTestField: 0,
        testFieldData: [],
        fieldVariations: new Set(),
        sampleDocuments: []
      };

      // Search for documents with "test" field (case-insensitive)
      const testFieldQueries = [
        { test: { $exists: true } },
        { Test: { $exists: true } },
        { TEST: { $exists: true } },
        { testField: { $exists: true } },
        { test_field: { $exists: true } },
        { testData: { $exists: true } },
        { test_data: { $exists: true } }
      ];

      let foundTestFields = false;

      for (const query of testFieldQueries) {
        const fieldName = Object.keys(query)[0];
        const docsWithTestField = await collection.find(query).toArray();
        
        if (docsWithTestField.length > 0) {
          foundTestFields = true;
          console.log(`  ✅ Found ${docsWithTestField.length} documents with "${fieldName}" field`);
          
          this.results.collections[collectionName].documentsWithTestField += docsWithTestField.length;
          this.results.collections[collectionName].fieldVariations.add(fieldName);
          
          // Extract test field data
          for (const doc of docsWithTestField) {
            const testValue = doc[fieldName];
            this.results.collections[collectionName].testFieldData.push({
              _id: doc._id,
              fieldName: fieldName,
              value: testValue,
              valueType: typeof testValue,
              document: doc
            });
          }
          
          // Keep sample documents (first 5)
          if (this.results.collections[collectionName].sampleDocuments.length < 5) {
            this.results.collections[collectionName].sampleDocuments.push(...docsWithTestField.slice(0, 5));
          }
        }
      }

      // Also search for any field containing "test" in the field name
      const pipeline = [
        { $limit: 100 }, // Limit for performance
        { $project: { 
          document: "$$ROOT",
          fields: { $objectToArray: "$$ROOT" }
        }},
        { $unwind: "$fields" },
        { $match: { 
          "fields.k": { $regex: /test/i }
        }},
        { $group: {
          _id: "$document._id",
          document: { $first: "$document" },
          testFields: { $push: "$fields" }
        }}
      ];

      try {
        const docsWithTestInFieldName = await collection.aggregate(pipeline).toArray();
        
        if (docsWithTestInFieldName.length > 0) {
          foundTestFields = true;
          console.log(`  ✅ Found ${docsWithTestInFieldName.length} documents with field names containing "test"`);
          
          for (const result of docsWithTestInFieldName) {
            for (const field of result.testFields) {
              this.results.collections[collectionName].fieldVariations.add(field.k);
              this.results.collections[collectionName].testFieldData.push({
                _id: result.document._id,
                fieldName: field.k,
                value: field.v,
                valueType: typeof field.v,
                document: result.document
              });
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Could not search field names in ${collectionName}: ${error.message}`);
      }

      // Convert Set to Array for JSON serialization
      this.results.collections[collectionName].fieldVariations = 
        Array.from(this.results.collections[collectionName].fieldVariations);

      if (foundTestFields) {
        this.results.summary.collectionsWithTestField++;
        this.results.summary.documentsWithTestField += this.results.collections[collectionName].documentsWithTestField;
        console.log(`  📊 Collection summary: ${this.results.collections[collectionName].documentsWithTestField} documents with test fields`);
      } else {
        console.log(`  ℹ️  No test fields found in ${collectionName}`);
      }
    }
  }

  async saveResults() {
    console.log('\n💾 Saving results...');
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save complete results
    const fullResultsFile = path.join(OUTPUT_DIR, `test-field-extraction-${timestamp}.json`);
    fs.writeFileSync(fullResultsFile, JSON.stringify(this.results, null, 2));
    console.log(`📄 Complete results saved to: ${fullResultsFile}`);

    // Save summary report
    const summaryFile = path.join(OUTPUT_DIR, `test-field-summary-${timestamp}.txt`);
    const summaryReport = this.generateSummaryReport();
    fs.writeFileSync(summaryFile, summaryReport);
    console.log(`📋 Summary report saved to: ${summaryFile}`);

    // Save CSV for easy analysis
    const csvFile = path.join(OUTPUT_DIR, `test-field-data-${timestamp}.csv`);
    const csvContent = this.generateCSV();
    fs.writeFileSync(csvFile, csvContent);
    console.log(`📊 CSV data saved to: ${csvFile}`);

    // Save individual collection files
    for (const [collectionName, data] of Object.entries(this.results.collections)) {
      if (data.testFieldData.length > 0) {
        const collectionFile = path.join(OUTPUT_DIR, `${collectionName}-test-data-${timestamp}.json`);
        fs.writeFileSync(collectionFile, JSON.stringify(data, null, 2));
        console.log(`📁 ${collectionName} data saved to: ${collectionFile}`);
      }
    }
  }

  generateSummaryReport() {
    const { summary, collections } = this.results;
    
    let report = `MongoDB Test Field Extraction Report
=====================================
Generated: ${new Date().toISOString()}

SUMMARY:
--------
Total Collections: ${summary.totalCollections}
Collections with Test Fields: ${summary.collectionsWithTestField}
Total Documents: ${summary.totalDocuments}
Documents with Test Fields: ${summary.documentsWithTestField}

COLLECTION DETAILS:
------------------
`;

    for (const [collectionName, data] of Object.entries(collections)) {
      if (data.testFieldData.length > 0) {
        report += `
${collectionName.toUpperCase()}:
  Total Documents: ${data.totalDocuments}
  Documents with Test Fields: ${data.documentsWithTestField}
  Field Variations Found: ${data.fieldVariations.join(', ')}
  
  Sample Test Field Values:
`;
        
        // Show first 10 test field values
        const sampleValues = data.testFieldData.slice(0, 10);
        for (const item of sampleValues) {
          const valuePreview = typeof item.value === 'string' && item.value.length > 50 
            ? item.value.substring(0, 50) + '...'
            : JSON.stringify(item.value);
          report += `    ${item.fieldName}: ${valuePreview} (${item.valueType})\n`;
        }
        
        if (data.testFieldData.length > 10) {
          report += `    ... and ${data.testFieldData.length - 10} more\n`;
        }
      }
    }

    return report;
  }

  generateCSV() {
    let csv = 'Collection,Document_ID,Field_Name,Value_Type,Value_Preview\n';
    
    for (const [collectionName, data] of Object.entries(this.results.collections)) {
      for (const item of data.testFieldData) {
        const valuePreview = typeof item.value === 'string' && item.value.length > 100
          ? item.value.substring(0, 100) + '...'
          : JSON.stringify(item.value).replace(/"/g, '""'); // Escape quotes for CSV
        
        csv += `"${collectionName}","${item._id}","${item.fieldName}","${item.valueType}","${valuePreview}"\n`;
      }
    }
    
    return csv;
  }

  async extract() {
    try {
      await this.connect();
      await this.findTestFields();
      await this.saveResults();
      
      console.log('\n📊 EXTRACTION SUMMARY:');
      console.log(`✅ Collections analyzed: ${this.results.summary.totalCollections}`);
      console.log(`✅ Collections with test fields: ${this.results.summary.collectionsWithTestField}`);
      console.log(`✅ Total documents: ${this.results.summary.totalDocuments}`);
      console.log(`✅ Documents with test fields: ${this.results.summary.documentsWithTestField}`);
      
      if (this.results.summary.documentsWithTestField > 0) {
        console.log('\n📁 Files created:');
        console.log(`  📄 Complete results: ${OUTPUT_DIR}/test-field-extraction-*.json`);
        console.log(`  📋 Summary report: ${OUTPUT_DIR}/test-field-summary-*.txt`);
        console.log(`  📊 CSV data: ${OUTPUT_DIR}/test-field-data-*.csv`);
        console.log(`  📁 Individual collection files: ${OUTPUT_DIR}/*-test-data-*.json`);
      } else {
        console.log('\n⚠️  No test fields found in any collection');
      }
      
    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  console.log('🔍 MongoDB Test Field Data Extractor');
  console.log('====================================\n');
  
  const extractor = new TestFieldExtractor();
  
  try {
    await extractor.extract();
    console.log('\n🎉 Extraction completed successfully!');
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TestFieldExtractor;