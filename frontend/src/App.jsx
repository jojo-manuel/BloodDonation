// App.jsx
// App routing structure. Wraps protected pages with RequireAuth.

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import DonorRegister from "./Pages/DonorRegister";
import UserRegister from "./Pages/UserRegister";
import BloodBankRegister from "./Pages/BloodBankRegister";
import UserDashboard from "./Pages/UserDashboard";
import AuthCallback from "./Pages/AuthCallback";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <Router>
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
        <Route path="/dashboard" element={<RequireAuth><UserDashboard /></RequireAuth>} />
      </Routes>
    </Router>
  );
}

export default App;
