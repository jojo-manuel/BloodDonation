// One-time migration: backfill encryptedMrid for existing patients based on current mrid value
// Usage: node backend/scripts/backfillEncryptedMrid.js

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Patient = require('../Models/Patient');
const { encrypt, decrypt } = require('../utils/encryption');

async function run() {
  if (!process.env.ENCRYPTION_SECRET) {
    console.error('ENCRYPTION_SECRET is not set. Aborting.');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const cursor = Patient.find({}).cursor();
  let updated = 0;
  let skipped = 0;
  for await (const p of cursor) {
    try {
      // If encryptedMrid exists and decrypts, skip; otherwise, try to set from virtual mrid if present
      let mridPlain = '';
      if (p.encryptedMrid) {
        try {
          mridPlain = decrypt(p.encryptedMrid);
        } catch (_) {
          mridPlain = '';
        }
      }

      if (!mridPlain && p.mrid) {
        // Virtual getter provides decrypted MRID if present
        mridPlain = p.mrid;
      }

      if (!mridPlain) {
        skipped++;
        continue;
      }

      const normalized = mridPlain.toString().toUpperCase();
      const newEncrypted = encrypt(normalized);
      if (p.encryptedMrid !== newEncrypted) {
        p.encryptedMrid = newEncrypted;
        await p.save();
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Failed to update patient ${p._id}:`, err.message);
      skipped++;
    }
  }

  console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});



