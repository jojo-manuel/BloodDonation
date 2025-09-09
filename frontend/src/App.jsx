// App.jsx
// App routing structure. Wraps protected pages with RequireAuth.

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import DonorRegister from "./Pages/DonorRegister";
import UserRegister from "./Pages/UserRegister";
import BloodBankRegister from "./Pages/BloodBankRegister";
import BloodBankLogin from "./Pages/BloodBankLogin";
import BloodBankDashboard from "./Pages/BloodBankDashboard";
            <Route path="/bloodbank/dashboard" element={<RequireAuth><BloodBankDashboard /></RequireAuth>} />
import UserDashboard from "./Pages/UserDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import AuthCallback from "./Pages/AuthCallback";
import RequireAuth from "./components/RequireAuth";

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
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes: require access token */}
            <Route path="/donor-register" element={<RequireAuth><DonorRegister /></RequireAuth>} />
            <Route path="/user-register" element={<RequireAuth><UserRegister /></RequireAuth>} />
            <Route path="/bloodbank-register" element={<RequireAuth><BloodBankRegister /></RequireAuth>} />
            <Route path="/bloodbank-login" element={<BloodBankLogin />} />
            <Route path="/dashboard" element={<RequireAuth><UserDashboard /></RequireAuth>} />
            <Route path="/admin-dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
