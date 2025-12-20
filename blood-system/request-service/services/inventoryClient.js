const axios = require('axios');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory:3003';

/**
 * Check blood availability from inventory service
 */
const checkAvailability = async (hospital_id, blood_group) => {
    try {
        const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory/availability`, {
            params: { hospital_id, blood_group },
            headers: {
                'X-Hospital-Id': hospital_id
            }
        });

        return response.data;
    } catch (error) {
        console.error('Inventory service error:', error.message);
        throw new Error('Failed to check inventory availability');
    }
};

/**
 * Reserve blood units from inventory
 */
const reserveBloodUnits = async (hospital_id, unitId) => {
    try {
        const response = await axios.put(
            `${INVENTORY_SERVICE_URL}/inventory/${unitId}/reserve`,
            {},
            {
                headers: {
                    'X-Hospital-Id': hospital_id
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Reserve blood unit error:', error.message);
        throw new Error('Failed to reserve blood unit');
    }
};

/**
 * Get available blood units
 */
const getAvailableUnits = async (hospital_id, blood_group, quantity) => {
    try {
        const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory`, {
            params: {
                hospital_id,
                blood_group,
                status: 'available',
                limit: quantity
            },
            headers: {
                'X-Hospital-Id': hospital_id
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get available units error:', error.message);
        throw new Error('Failed to get available units');
    }
};

module.exports = {
    checkAvailability,
    reserveBloodUnits,
    getAvailableUnits
};
