// server.js
// Entry point: loads environment, connects to DB, starts HTTP server.

require('dotenv').config();
const connectDB = require("./Database/db");
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Async function to start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Only start Express server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\n⚠️  Server not started due to database connection failure');
    process.exit(1);
  }
};

// Start the server
startServer();