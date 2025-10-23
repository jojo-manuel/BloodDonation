// Automated script to update BloodBankDashboard.jsx with bookings feature
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'Pages', 'BloodBankDashboard.jsx');

console.log('📄 Reading BloodBankDashboard.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Change 1: Add bookings state
console.log('✏️  Change 1: Adding bookings state...');
content = content.replace(
  'const [donationRequests, setDonationRequests] = useState([]);',
  `const [donationRequests, setDonationRequests] = useState([]);
  const [bookings, setBookings] = useState([]); // Added for booking display`
);

// Change 2: Add fetchBookings function
console.log('✏️  Change 2: Adding fetchBookings function...');
const fetchBookingsFunc = `
  // Fetch bookings for blood bank
  const fetchBookings = async () => {
    try {
      const res = await api.get("/bloodbank/bookings");
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };
`;

content = content.replace(
  '  // Fetch donors\n  const fetchDonors = async () => {',
  fetchBookingsFunc + '\n  // Fetch donors\n  const fetchDonors = async () => {'
);

// Change 3: Update useEffect
console.log('✏️  Change 3: Updating useEffect for tab changes...');
content = content.replace(
  `  // Fetch donation requests and donors when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchDonationRequests();
    } else if (activeTab === 'donors') {
      fetchDonors();
    }
  }, [activeTab]);`,
  `  // Fetch donation requests, bookings, and donors when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchBookings(); // Fetch bookings for "Booked Slots" tab
    } else if (activeTab === 'donors') {
      fetchDonors();
    } else if (activeTab === 'received') {
      fetchDonationRequests(); // Fetch donation requests for "Received Requests" tab
    }
  }, [activeTab]);`
);

console.log('💾 Saving updated file...');
fs.writeFileSync(filePath, content);

console.log('✅ Update complete!');
console.log('');
console.log('⚠️  Note: The "users" tab display still needs manual update.');
console.log('   See UPDATE-BLOODBANK-BOOKINGS.md for the complete display code.');
console.log('   The tab will now fetch bookings, but needs UI update to display them properly.');

