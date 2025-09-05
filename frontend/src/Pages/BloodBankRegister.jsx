// Pages/BloodBankRegister.jsx
// Blood bank registration form for authenticated bloodbank users; submits to /auth/bloodbank/register.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          <span className="text-xl">🩸</span>
        </div>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent dark:from-rose-300 dark:to-amber-200">Blood Donation</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">Connect. Donate. Save lives.</p>
        </div>
      </Link>
      <button
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm backdrop-blur-md transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        aria-label="Toggle dark mode"
      >
        <span className="h-4 w-4">{isDark ? "🌙" : "☀️"}</span>
        <span>{isDark ? "Dark" : "Light"} mode</span>
      </button>
    </nav>
  );
}

export default function BloodBankRegister() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    district: "",
    contactNumber: "",
    licenseNumber: "",
  });

  // Theme init
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const shouldDark = saved
      ? saved === "dark"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Submit blood bank profile linked to logged-in user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      await api.post('/auth/bloodbank/register', { userId, ...formData });
      alert('✅ Blood bank details saved');
    } catch (err) {
      alert('❌ Failed to save blood bank details');
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-amber-100 dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl dark:bg-rose-600/30" />
      <div className="pointer-events-none absolute top-32 -right-16 h-80 w-80 rounded-full bg-red-500/30 blur-3xl dark:bg-amber-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-pink-400/20 blur-3xl dark:bg-fuchsia-600/20" />

      <header className="relative z-10">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6">
        <section className="grid min-h-[calc(100vh-88px)] place-items-center overflow-y-auto py-8 md:py-12">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl">🏦 Blood Bank Registration</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">Register your blood bank to manage donations</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood bank name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="City Central Blood Bank"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">District</label>
                <input
                  type="text"
                  name="district"
                  placeholder="e.g., Bengaluru Urban"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.district}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Primary contact number"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address</label>
                <textarea
                  name="address"
                  placeholder="Enter the full address"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">License number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  placeholder="Official license / registration number"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] active:scale-[0.99]"
              >
                Register Blood Bank 🏦
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}