import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

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
      <span className="flex items-center gap-2 text-pink-400 font-bold">
        <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
        Hope Web
      </span>
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
          if (res.data.data.user.role === "bloodbank") {
            try {
              // Fetch blood bank details to check approval status
              const bloodBankRes = await api.get(`/bloodbank/details?userId=${res.data.data.user.id}`);
              if (bloodBankRes.data.success) {
                const status = bloodBankRes.data.data.status;
                if (status === 'approved') {
                  navigate("/bloodbank/dashboard");
                } else if (status === 'pending') {
                  navigate("/bloodbank-pending-approval");
                } else if (status === 'rejected') {
                  alert("Your blood bank registration has been rejected. Please contact admin.");
                } else {
                  alert("Access denied. This login is for blood banks only.");
                }
              } else {
                // Blood bank details not found, redirect to registration
                navigate("/bloodbank-register");
              }
            } catch (bloodBankErr) {
              console.error("Failed to fetch blood bank details:", bloodBankErr);
              // If blood bank details not found, redirect to registration
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
            <p className="text-sm text-gray-300 md:text-base">Sign in to manage your blood bank operations</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Username (Email)</label>
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
            >
              <span className="mr-2">🏥</span>
              {loading ? "Signing in..." : "Sign in to Blood Bank"}
            </button>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-300">
              Don't have a blood bank account? {""}
              <Link to="/bloodbank-register" className="font-semibold text-pink-400 underline-offset-4 hover:underline dark:text-pink-300">
                Register here
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/forgot-password" className="text-pink-400 underline-offset-4 hover:underline dark:text-pink-300">Forgot your password?</Link>
            </p>
            <div className="pt-2">
              <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200 dark:text-gray-400 dark:hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
