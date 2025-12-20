/**
 * Middleware to check donor eligibility
 */
const checkEligibility = (donor) => {
    const reasons = [];

    // Age check (18-65)
    if (donor.age < 18 || donor.age > 65) {
        reasons.push('Age must be between 18 and 65 years');
    }

    // Weight check (minimum 50kg)
    if (donor.weight && donor.weight < 50) {
        reasons.push('Weight must be at least 50 kg');
    }

    // Last donation check (3 months gap)
    if (donor.last_donation_date) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (new Date(donor.last_donation_date) > threeMonthsAgo) {
            const nextEligibleDate = new Date(donor.last_donation_date);
            nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
            reasons.push(`Must wait until ${nextEligibleDate.toLocaleDateString()} (3 months since last donation)`);
        }
    }

    // Medical conditions check
    const disqualifyingConditions = [
        'HIV', 'AIDS', 'Hepatitis B', 'Hepatitis C',
        'Cancer', 'Heart Disease', 'Tuberculosis', 'Malaria'
    ];

    if (donor.medical_conditions && donor.medical_conditions.length > 0) {
        const hasDisqualifyingCondition = donor.medical_conditions.some(condition =>
            disqualifyingConditions.some(dc =>
                condition.toLowerCase().includes(dc.toLowerCase())
            )
        );

        if (hasDisqualifyingCondition) {
            reasons.push('Medical condition prevents donation');
        }
    }

    return {
        eligible: reasons.length === 0,
        reasons: reasons
    };
};

/**
 * Middleware to validate eligibility on donor creation/update
 */
const validateEligibility = (req, res, next) => {
    const donorData = req.body;

    const eligibilityCheck = checkEligibility(donorData);

    // Add eligibility status to request body
    req.body.eligibility_status = eligibilityCheck.eligible;
    req.body.eligibility_notes = eligibilityCheck.reasons.join('; ');

    // Attach eligibility info for response
    req.eligibilityInfo = eligibilityCheck;

    next();
};

module.exports = {
    checkEligibility,
    validateEligibility
};
