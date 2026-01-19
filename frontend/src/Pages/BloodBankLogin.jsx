import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import api from "../lib/api";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase";

function ProgressBar() {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-4">
      <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-pink-400 text-sm">
        ← Back to User Login
      </Link>
      <div className="flex gap-4 items-center">
        <span className="flex items-center gap-1 text-gray-400">
          <span className="bg-gray-400/20 rounded-full p-2"><span className="text-xl">🔐</span></span>
          User Login
        </span>
        <span className="h-1 w-8 bg-pink-400 rounded-full" />
        <span className="flex items-center gap-1 text-pink-400 font-bold">
          <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">🏥</span></span>
          Blood Bank Login
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-pink-400 font-bold">
          <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
          Hope Web
        </span>
        <UserAvatar />
      </div>
    </div>
  );
}

export default function BloodBankLogin() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: formData.username,
        password: formData.password,
      });
      if (res.data.success && res.data.data) {
        localStorage.setItem("accessToken", res.data.data.accessToken);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        localStorage.setItem("userId", res.data.data.user.id);
        localStorage.setItem("role", res.data.data.user.role);
        localStorage.setItem("username", res.data.data.user.username);
        if (res.data.data.user.isSuspended) localStorage.setItem('isSuspended', res.data.data.user.isSuspended);
        if (res.data.data.user.isBlocked) localStorage.setItem('isBlocked', res.data.data.user.isBlocked);
        if (res.data.data.user.warningMessage) localStorage.setItem('warningMessage', res.data.data.user.warningMessage);

        if (res.data.data.user.warningMessage) {
          alert(`Warning: ${res.data.data.user.warningMessage}`);
        }
        if (res.data.data.user.isSuspended) {
          alert('Your account is suspended. Some features may be restricted.');
        }

        // Redirect based on role and approval status
        if (res.data.data.user.role.toLowerCase() === "bloodbank") {
          try {
            const bloodBankRes = await api.get(`/bloodbank/details?userId=${res.data.data.user.id}`);
            if (bloodBankRes.data.success) {
              const status = bloodBankRes.data.data.status;
              if (status === 'approved') {
                const authParams = new URLSearchParams({
                  accessToken: res.data.data.accessToken,
                  refreshToken: res.data.data.refreshToken,
                  userId: res.data.data.user.id,
                  role: res.data.data.user.role,
                  username: res.data.data.user.username
                }).toString();
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (isLocalhost) {
                  window.location.href = `http://localhost:3003/auth/callback?${authParams}`;
                } else {
                  window.location.href = `${window.location.origin}/auth/callback?${authParams}`;
                }
              } else if (status === 'pending') {
                navigate("/bloodbank-pending-approval");
              } else if (status === 'rejected') {
                alert("Your blood bank registration has been rejected. Please contact admin.");
              } else {
                alert("Access denied. This login is for blood banks only.");
              }
            } else {
              navigate("/bloodbank-register");
            }
          } catch (bloodBankErr) {
            console.error("Failed to fetch blood bank details:", bloodBankErr);
            navigate("/bloodbank-register");
          }
        } else {
          alert("Access denied. This login is for blood banks only.");
        }
      } else {
        alert(res.data.message || "Login failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Send user info to backend for verification
      const res = await api.post("/auth/google-login", {
        email: user.email,
        uid: user.uid,
        displayName: user.displayName,
      });
      if (res.data.success && res.data.data) {
        localStorage.setItem("accessToken", res.data.data.accessToken);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        localStorage.setItem("userId", res.data.data.user.id);
        localStorage.setItem("role", res.data.data.user.role);
        localStorage.setItem("username", res.data.data.user.username);
        if (res.data.data.user.isSuspended) localStorage.setItem('isSuspended', res.data.data.user.isSuspended);
        if (res.data.data.user.isBlocked) localStorage.setItem('isBlocked', res.data.data.user.isBlocked);
        if (res.data.data.user.warningMessage) localStorage.setItem('warningMessage', res.data.data.user.warningMessage);

        if (res.data.data.user.warningMessage) {
          alert(`Warning: ${res.data.data.user.warningMessage}`);
        }
        if (res.data.data.user.isSuspended) {
          alert('Your account is suspended. Some features may be restricted.');
        }

        // Redirect based on role and approval status
        if (res.data.data.user.role.toLowerCase() === "bloodbank") {
          try {
            const bloodBankRes = await api.get(`/bloodbank/details?userId=${res.data.data.user.id}`);
            if (bloodBankRes.data.success) {
              const status = bloodBankRes.data.data.status;
              if (status === 'approved') {
                const authParams = new URLSearchParams({
                  accessToken: res.data.data.accessToken,
                  refreshToken: res.data.data.refreshToken,
                  userId: res.data.data.user.id,
                  role: res.data.data.user.role,
                  username: res.data.data.user.username
                }).toString();
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (isLocalhost) {
                  window.location.href = `http://localhost:3003/auth/callback?${authParams}`;
                } else {
                  window.location.href = `${window.location.origin}/auth/callback?${authParams}`;
                }
              } else if (status === 'pending') {
                navigate("/bloodbank-pending-approval");
              } else if (status === 'rejected') {
                alert("Your blood bank registration has been rejected. Please contact admin.");
              } else {
                alert("Access denied. This login is for blood banks only.");
              }
            } else {
              navigate("/bloodbank-register");
            }
          } catch (bloodBankErr) {
            console.error("Failed to fetch blood bank details:", bloodBankErr);
            navigate("/bloodbank-register");
          }
        } else {
          alert("Access denied. This login is for blood banks only.");
        }
      } else {
        alert(res.data.message || "Google login failed");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      {/* Progress Bar */}
      <ProgressBar />

      {/* Login Card */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-24 pt-4 md:px-6 md:pb-24 md:pt-8">
        <form onSubmit={handleLogin} className="w-full rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <span className="bg-pink-400/20 rounded-full p-4 text-4xl">🏥</span>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Blood Bank Login</h2>
            <p className="text-sm text-gray-300 md:text-base">Login to manage your blood bank operations</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                name="username"
                placeholder="Enter your email address"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "⏳ Processing..." : '🏥 Login to Blood Bank'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/10 text-gray-300">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-300">
              Don't have a blood bank account?{" "}
              <Link to="/bloodbank-register" className="text-pink-400 hover:text-pink-300 transition">
                Register here
              </Link>
            </p>
            <div className="mt-2">
              <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
