// Pages/Register.jsx
// Single user registration (username derived from email). After register → dashboard.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

function ProgressBar() {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-4">
      <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-pink-400 text-sm">
        ← Back to Login
      </Link>
      <div className="flex gap-4 items-center">
        <span className="flex items-center gap-1 text-pink-400 font-bold">
          <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
          Account
        </span>
        <span className="h-1 w-8 bg-gray-400/30 rounded-full" />
        <span className="flex items-center gap-1 text-gray-400">
          <span className="bg-gray-400/20 rounded-full p-2"><span className="text-xl">🔐</span></span>
          Security
        </span>
      </div>
      <span className="flex items-center gap-2 text-pink-400 font-bold">
        <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
        Hope Web
      </span>
    </div>
  );
}

export default function Register() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldDark = saved ? saved === "dark" : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Only validate password for local registration
  const validate = () => {
    const e = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = "Enter a valid email";

    // Only validate password if submitting local registration
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const navigate = useNavigate();

  // Submit registration and handle response from backend (local only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Derive username from email local-part
      const emailLocal = (formData.email || '').split('@')[0] || 'user';
      let username = emailLocal
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (username.length < 3) username = (username + '123').slice(0, 3);

      const { data } = await api.post("/auth/register", {
        username,
        password: formData.password,
        email: formData.email,
        provider: "local",
      });

      if (data?.success && data?.data) {
        const { user, accessToken, refreshToken } = data.data;
        if (user?.id) localStorage.setItem("userId", user.id);
        if (user?.role) localStorage.setItem("role", user.role);
        if (user?.username) localStorage.setItem("username", user.username);
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        navigate("/dashboard");
      } else {
        alert("❌ " + (data?.message || "Registration failed"));
      }
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.message || "Network error";
      alert(`❌ ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <ProgressBar />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-24 pt-4 md:px-6 md:pb-24 md:pt-8">
        <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <span className="bg-pink-400/20 rounded-full p-4 text-4xl">❤️</span>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Create your account</h2>
            <p className="text-sm text-gray-300 md:text-base">Register using email + password or continue with Google</p>
          </div>

          <div className="mb-6 rounded-2xl bg-white/10 p-6 shadow-inner border border-pink-400/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-pink-400/20 rounded-full p-2 text-2xl">👤</span>
              <span className="text-lg font-bold text-white">Your details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="email" type="email" placeholder="Email" className="rounded-xl bg-white/20 px-4 py-2 text-gray-900 dark:text-white" value={formData.email} onChange={handleChange} />
              <input name="password" type="password" placeholder="Password" className="rounded-xl bg-white/20 px-4 py-2 text-gray-900 dark:text-white" value={formData.password} onChange={handleChange} />
              <input name="confirmPassword" type="password" placeholder="Confirm Password" className="rounded-xl bg-white/20 px-4 py-2 text-gray-900 dark:text-white" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                // No validation or POST for Google sign-in
                window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
              }}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-gray-500/30 active:scale-[0.99]"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>
      </main>
    </div>
  );
}
