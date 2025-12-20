const checkEligibility = (donor) => {
    const reasons = [];
    if (donor.age < 18 || donor.age > 65) reasons.push('Age must be between 18 and 65 years');
    if (donor.weight && donor.weight < 50) reasons.push('Weight must be at least 50 kg');
    if (donor.last_donation_date) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (new Date(donor.last_donation_date) > threeMonthsAgo) {
            const nextEligibleDate = new Date(donor.last_donation_date);
            nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
            reasons.push(`Must wait until ${nextEligibleDate.toLocaleDateString()}`);
        }
    }
    const disqualifyingConditions = ['HIV', 'AIDS', 'Hepatitis', 'Cancer', 'Heart Disease', 'Tuberculosis', 'Malaria'];
    if (donor.medical_conditions && donor.medical_conditions.length > 0) {
        const hasCond = donor.medical_conditions.some(c => disqualifyingConditions.some(dc => c.toLowerCase().includes(dc.toLowerCase())));
        if (hasCond) reasons.push('Medical condition prevents donation');
    }
    return { eligible: reasons.length === 0, reasons: reasons };
};

const validateEligibility = (req, res, next) => {
    const eligibilityCheck = checkEligibility(req.body);
    req.body.eligibility_status = eligibilityCheck.eligible;
    req.body.eligibility_notes = eligibilityCheck.reasons.join('; ');
    req.eligibilityInfo = eligibilityCheck;
    next();
};

module.exports = { checkEligibility, validateEligibility };
