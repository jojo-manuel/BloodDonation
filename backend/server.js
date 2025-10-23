// server.js
// Entry point: loads environment, connects to DB, starts HTTP server.

require('dotenv').config();
const connectDB = require("./Database/db");
const app = require('./app');

// Connect to MongoDB (logs and exits on failure)
connectDB();

// Start Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));