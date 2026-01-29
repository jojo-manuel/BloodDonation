const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://blood-db:27017/bloodbank';

async function debugSchema() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the BloodComponent collection
    const db = mongoose.connection.db;
    const collection = db.collection('bloodcomponents');

    // Check if collection exists and get some sample documents
    const count = await collection.countDocuments();
    console.log('BloodComponent collection document count:', count);

    if (count > 0) {
      const samples = await collection.find({}).limit(3).toArray();
      console.log('Sample documents:');
      samples.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, JSON.stringify(doc, null, 2));
      });
    }

    // Check collection indexes
    const indexes = await collection.indexes();
    console.log('Collection indexes:', indexes);

    // Try to create a simple BloodComponent using the model
    console.log('\nTesting BloodComponent model...');
    const BloodComponent = require('./src/models/BloodComponent');
    
    console.log('BloodComponent schema paths:');
    Object.keys(BloodComponent.schema.paths).forEach(path => {
      const schemaType = BloodComponent.schema.paths[path];
      console.log(`  ${path}: ${schemaType.instance} (required: ${schemaType.isRequired})`);
    });

    // Try to create a test component
    console.log('\nTrying to create a test component...');
    const testComponent = new BloodComponent({
      serialNumber: 'TEST-DEBUG-001',
      type: 'red_cells',
      bloodGroup: 'O+',
      volume: 100,
      originalBagId: new mongoose.Types.ObjectId(),
      originalBagSerial: 'TEST-BAG-001',
      separationDate: new Date(),
      separatedBy: new mongoose.Types.ObjectId(),
      separationMethod: 'centrifugation',
      hospital_id: 'Test Hospital',
      notes: 'Debug test component',
      createdBy: new mongoose.Types.ObjectId()
    });

    console.log('Test component created successfully');
    console.log('Test component data:', testComponent.toObject());

    // Try to validate without saving
    console.log('\nValidating test component...');
    const validationError = testComponent.validateSync();
    if (validationError) {
      console.log('Validation error:', validationError);
    } else {
      console.log('Validation passed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugSchema();