// App.jsx
// App routing structure. Wraps protected pages with RequireAuth.

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

import DonorRegister from "./Pages/DonorRegister";
import UserRegister from "./Pages/UserRegister";
import BloodBankRegister from "./Pages/BloodBankRegister";
import BloodBankAdminRegister from "./Pages/BloodBankAdminRegister";
import BloodBankLogin from "./Pages/BloodBankLogin";
import StaffLogin from "./Pages/StaffLogin";
import BloodBankDashboard from "./Pages/BloodBankDashboard";
import BloodBankManagerDashboard from "./Pages/BloodBankManagerDashboard";
import DoctorDashboard from "./Pages/DoctorDashboard";
import BleedingStaffDashboard from "./Pages/BleedingStaffDashboard";
import StoreManagerDashboard from "./Pages/StoreManagerDashboard";
import StoreStaffDashboard from "./Pages/StoreStaffDashboard";
import CentrifugeStaffDashboard from "./Pages/CentrifugeStaffDashboard";
import BloodBankPendingApproval from "./Pages/BloodBankPendingApproval";
import UserDashboard from "./Pages/UserDashboard";
import UserProfile from "./Pages/UserProfile";
import UserSettings from "./Pages/UserSettings";
import AdminDashboard from "./Pages/AdminDashboard";
import AuthCallback from "./Pages/AuthCallback";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import { cleanupAuthState } from "./utils/authCleanup";

function App() {
  // Clean up invalid auth state on app startup
  useEffect(() => {
    cleanupAuthState();

    // Port Enforcement Logic
    const currentPort = window.location.port;
    const currentHostname = window.location.hostname;
    const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

    // Only enforce if we have a role and are on localhost
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('accessToken');

    if (isLocalhost && role && token && !window.location.pathname.includes('/auth/callback')) {
      const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];

      if (role === 'bloodbank' || staffRoles.includes(role)) {
        if (currentPort !== '3003') {
          console.log('🔄 App: Wrong port for bloodbank staff. Redirecting to 3003.');
          window.location.href = `http://${currentHostname}:3003${window.location.pathname}`;
        }
      } else if (role === 'admin') {
        if (currentPort !== '3001') {
          console.log('🔄 App: Wrong port for admin. Redirecting to 3001.');
          window.location.href = `http://${currentHostname}:3001${window.location.pathname}`;
        }
      } else {
        // User/Donor should generally be on 3002, but 3000 is also acceptable for login/landing.
        // However, if they are logged in as user/donor, 3002 is the dedicated dashboard.
        // Let's enforce 3002 for dashboard access to keep things clean, or allow 3000 if it's just landing.
        // For now, let's redirect to 3002 if they are on 3000/3001/3003 and logged in.
        if (['3000', '3001', '3003'].includes(currentPort)) {
          console.log('🔄 App: Wrong port for user/donor. Redirecting to 3002.');
          window.location.href = `http://${currentHostname}:3002${window.location.pathname}`;
        }
      }
    }
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex justify-end">
          {/* ThemeToggle removed as per user request */}
        </header>
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes: require access token */}
            <Route path="/donor-register" element={<RequireAuth><DonorRegister /></RequireAuth>} />
            <Route path="/user-register" element={<RequireAuth><UserRegister /></RequireAuth>} />
            <Route path="/bloodbank-register" element={<BloodBankAdminRegister />} />
            <Route path="/bloodbank-admin-register" element={<BloodBankAdminRegister />} />

            {/* User/Donor Dashboard - Restricted to users and donors */}

            {/* User/Donor Dashboard - Restricted to users and donors */}
            <Route path="/dashboard" element={<RequireRole allowedRoles={['user', 'donor']}><UserDashboard /></RequireRole>} />
            <Route path="/user-dashboard" element={<RequireRole allowedRoles={['user', 'donor']}><UserDashboard /></RequireRole>} />
            {/* <Route path="/user-profile" element={<RequireRole allowedRoles={['user', 'donor', 'admin', 'bloodbank']}><UserProfile /></RequireRole>} /> */}
            <Route path="/user-settings" element={<RequireRole allowedRoles={['user', 'donor', 'admin', 'bloodbank']}><UserSettings /></RequireRole>} />

            {/* Admin Dashboard - Restricted to admins */}
            <Route path="/admin-dashboard" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />

            {/* Blood Bank Dashboard - Restricted to blood bank staff */}
            <Route path="/bloodbank/dashboard" element={<RequireRole allowedRoles={['bloodbank', 'BLOODBANK_ADMIN', 'store_manager']}><BloodBankDashboard /></RequireRole>} />

            {/* Blood Bank Manager Dashboard - Enhanced version for managers */}
            <Route path="/bloodbank/manager" element={<RequireRole allowedRoles={['bloodbank']}><BloodBankManagerDashboard /></RequireRole>} />

            {/* Dedicated Doctor Dashboard */}
            <Route path="/doctor-dashboard" element={<RequireRole allowedRoles={['doctor', 'bloodbank']}><DoctorDashboard /></RequireRole>} />

            {/* Dedicated Bleeding Staff Dashboard */}
            <Route path="/bloodbank/bleeding-staff" element={<RequireRole allowedRoles={['bleeding_staff', 'bloodbank']}><BleedingStaffDashboard /></RequireRole>} />

            {/* Dedicated Store Manager Dashboard */}
            <Route path="/bloodbank/store-manager" element={<RequireRole allowedRoles={['store_manager', 'bloodbank']}><StoreManagerDashboard /></RequireRole>} />

            {/* Dedicated Store Staff Dashboard */}
            <Route path="/bloodbank/store-staff" element={<RequireRole allowedRoles={['store_staff', 'bloodbank']}><StoreStaffDashboard /></RequireRole>} />

            {/* Dedicated Centrifuge Staff Dashboard */}
            <Route path="/bloodbank/centrifuge-staff" element={<RequireRole allowedRoles={['centrifuge_staff', 'bloodbank']}><CentrifugeStaffDashboard /></RequireRole>} />

            <Route path="/bloodbank-login" element={<BloodBankLogin />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/bloodbank-pending-approval" element={<BloodBankPendingApproval />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
