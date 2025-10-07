const admin = require('firebase-admin');
const path = require('path');
const env = require('../config/env');

let serviceAccount;

if (
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_PRIVATE_KEY_ID &&
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_CLIENT_ID &&
  env.FIREBASE_CLIENT_X509_CERT_URL
) {
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
  serviceAccount = require('../config/firebase-service-account.json');
  serviceAccount.private_key = serviceAccount.private_key.trim();
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(path.join(__dirname, '../config/firebase-service-account.json')),
  });
}

module.exports = admin;
