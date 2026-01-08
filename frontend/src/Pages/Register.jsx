// src/Pages/Register.jsx
// Public registration page for regular users

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import api from "../lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  const validate = () => {
    const newErrors = {};
    const nameRegex = /^[A-Za-z]+$/;
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    else if (!nameRegex.test(formData.firstName)) newErrors.firstName = "First name must contain only letters without spaces or symbols";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (!nameRegex.test(formData.lastName)) newErrors.lastName = "Last name must contain only letters without spaces or symbols";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const response = await api.post("/auth/register", {
        name: fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: "user",
        provider: "local",
      });

      if (response.data.success) {
        // Auto-login removed as per request
        // const { user, token } = response.data.data;

        alert("✅ Registration successful! Please login to continue.");
        navigate('/login');
      } else {
        alert(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      {/* Progress Bar */}
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl">🩸</span>
          <span className="font-bold">Blood Donation</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-white text-sm">Step 1 of 2</div>
          <UserAvatar />
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-4">
        <div className="rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Create Your Account
            </h1>
            <p className="text-sm text-gray-300 md:text-base">
              Join our community of life savers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  className={`w-full rounded-2xl border px-4 py-3 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 ${errors.firstName ? "border-red-500 focus:ring-red-500" : "border-white/30 focus:ring-pink-400/60"
                    } bg-white/20 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300`}
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  className={`w-full rounded-2xl border px-4 py-3 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 ${errors.lastName ? "border-red-500 focus:ring-red-500" : "border-white/30 focus:ring-pink-400/60"
                    } bg-white/20 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300`}
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className={`w-full rounded-2xl border px-4 py-3 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-white/30 focus:ring-pink-400/60"
                    } bg-white/20 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border px-4 py-3 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-white/30 focus:ring-pink-400/60"
                    } bg-white/20 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300`}
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border px-4 py-3 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-white/30 focus:ring-pink-400/60"
                    } bg-white/20 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={8}
                  required
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "⏳ Creating Account..." : "📝 Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-300">
              Already have an account? {""}
              <Link to="/login" className="font-semibold text-pink-400 underline-offset-4 hover:underline dark:text-pink-300">
                Sign in here
              </Link>
            </p>
            <div className="pt-2">
              <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200 dark:text-gray-400 dark:hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
