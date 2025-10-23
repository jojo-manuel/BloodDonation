// routes/bloodBankAnalytics.js
// Blood bank analytics and reporting endpoints

const express = require("express");
const Patient = require("../Models/Patient");
const DonationRequest = require("../Models/DonationRequest");
const BloodBank = require("../Models/BloodBank");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/bloodbank-analytics/patients-per-bloodbank
 * @desc    Get patient count and statistics per blood bank
 * @access  Admin only
 */
router.get("/patients-per-bloodbank", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }

    // Aggregate patients by blood bank
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
          bloodGroups: { $push: "$bloodGroup" },
          avgUnitsPerPatient: { $avg: "$unitsRequired" }
        }
      },
      {
        $sort: { totalPatients: -1 }
      }
    ]);

    // Get blood bank details
    const bloodBankIds = patientStats.map(stat => stat._id);
    const bloodBanks = await BloodBank.find({ _id: { $in: bloodBankIds } })
      .select('name email phone address status');

    // Enrich stats with blood bank details
    const enrichedStats = patientStats.map(stat => {
      const bloodBank = bloodBanks.find(bb => bb._id.toString() === stat._id.toString());
      
      // Count blood groups
      const bloodGroupCount = {};
      stat.bloodGroups.forEach(bg => {
        bloodGroupCount[bg] = (bloodGroupCount[bg] || 0) + 1;
      });

      return {
        bloodBankId: stat._id,
        bloodBankName: stat.bloodBankName,
        bloodBankDetails: bloodBank ? {
          email: bloodBank.email,
          phone: bloodBank.phone,
          address: bloodBank.address,
          status: bloodBank.status
        } : null,
        statistics: {
          totalPatients: stat.totalPatients,
          totalUnitsRequired: stat.totalUnitsRequired,
          avgUnitsPerPatient: Math.round(stat.avgUnitsPerPatient * 100) / 100,
          bloodGroupDistribution: bloodGroupCount
        }
      };
    });

    // Overall statistics
    const overallStats = {
      totalBloodBanks: enrichedStats.length,
      totalPatients: enrichedStats.reduce((sum, stat) => sum + stat.statistics.totalPatients, 0),
      totalUnitsRequired: enrichedStats.reduce((sum, stat) => sum + stat.statistics.totalUnitsRequired, 0),
      avgPatientsPerBloodBank: enrichedStats.length > 0 
        ? Math.round((enrichedStats.reduce((sum, stat) => sum + stat.statistics.totalPatients, 0) / enrichedStats.length) * 100) / 100
        : 0
    };

    res.json({
      success: true,
      data: {
        overallStats,
        bloodBankStats: enrichedStats
      }
    });

  } catch (error) {
    console.error("Error generating blood bank report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error generating report", 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/bloodbank-analytics/my-statistics
 * @desc    Get statistics for logged-in blood bank
 * @access  Blood Bank only
 */
router.get("/my-statistics", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "bloodbank") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Blood banks only." 
      });
    }

    // Get blood bank details
    const bloodBank = await BloodBank.findOne({ userId: req.user._id });
    if (!bloodBank) {
      return res.status(404).json({ 
        success: false, 
        message: "Blood bank not found" 
      });
    }

    // Get patients for this blood bank
    const patients = await Patient.find({ 
      bloodBankId: bloodBank._id,
      isDeleted: { $ne: true }
    });

    // Get donation requests for this blood bank
    const donationRequests = await DonationRequest.find({ 
      bloodBankId: bloodBank._id 
    });

    // Calculate statistics
    const stats = {
      bloodBankInfo: {
        name: bloodBank.name,
        email: bloodBank.email,
        phone: bloodBank.phone,
        status: bloodBank.status
      },
      patientStats: {
        totalPatients: patients.length,
        totalUnitsRequired: patients.reduce((sum, p) => sum + p.unitsRequired, 0),
        avgUnitsPerPatient: patients.length > 0 
          ? Math.round((patients.reduce((sum, p) => sum + p.unitsRequired, 0) / patients.length) * 100) / 100
          : 0
      },
      bloodGroupDistribution: {},
      donationRequestStats: {
        total: donationRequests.length,
        pending: donationRequests.filter(r => r.status === 'pending').length,
        accepted: donationRequests.filter(r => r.status === 'accepted').length,
        rejected: donationRequests.filter(r => r.status === 'rejected').length,
        completed: donationRequests.filter(r => r.status === 'completed').length,
        booked: donationRequests.filter(r => r.status === 'booked').length
      },
      recentPatients: patients
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          bloodGroup: p.bloodGroup,
          unitsRequired: p.unitsRequired,
          dateNeeded: p.dateNeeded,
          createdAt: p.createdAt
        })),
      upcomingNeeds: patients
        .filter(p => new Date(p.dateNeeded) >= new Date())
        .sort((a, b) => a.dateNeeded - b.dateNeeded)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          bloodGroup: p.bloodGroup,
          unitsRequired: p.unitsRequired,
          dateNeeded: p.dateNeeded,
          daysUntilNeeded: Math.ceil((new Date(p.dateNeeded) - new Date()) / (1000 * 60 * 60 * 24))
        }))
    };

    // Calculate blood group distribution
    patients.forEach(p => {
      stats.bloodGroupDistribution[p.bloodGroup] = (stats.bloodGroupDistribution[p.bloodGroup] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching blood bank statistics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching statistics", 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/bloodbank-analytics/donation-request-report
 * @desc    Get donation request statistics by blood bank
 * @access  Admin only
 */
router.get("/donation-request-report", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }

    // Aggregate donation requests by blood bank
    const requestStats = await DonationRequest.aggregate([
      {
        $group: {
          _id: "$bloodBankId",
          bloodBankName: { $first: "$bloodBankName" },
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          acceptedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] }
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          bookedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { totalRequests: -1 }
      }
    ]);

    // Calculate success rate (completed / total)
    const enrichedStats = requestStats.map(stat => ({
      ...stat,
      successRate: stat.totalRequests > 0 
        ? Math.round((stat.completedRequests / stat.totalRequests) * 100) 
        : 0,
      pendingRate: stat.totalRequests > 0 
        ? Math.round((stat.pendingRequests / stat.totalRequests) * 100) 
        : 0
    }));

    res.json({
      success: true,
      data: enrichedStats
    });

  } catch (error) {
    console.error("Error generating donation request report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error generating report", 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/bloodbank-analytics/blood-group-demand
 * @desc    Get blood group demand analysis across all blood banks
 * @access  Admin only
 */
router.get("/blood-group-demand", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }

    // Aggregate blood group demand
    const demandStats = await Patient.aggregate([
      {
        $match: { 
          isDeleted: { $ne: true },
          dateNeeded: { $gte: new Date() } // Only upcoming needs
        }
      },
      {
        $group: {
          _id: "$bloodGroup",
          totalPatients: { $sum: 1 },
          totalUnitsNeeded: { $sum: "$unitsRequired" },
          bloodBanks: { $addToSet: "$bloodBankName" }
        }
      },
      {
        $sort: { totalUnitsNeeded: -1 }
      }
    ]);

    const enrichedDemand = demandStats.map(stat => ({
      bloodGroup: stat._id,
      totalPatients: stat.totalPatients,
      totalUnitsNeeded: stat.totalUnitsNeeded,
      numberOfBloodBanks: stat.bloodBanks.length,
      avgUnitsPerPatient: Math.round((stat.totalUnitsNeeded / stat.totalPatients) * 100) / 100
    }));

    res.json({
      success: true,
      data: enrichedDemand
    });

  } catch (error) {
    console.error("Error generating blood group demand report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error generating report", 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/bloodbank-analytics/timeline-report
 * @desc    Get patient and request trends over time
 * @access  Admin only
 */
router.get("/timeline-report", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }

    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Patients by month
    const patientTimeline = await Patient.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalUnits: { $sum: "$unitsRequired" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Donation requests by month
    const requestTimeline = await DonationRequest.aggregate([
      {
        $match: { 
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        patientTimeline: patientTimeline.map(p => ({
          month: `${p._id.year}-${String(p._id.month).padStart(2, '0')}`,
          patients: p.count,
          unitsRequired: p.totalUnits
        })),
        requestTimeline: requestTimeline.map(r => ({
          month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
          requests: r.count,
          completed: r.completed,
          successRate: r.count > 0 ? Math.round((r.completed / r.count) * 100) : 0
        }))
      }
    });

  } catch (error) {
    console.error("Error generating timeline report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error generating report", 
      error: error.message 
    });
  }
});

module.exports = router;

