// Pincode API Integration
// Uses https://api.postalpincode.in/pincode/{pincode} to fetch location details

/**
 * Fetch location details from a pincode
 * @param {string} pincode - 6-digit Indian postal pincode
 * @returns {Promise<object>} - Location details including city, state, district
 */
export async function getLocationByPincode(pincode) {
    // Validate pincode format (6 digits)
    if (!pincode || !/^\d{6}$/.test(pincode)) {
        throw new Error('Invalid pincode. Please enter a valid 6-digit pincode.');
    }

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('No data received from pincode API');
        }

        const result = data[0];

        if (result.Status === 'Error') {
            throw new Error(result.Message || 'Invalid pincode');
        }

        if (result.Status !== 'Success' || !result.PostOffice || result.PostOffice.length === 0) {
            throw new Error('No location found for this pincode');
        }

        // Get the first post office details (most relevant)
        const postOffice = result.PostOffice[0];

        return {
            success: true,
            pincode: pincode,
            postOffice: postOffice.Name,
            area: postOffice.Name,
            city: postOffice.Block || postOffice.Name,
            district: postOffice.District,
            state: postOffice.State,
            country: postOffice.Country,
            region: postOffice.Region,
            division: postOffice.Division,
            branchType: postOffice.BranchType,
            deliveryStatus: postOffice.DeliveryStatus,
            // All post offices for this pincode
            allPostOffices: result.PostOffice.map(po => ({
                name: po.Name,
                branchType: po.BranchType,
                deliveryStatus: po.DeliveryStatus
            }))
        };
    } catch (error) {
        console.error('Pincode API Error:', error);
        throw error;
    }
}

/**
 * Format location string from pincode data
 * @param {object} locationData - Data returned from getLocationByPincode
 * @returns {string} - Formatted location string
 */
export function formatLocation(locationData) {
    if (!locationData || !locationData.success) {
        return '';
    }
    return `${locationData.area}, ${locationData.district}, ${locationData.state}`;
}

/**
 * Get all post offices for a pincode
 * @param {string} pincode - 6-digit Indian postal pincode
 * @returns {Promise<array>} - Array of post office names
 */
export async function getPostOfficesByPincode(pincode) {
    const locationData = await getLocationByPincode(pincode);
    return locationData.allPostOffices || [];
}

export default {
    getLocationByPincode,
    formatLocation,
    getPostOfficesByPincode
};
