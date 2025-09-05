require('dotenv').config();

const clientID = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";

console.log('Google OAuth Config:', { clientID: clientID ? 'SET' : 'NOT SET', clientSecret: clientSecret ? 'SET' : 'NOT SET', baseUrl });

module.exports = {
  clientID,
  clientSecret,
  callbackURL: `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`,
};
