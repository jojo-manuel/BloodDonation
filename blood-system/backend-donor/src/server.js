const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-monolith';

// Connect to Database
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Donor Backend connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Start Server
app.listen(PORT, () => {
    console.log(`🩸 Donor Backend running on port ${PORT}`);
});
