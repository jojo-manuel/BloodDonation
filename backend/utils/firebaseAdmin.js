const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

let serviceAccount;
let firebaseInitialized = false;

// Try to load Firebase credentials from environment variables first
if (
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_PRIVATE_KEY_ID &&
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_CLIENT_ID &&
  env.FIREBASE_CLIENT_X509_CERT_URL
) {
  console.log('🔥 Loading Firebase credentials from environment variables');
  serviceAccount = {
    type: "service_account",
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
  };
} else {
  // Try to load from file (development only)
  const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔥 Loading Firebase credentials from file');
    serviceAccount = require('../config/firebase-service-account.json');
    serviceAccount.private_key = serviceAccount.private_key.trim();
  } else {
    console.warn('⚠️  Firebase service account not found. Firebase features will be disabled.');
    console.warn('   This is normal for production deployments without Firebase.');
  }
}

// Initialize Firebase Admin SDK only if credentials are available
if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.warn('⚠️  Firebase features will be disabled');
  }
}

// Export admin and initialization status
module.exports = admin;
module.exports.firebaseInitialized = firebaseInitialized;
