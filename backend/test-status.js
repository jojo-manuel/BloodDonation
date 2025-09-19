const mongoose = require('mongoose');
const DonationRequest = require('./Models/DonationRequest');

console.log('Valid statuses:', DonationRequest.schema.paths.status.enumValues);
console.log('Schema updated successfully!');
