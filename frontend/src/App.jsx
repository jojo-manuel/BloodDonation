// App.jsx
// App routing structure. Wraps protected pages with RequireAuth.

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

import DonorRegister from "./Pages/DonorRegister";
import DonorCRUD from "./Pages/DonorCRUD";
import UserRegister from "./Pages/UserRegister";
import BloodBankRegister from "./Pages/BloodBankRegister";
import BloodBankLogin from "./Pages/BloodBankLogin";
import BloodBankDashboard from "./Pages/BloodBankDashboard";
import BloodBankPendingApproval from "./Pages/BloodBankPendingApproval";
import UserDashboard from "./Pages/UserDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import AuthCallback from "./Pages/AuthCallback";
import RequireAuth from "./components/RequireAuth";
import AdminRegister from "./Pages/AdminRegister";
import PatientRegister from "./Pages/PatientRegister";
import PatientCRUD from "./Pages/PatientCRUD";

import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <header className="p-4 bg-purple-800 text-white flex justify-end">
          <ThemeToggle />
        </header>
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/register" element={<AdminRegister />} />

            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/bloodbank-register" element={<BloodBankRegister />} />
            <Route path="/bloodbank-login" element={<BloodBankLogin />} />
            <Route path="/bloodbank-pending-approval" element={<BloodBankPendingApproval />} />

            {/* Protected routes: require access token */}
            <Route path="/donor-register" element={<RequireAuth><DonorRegister /></RequireAuth>} />
            <Route path="/donor-crud" element={<RequireAuth><DonorCRUD /></RequireAuth>} />
            <Route path="/patient-register" element={<RequireAuth><PatientRegister /></RequireAuth>} />
            <Route path="/patient-crud" element={<RequireAuth><PatientCRUD /></RequireAuth>} />
            <Route path="/user-register" element={<RequireAuth><UserRegister /></RequireAuth>} />
            <Route path="/bloodbank/dashboard" element={<RequireAuth><BloodBankDashboard /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><UserDashboard /></RequireAuth>} />
            <Route path="/admin-dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
