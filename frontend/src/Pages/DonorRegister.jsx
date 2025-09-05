// Pages/DonorRegister.jsx
// Donor profile form for authenticated users; submits to /donors/register.

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

export default function DonorRegister() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    contactNumber: "",
    emergencyContactNumber: "",
    houseName: "",
    houseAddress: "",
    localBody: "",
    city: "",
    district: "",
    pincode: "",
    workAddress: "",
    availability: "available",
    lastDonationDate: "",
    contactPreference: "phone",
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

  // Submit donor profile (requires JWT from registration/login)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        contactNumber: formData.contactNumber,
        emergencyContactNumber: formData.emergencyContactNumber,
        houseAddress: {
          houseName: formData.houseName,
          address: formData.houseAddress,
          localBody: formData.localBody,
          city: formData.city,
          district: formData.district,
          pincode: formData.pincode,
        },
        workAddress: formData.workAddress,
        availability: formData.availability === 'available',
        lastDonatedDate: formData.lastDonationDate || undefined,
        contactPreference: formData.contactPreference,
      };
      const res = await api.post('/donors/register', payload);
      if (res?.data?.success) alert('✅ Donor details saved');
      else alert('❌ ' + (res?.data?.message || 'Failed to save donor details'));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save donor details';
      alert('❌ ' + msg);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
  <div className="fixed inset-0 min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-amber-100 dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl dark:bg-rose-600/30" />
      <div className="pointer-events-none absolute top-32 -right-16 h-80 w-80 rounded-full bg-red-500/30 blur-3xl dark:bg-amber-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-pink-400/20 blur-3xl dark:bg-fuchsia-600/20" />

      <header className="relative z-10">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-4 md:px-6 md:pb-24 md:pt-8">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">🩸 Become a Blood Donor</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">Join our heroes saving lives every day</p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Gender</label>
              <select
                name="gender"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="" className="text-gray-800">Select Gender</option>
                <option value="Male" className="text-gray-800">Male</option>
                <option value="Female" className="text-gray-800">Female</option>
                <option value="Other" className="text-gray-800">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood group</label>
              <select
                name="bloodGroup"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
              >
                <option value="" className="text-gray-800">Select Blood Group</option>
                <option value="A+" className="text-gray-800">A+</option>
                <option value="A-" className="text-gray-800">A-</option>
                <option value="B+" className="text-gray-800">B+</option>
                <option value="B-" className="text-gray-800">B-</option>
                <option value="AB+" className="text-gray-800">AB+</option>
                <option value="AB-" className="text-gray-800">AB-</option>
                <option value="O+" className="text-gray-800">O+</option>
                <option value="O-" className="text-gray-800">O-</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                placeholder="10-digit number"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContactNumber"
                placeholder="10-digit number"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Name</label>
              <input
                type="text"
                name="houseName"
                placeholder="House Name"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.houseName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Address</label>
              <input
                type="text"
                name="houseAddress"
                placeholder="House Address"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.houseAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Local Body</label>
              <input
                type="text"
                name="localBody"
                placeholder="Local Body"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.localBody}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">City</label>
              <input
                type="text"
                name="city"
                placeholder="City"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline.none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg.white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">District</label>
              <input
                type="text"
                name="district"
                placeholder="District"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.district}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Pincode</label>
              <input
                type="text"
                name="pincode"
                placeholder="6-digit pincode"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.pincode}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Work Address</label>
              <input
                type="text"
                name="workAddress"
                placeholder="Work Address"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.workAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
              <select
                name="availability"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.availability}
                onChange={handleChange}
                required
              >
                <option value="available" className="text-gray-800">Available</option>
                <option value="unavailable" className="text-gray-800">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last donation date</label>
              <input
                type="date"
                name="lastDonationDate"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.lastDonationDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact preference</label>
              <select
                name="contactPreference"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.contactPreference}
                onChange={handleChange}
                required
              >
                <option value="phone" className="text-gray-800">Phone</option>
                <option value="email" className="text-gray-800">Email</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99]"
            >
              Save Donor Details 🩸
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">By registering, you agree to donate blood when needed and meet all health requirements.</p>
            <div className="mt-2">
              <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}