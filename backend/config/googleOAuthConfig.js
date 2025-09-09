require('dotenv').config({ path: '../.env' });

const clientID = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";

module.exports = {
  clientID,
  clientSecret,
  callbackURL: `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`,
};
