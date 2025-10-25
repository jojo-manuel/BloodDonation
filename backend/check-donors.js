// Check donors in database and their eligibility

require('dotenv').config();
const mongoose = require('mongoose');
const Donor = require('./Models/donor');
const User = require('./Models/User');

async function checkDonors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all donors with user info
    const donors = await Donor.find()
      .populate('userId', 'username name email')
      .lean();

    console.log(`📊 Total donors in database: ${donors.length}\n`);

    if (donors.length === 0) {
      console.log('❌ No donors found in database!');
      console.log('💡 You need to register donors first.');
      return;
    }

    // Calculate 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    console.log('🩸 Donors by Blood Group:\n');
    const bloodGroups = {};
    
    donors.forEach(donor => {
      const bg = donor.bloodGroup;
      if (!bloodGroups[bg]) bloodGroups[bg] = [];
      
      const eligible = !donor.lastDonatedDate || donor.lastDonatedDate < threeMonthsAgo;
      
      bloodGroups[bg].push({
        name: donor.userId?.name || donor.name || donor.userId?.username || 'Unknown',
        lastDonated: donor.lastDonatedDate ? donor.lastDonatedDate.toLocaleDateString() : 'Never',
        eligible: eligible ? '✅ Eligible' : '❌ Not Eligible Yet'
      });
    });

    // Display by blood group
    Object.keys(bloodGroups).sort().forEach(bg => {
      console.log(`\n${bg} (${bloodGroups[bg].length} donors):`);
      bloodGroups[bg].forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.name}`);
        console.log(`     Last Donated: ${d.lastDonated}`);
        console.log(`     Status: ${d.eligible}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n\nDisconnected from MongoDB');
  }
}

checkDonors();

