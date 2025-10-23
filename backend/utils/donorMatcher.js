/**
 * Smart Donor Matching Algorithm
 * Uses weighted scoring similar to KNN to find best matching donors
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate blood group compatibility score
 * Higher score = better compatibility
 */
function bloodGroupCompatibilityScore(requiredBloodGroup, donorBloodGroup) {
  // Exact match
  if (requiredBloodGroup === donorBloodGroup) {
    return 100;
  }
  
  // Universal donor
  if (donorBloodGroup === 'O-') {
    return 90;
  }
  
  // Compatibility matrix
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal receiver
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };
  
  if (compatibility[requiredBloodGroup]?.includes(donorBloodGroup)) {
    // Compatible but not exact match
    if (donorBloodGroup.endsWith('-')) {
      return 70; // Negative blood types are more valuable
    }
    return 60;
  }
  
  return 0; // Incompatible
}

/**
 * Calculate time since last donation score
 * Longer time since last donation = higher score (donor is more ready)
 */
function lastDonationScore(lastDonationDate) {
  if (!lastDonationDate) {
    return 100; // Never donated before
  }
  
  const daysSinceLastDonation = (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  
  // Minimum gap is 90 days (3 months)
  if (daysSinceLastDonation < 90) {
    return 0; // Not eligible
  }
  
  // Optimal is 120+ days (4 months)
  if (daysSinceLastDonation >= 120) {
    return 100;
  }
  
  // Linear scale between 90-120 days
  return ((daysSinceLastDonation - 90) / 30) * 100;
}

/**
 * Calculate proximity score based on distance
 * Closer distance = higher score
 */
function proximityScore(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 50; // Neutral score if distance unknown
  }
  
  // Within 5km = perfect score
  if (distanceKm <= 5) {
    return 100;
  }
  
  // Within 10km = good score
  if (distanceKm <= 10) {
    return 80;
  }
  
  // Within 25km = acceptable
  if (distanceKm <= 25) {
    return 60;
  }
  
  // Within 50km = far but possible
  if (distanceKm <= 50) {
    return 40;
  }
  
  // More than 50km = low score
  return Math.max(0, 40 - (distanceKm - 50) / 2);
}

/**
 * Calculate donor reliability score based on history
 */
function reliabilityScore(donor) {
  let score = 50; // Base score
  
  // Bonus for completed donations
  if (donor.completedDonations > 0) {
    score += Math.min(30, donor.completedDonations * 10);
  }
  
  // Bonus for being available
  if (donor.availability) {
    score += 10;
  }
  
  // Penalty for rejected bookings
  if (donor.rejectedBookings > 0) {
    score -= Math.min(20, donor.rejectedBookings * 5);
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Main KNN-inspired donor matching algorithm
 * Returns donors sorted by compatibility score
 * 
 * @param {Array} donors - Array of donor objects
 * @param {Object} searchCriteria - Search criteria
 * @param {string} searchCriteria.bloodGroup - Required blood group
 * @param {number} searchCriteria.latitude - Search location latitude
 * @param {number} searchCriteria.longitude - Search location longitude
 * @param {Object} weights - Scoring weights (optional)
 * @returns {Array} Sorted donors with scores
 */
function matchDonors(donors, searchCriteria, weights = null) {
  // Default weights (can be customized)
  const defaultWeights = {
    bloodGroup: 0.40,      // 40% - Most important
    proximity: 0.25,       // 25% - Very important
    lastDonation: 0.20,    // 20% - Important
    reliability: 0.15      // 15% - Moderately important
  };
  
  const w = weights || defaultWeights;
  
  // Calculate score for each donor
  const scoredDonors = donors.map(donor => {
    // Blood group compatibility
    const bgScore = bloodGroupCompatibilityScore(
      searchCriteria.bloodGroup,
      donor.bloodGroup
    );
    
    // Skip if incompatible
    if (bgScore === 0) {
      return { ...donor, totalScore: 0, scores: {} };
    }
    
    // Calculate distance if coordinates available
    let distance = null;
    let proxScore = 50; // Default neutral score
    
    if (searchCriteria.latitude && searchCriteria.longitude && 
        donor.location?.latitude && donor.location?.longitude) {
      distance = calculateDistance(
        searchCriteria.latitude,
        searchCriteria.longitude,
        donor.location.latitude,
        donor.location.longitude
      );
      proxScore = proximityScore(distance);
    } else if (searchCriteria.city && donor.houseAddress?.city) {
      // Same city bonus
      if (searchCriteria.city.toLowerCase() === donor.houseAddress.city.toLowerCase()) {
        proxScore = 75;
      }
    } else if (searchCriteria.pincode && donor.houseAddress?.pincode) {
      // Same pincode bonus
      if (searchCriteria.pincode === donor.houseAddress.pincode) {
        proxScore = 90;
      }
    }
    
    // Last donation score
    const ldScore = lastDonationScore(donor.lastDonationDate || donor.lastDonatedDate);
    
    // Reliability score
    const relScore = reliabilityScore(donor);
    
    // Calculate weighted total score
    const totalScore = (
      (bgScore * w.bloodGroup) +
      (proxScore * w.proximity) +
      (ldScore * w.lastDonation) +
      (relScore * w.reliability)
    );
    
    return {
      ...donor,
      totalScore: Math.round(totalScore * 100) / 100,
      distance: distance ? Math.round(distance * 10) / 10 : null,
      scores: {
        bloodGroup: Math.round(bgScore),
        proximity: Math.round(proxScore),
        lastDonation: Math.round(ldScore),
        reliability: Math.round(relScore)
      }
    };
  });
  
  // Filter out incompatible donors and sort by score
  return scoredDonors
    .filter(d => d.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Get K nearest (best matching) donors
 * @param {Array} donors - Array of donor objects
 * @param {Object} searchCriteria - Search criteria
 * @param {number} k - Number of donors to return
 * @returns {Array} Top K best matching donors
 */
function getKNearestDonors(donors, searchCriteria, k = 10) {
  const matched = matchDonors(donors, searchCriteria);
  return matched.slice(0, k);
}

module.exports = {
  matchDonors,
  getKNearestDonors,
  calculateDistance,
  bloodGroupCompatibilityScore,
  lastDonationScore,
  proximityScore,
  reliabilityScore
};

