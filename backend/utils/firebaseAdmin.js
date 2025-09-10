const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../config/firebase-service-account.json'));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

module.exports = admin;
