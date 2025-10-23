// Test script for blood bank analytics
require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./Models/Patient');
const DonationRequest = require('./Models/DonationRequest');
const BloodBank = require('./Models/BloodBank');

async function testAnalytics() {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jojomanuelp2026:UsTh9Sc7Y2kO9L6t@cluster0.iqr2jjj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database\n');

    // Test 1: Patients per blood bank
    console.log('📊 TEST 1: Patients per Blood Bank');
    console.log('═'.repeat(60));
    
    const patientStats = await Patient.aggregate([
      {
        $match: { isDeleted: { $ne: true } }
      },
      {
        $group: {
          _id: "$bloodBankId",
          bloodBankName: { $first: "$bloodBankName" },
          totalPatients: { $sum: 1 },
          totalUnitsRequired: { $sum: "$unitsRequired" },
          bloodGroups: { $push: "$bloodGroup" }
        }
      },
      {
        $sort: { totalPatients: -1 }
      }
    ]);

    if (patientStats.length === 0) {
      console.log('⚠️  No patients found in database');
    } else {
      patientStats.forEach((stat, index) => {
        console.log(`\n${index + 1}. Blood Bank: ${stat.bloodBankName || 'Unknown'}`);
        console.log(`   Total Patients: ${stat.totalPatients}`);
        console.log(`   Total Units Required: ${stat.totalUnitsRequired}`);
        console.log(`   Avg Units/Patient: ${(stat.totalUnitsRequired / stat.totalPatients).toFixed(2)}`);
        
        // Blood group distribution
        const bloodGroupCount = {};
        stat.bloodGroups.forEach(bg => {
          bloodGroupCount[bg] = (bloodGroupCount[bg] || 0) + 1;
        });
        console.log(`   Blood Group Distribution:`, bloodGroupCount);
      });
    }

    // Test 2: Overall statistics
    console.log('\n\n📈 TEST 2: Overall Statistics');
    console.log('═'.repeat(60));
    
    const totalPatients = await Patient.countDocuments({ isDeleted: { $ne: true } });
    const totalBloodBanks = await BloodBank.countDocuments();
    const totalDonationRequests = await DonationRequest.countDocuments();
    
    console.log(`Total Blood Banks: ${totalBloodBanks}`);
    console.log(`Total Patients: ${totalPatients}`);
    console.log(`Total Donation Requests: ${totalDonationRequests}`);
    console.log(`Avg Patients per Blood Bank: ${(totalPatients / (totalBloodBanks || 1)).toFixed(2)}`);

    // Test 3: Blood group demand
    console.log('\n\n🩸 TEST 3: Blood Group Demand');
    console.log('═'.repeat(60));
    
    const bloodGroupDemand = await Patient.aggregate([
      {
        $match: { 
          isDeleted: { $ne: true },
          dateNeeded: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: "$bloodGroup",
          totalPatients: { $sum: 1 },
          totalUnitsNeeded: { $sum: "$unitsRequired" }
        }
      },
      {
        $sort: { totalUnitsNeeded: -1 }
      }
    ]);

    if (bloodGroupDemand.length === 0) {
      console.log('⚠️  No upcoming blood group demands');
    } else {
      bloodGroupDemand.forEach((demand, index) => {
        console.log(`\n${index + 1}. Blood Group: ${demand._id}`);
        console.log(`   Patients Needing: ${demand.totalPatients}`);
        console.log(`   Total Units Needed: ${demand.totalUnitsNeeded}`);
        console.log(`   Avg Units/Patient: ${(demand.totalUnitsNeeded / demand.totalPatients).toFixed(2)}`);
      });
    }

    // Test 4: Donation request statistics
    console.log('\n\n📋 TEST 4: Donation Request Statistics by Status');
    console.log('═'.repeat(60));
    
    const requestStats = await DonationRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    if (requestStats.length === 0) {
      console.log('⚠️  No donation requests found');
    } else {
      requestStats.forEach(stat => {
        console.log(`${stat._id}: ${stat.count}`);
      });
    }

    // Test 5: Top blood banks by activity
    console.log('\n\n🏆 TEST 5: Top 5 Blood Banks by Activity');
    console.log('═'.repeat(60));
    
    const topBloodBanks = await DonationRequest.aggregate([
      {
        $group: {
          _id: "$bloodBankId",
          bloodBankName: { $first: "$bloodBankName" },
          totalRequests: { $sum: 1 },
          completedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { totalRequests: -1 }
      },
      {
        $limit: 5
      }
    ]);

    if (topBloodBanks.length === 0) {
      console.log('⚠️  No blood bank activity found');
    } else {
      topBloodBanks.forEach((bb, index) => {
        const successRate = bb.totalRequests > 0 
          ? ((bb.completedRequests / bb.totalRequests) * 100).toFixed(1) 
          : 0;
        console.log(`\n${index + 1}. ${bb.bloodBankName || 'Unknown'}`);
        console.log(`   Total Requests: ${bb.totalRequests}`);
        console.log(`   Completed: ${bb.completedRequests}`);
        console.log(`   Success Rate: ${successRate}%`);
      });
    }

    console.log('\n\n✅ Analytics test completed!');
    console.log('\n💡 To access these via API:');
    console.log('   GET /api/bloodbank-analytics/patients-per-bloodbank (Admin)');
    console.log('   GET /api/bloodbank-analytics/my-statistics (Blood Bank)');
    console.log('   GET /api/bloodbank-analytics/donation-request-report (Admin)');
    console.log('   GET /api/bloodbank-analytics/blood-group-demand (Admin)');
    console.log('   GET /api/bloodbank-analytics/timeline-report (Admin)');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testAnalytics();

