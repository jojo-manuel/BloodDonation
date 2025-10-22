// Migration script to remove encryption from patient data
// Run this once to migrate existing encrypted data to plain text
const mongoose = require('mongoose');
const Patient = require('../Models/Patient');
const { decrypt } = require('../utils/encryption');

async function migratePatientData() {
  try {
    console.log('Starting patient data migration...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blooddonation');

    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const patient of patients) {
      try {
        // Decrypt existing encrypted fields
        const name = patient.encryptedName ? decrypt(patient.encryptedName) : '';
        const address = patient.encryptedAddress ? decrypt(patient.encryptedAddress) : '';
        const mrid = patient.encryptedMrid ? decrypt(patient.encryptedMrid) : '';
        const phoneNumber = patient.encryptedPhoneNumber ? decrypt(patient.encryptedPhoneNumber) : '';

        // Update patient with plain text data
        await Patient.findByIdAndUpdate(patient._id, {
          name: name,
          address: address,
          mrid: mrid,
          phoneNumber: phoneNumber,
          bloodBankName: patient.bloodBankName || 'Unknown Blood Bank', // Add default if missing
          // Remove encrypted fields
          $unset: {
            encryptedName: 1,
            encryptedAddress: 1,
            encryptedMrid: 1,
            encryptedPhoneNumber: 1
          }
        });

        migrated++;
        if (migrated % 10 === 0) {
          console.log(`Migrated ${migrated} patients...`);
        }
      } catch (error) {
        console.error(`Error migrating patient ${patient._id}:`, error.message);
        errors++;
      }
    }

    console.log(`Migration completed: ${migrated} migrated, ${errors} errors`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePatientData();
}

module.exports = migratePatientData;
