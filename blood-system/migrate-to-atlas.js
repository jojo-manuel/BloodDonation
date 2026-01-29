const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/bloodbank';
const ATLAS_MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority';

// Collections to migrate
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'patients', 
  'bookings',
  'bloodbags',
  'bloodcomponents',
  'bloodinventories',
  'activities',
  'basicregistrations',
  'bloodbanks',
  'bloodbanksectionusers',
  'conversations',
  'donationrequests',
  'donors',
  'donorsearches',
  'messages',
  'notifications',
  'reviews'
];

class DatabaseMigrator {
  constructor() {
    this.localClient = null;
    this.atlasClient = null;
    this.migrationStats = {
      collections: {},
      totalDocuments: 0,
      migratedDocuments: 0,
      errors: []
    };
  }

  async connect() {
    try {
      console.log('🔌 Connecting to local MongoDB...');
      this.localClient = new MongoClient(LOCAL_MONGODB_URI);
      await this.localClient.connect();
      console.log('✅ Connected to local MongoDB');

      console.log('🔌 Connecting to MongoDB Atlas...');
      this.atlasClient = new MongoClient(ATLAS_MONGODB_URI);
      await this.atlasClient.connect();
      console.log('✅ Connected to MongoDB Atlas');

      // Test connections
      await this.localClient.db().admin().ping();
      await this.atlasClient.db().admin().ping();
      console.log('✅ Both connections verified');

    } catch (error) {
      console.error('❌ Connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.localClient) {
      await this.localClient.close();
      console.log('🔌 Disconnected from local MongoDB');
    }
    if (this.atlasClient) {
      await this.atlasClient.close();
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  }

  async getCollectionStats() {
    console.log('\n📊 Analyzing local database...');
    const localDb = this.localClient.db();
    const collections = await localDb.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections in local database:`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await localDb.collection(collectionName).countDocuments();
      console.log(`  📁 ${collectionName}: ${count} documents`);
      
      this.migrationStats.collections[collectionName] = {
        local: count,
        migrated: 0,
        errors: 0
      };
      this.migrationStats.totalDocuments += count;
    }
    
    return collections.map(c => c.name);
  }

  async backupCollection(collectionName) {
    try {
      console.log(`\n💾 Backing up collection: ${collectionName}`);
      const localDb = this.localClient.db();
      const collection = localDb.collection(collectionName);
      
      const documents = await collection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`  ⚠️  Collection ${collectionName} is empty, skipping backup`);
        return;
      }

      // Create backup directory
      const backupDir = path.join(__dirname, 'migration-backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Save to JSON file
      const backupFile = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(documents, null, 2));
      
      console.log(`  ✅ Backed up ${documents.length} documents to ${backupFile}`);
      
    } catch (error) {
      console.error(`  ❌ Backup error for ${collectionName}:`, error.message);
      this.migrationStats.errors.push(`Backup ${collectionName}: ${error.message}`);
    }
  }

  async migrateCollection(collectionName) {
    try {
      console.log(`\n🚀 Migrating collection: ${collectionName}`);
      
      const localDb = this.localClient.db();
      const atlasDb = this.atlasClient.db();
      
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      // Get documents from local
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`  ⚠️  Collection ${collectionName} is empty, skipping migration`);
        return;
      }

      console.log(`  📤 Found ${documents.length} documents to migrate`);

      // Check if collection exists in Atlas and has data
      const atlasCount = await atlasCollection.countDocuments();
      if (atlasCount > 0) {
        console.log(`  ⚠️  Collection ${collectionName} already has ${atlasCount} documents in Atlas`);
        console.log(`  🔄 Clearing existing data before migration...`);
        await atlasCollection.deleteMany({});
      }

      // Insert documents in batches
      const batchSize = 100;
      let migratedCount = 0;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        try {
          await atlasCollection.insertMany(batch, { ordered: false });
          migratedCount += batch.length;
          console.log(`  📥 Migrated ${migratedCount}/${documents.length} documents`);
        } catch (error) {
          // Handle duplicate key errors and other issues
          console.log(`  ⚠️  Batch error (continuing): ${error.message}`);
          
          // Try inserting documents one by one for this batch
          for (const doc of batch) {
            try {
              await atlasCollection.insertOne(doc);
              migratedCount++;
            } catch (singleError) {
              console.log(`  ❌ Failed to insert document: ${singleError.message}`);
              this.migrationStats.collections[collectionName].errors++;
            }
          }
        }
      }

      this.migrationStats.collections[collectionName].migrated = migratedCount;
      this.migrationStats.migratedDocuments += migratedCount;

      // Verify migration
      const finalCount = await atlasCollection.countDocuments();
      console.log(`  ✅ Migration complete: ${finalCount} documents in Atlas`);

      if (finalCount !== documents.length) {
        console.log(`  ⚠️  Document count mismatch: Local(${documents.length}) vs Atlas(${finalCount})`);
      }

    } catch (error) {
      console.error(`  ❌ Migration error for ${collectionName}:`, error.message);
      this.migrationStats.errors.push(`Migration ${collectionName}: ${error.message}`);
    }
  }

  async createIndexes() {
    console.log('\n🔍 Creating indexes in Atlas...');
    
    const atlasDb = this.atlasClient.db();
    
    try {
      // Users collection indexes
      await atlasDb.collection('users').createIndex({ email: 1 }, { unique: true });
      await atlasDb.collection('users').createIndex({ username: 1 }, { unique: true });
      await atlasDb.collection('users').createIndex({ hospital_id: 1 });
      
      // Patients collection indexes
      await atlasDb.collection('patients').createIndex({ mrid: 1 }, { unique: true });
      await atlasDb.collection('patients').createIndex({ hospital_id: 1 });
      
      // Bookings collection indexes
      await atlasDb.collection('bookings').createIndex({ bookingId: 1 }, { unique: true });
      await atlasDb.collection('bookings').createIndex({ hospital_id: 1 });
      
      // Blood bags collection indexes
      await atlasDb.collection('bloodbags').createIndex({ serialNumber: 1 }, { unique: true });
      await atlasDb.collection('bloodbags').createIndex({ hospital_id: 1 });
      
      // Blood components collection indexes
      await atlasDb.collection('bloodcomponents').createIndex({ serialNumber: 1 }, { unique: true });
      await atlasDb.collection('bloodcomponents').createIndex({ hospital_id: 1 });
      await atlasDb.collection('bloodcomponents').createIndex({ originalBagId: 1 });
      
      console.log('✅ Indexes created successfully');
      
    } catch (error) {
      console.error('❌ Index creation error:', error.message);
      this.migrationStats.errors.push(`Index creation: ${error.message}`);
    }
  }

  async generateMigrationReport() {
    console.log('\n📋 Migration Report');
    console.log('==================');
    
    console.log(`Total Documents: ${this.migrationStats.totalDocuments}`);
    console.log(`Migrated Documents: ${this.migrationStats.migratedDocuments}`);
    console.log(`Success Rate: ${((this.migrationStats.migratedDocuments / this.migrationStats.totalDocuments) * 100).toFixed(2)}%`);
    
    console.log('\nCollection Details:');
    for (const [collection, stats] of Object.entries(this.migrationStats.collections)) {
      console.log(`  ${collection}: ${stats.migrated}/${stats.local} (${stats.errors} errors)`);
    }
    
    if (this.migrationStats.errors.length > 0) {
      console.log('\nErrors:');
      this.migrationStats.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
    
    // Save report to file
    const reportFile = path.join(__dirname, 'migration-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.migrationStats, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }

  async migrate() {
    try {
      await this.connect();
      
      // Get collections from local database
      const collections = await this.getCollectionStats();
      
      // Create backup
      console.log('\n💾 Creating backup of local data...');
      for (const collection of collections) {
        await this.backupCollection(collection);
      }
      
      // Migrate collections
      console.log('\n🚀 Starting migration to Atlas...');
      for (const collection of collections) {
        await this.migrateCollection(collection);
      }
      
      // Create indexes
      await this.createIndexes();
      
      // Generate report
      await this.generateMigrationReport();
      
      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  console.log('🗄️  MongoDB Atlas Migration Tool');
  console.log('================================\n');
  
  // Check if Atlas URI is provided
  if (!process.env.MONGODB_ATLAS_URI) {
    console.log('❌ Please set MONGODB_ATLAS_URI environment variable');
    console.log('Example: MONGODB_ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority"');
    process.exit(1);
  }
  
  const migrator = new DatabaseMigrator();
  
  try {
    await migrator.migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;