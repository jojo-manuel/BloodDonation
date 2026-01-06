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
            <Route path="/dashboard" element={<RequireRole allowedRoles={['user', 'donor']}><UserDashboard /></RequireRole>} />
            <Route path="/user-dashboard" element={<RequireRole allowedRoles={['user', 'donor']}><UserDashboard /></RequireRole>} />
            <Route path="/user-profile" element={<RequireRole allowedRoles={['user', 'donor', 'admin', 'bloodbank']}><UserProfile /></RequireRole>} />
            <Route path="/user-settings" element={<RequireRole allowedRoles={['user', 'donor', 'admin', 'bloodbank']}><UserSettings /></RequireRole>} />

            {/* Admin Dashboard - Restricted to admins */}
            <Route path="/admin-dashboard" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />

            {/* Blood Bank Dashboard - Restricted to blood bank staff */}
            <Route path="/bloodbank/dashboard" element={<RequireRole allowedRoles={['bloodbank', 'frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff']}><BloodBankDashboard /></RequireRole>} />

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
