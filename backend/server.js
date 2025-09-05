// server.js
// Entry point: loads environment, connects to DB, starts HTTP server.

const connectDB = require("./Database/db");
const app = require('./app');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB (logs and exits on failure)
connectDB();

// Start Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));