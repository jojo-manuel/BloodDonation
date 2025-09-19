// Pages/UserRegister.jsx
// General user registration form (non-donor, non-bloodbank). Currently standalone UI.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // quick length checks
  if (email.length > 320) return false; // 64 + 1 (@) + 255 = 320
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  if (local.length > 64 || domain.length > 255) return false;
  return EMAIL_REGEX.test(email);
}

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

export default function UserRegister() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    emergencyContact: "",
    bloodTypeNeeded: "",
    urgencyLevel: ""
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

  // Submit user registration to backend using axios instance
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation for email
    if (!isValidEmail(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Frontend validation for confirmPassword
    if (!formData.confirmPassword) {
      alert('Please enter confirm password');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Password and confirm password do not match');
      return;
    }

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const payload = {
        name: fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        bloodTypeNeeded: formData.bloodTypeNeeded,
        urgencyLevel: formData.urgencyLevel,
        role: 'user',
        provider: 'local',
      };

      console.log('Registration payload:', payload);

      const res = await api.post('/auth/register', payload);
      if (res.data.success) {
        alert('User registered successfully');
        window.location.href = '/login';
      } else {
        alert('Registration failed: ' + res.data.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      const details = err.response?.data?.details;
      if (details) {
        const detailMsgs = details.map(d => `${d.path}: ${d.message}`).join('\n');
        console.log('Registration error details:', details);
        alert('Error during registration: ' + errorMsg + '\n\nValidation Details:\n' + detailMsgs);
      } else {
        console.log('Registration error:', err.response?.data || err.message);
        alert('Error during registration: ' + errorMsg);
      }
    }
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'firstName' || e.target.name === 'lastName') {
      // Only allow letters a-z (lowercase and uppercase)
      value = value.replace(/[^a-zA-Z]/g, '');
      // Convert to sentence case: first letter capital, rest lower
      value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    setFormData({ ...formData, [e.target.name]: value });
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
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl">🏥 User Registration</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">Register to request blood when needed</p>
              <button type="button" onClick={() => window.location.href = '/api/auth/google'} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-fuchsia-600 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-fuchsia-500/30 active:scale-[0.99]">
                <span className="text-lg">🔗</span> Sign up with Google
              </button>
              <p className="mt-2 text-xs text-gray-500">Or use the form below</p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password (min 8 chars, uppercase, lowercase, number)"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Password must be at least 8 characters with uppercase, lowercase, and number</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Phone number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency contact</label>
              <input
                type="tel"
                name="emergencyContact"
                placeholder="Emergency contact number"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.emergencyContact}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood type needed (optional)</label>
              <select
                name="bloodTypeNeeded"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.bloodTypeNeeded}
                onChange={handleChange}
              >
                <option value="" className="text-gray-800">Select if known</option>
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
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Urgency level (optional)</label>
              <select
                name="urgencyLevel"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={formData.urgencyLevel}
                onChange={handleChange}
              >
                <option value="" className="text-gray-800">Select urgency</option>
                <option value="low" className="text-gray-800">Low - Future Planning</option>
                <option value="medium" className="text-gray-800">Medium - Within a Month</option>
                <option value="high" className="text-gray-800">High - Within a Week</option>
                <option value="critical" className="text-gray-800">Critical - Immediate</option>
              </select>
            </div>
          </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address</label>
                <textarea
                  name="address"
                  placeholder="Enter your complete address"
                  rows="3"
                  className="w-full resize-none rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-fuchsia-600 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-fuchsia-500/30 active:scale-[0.99]"
              >
                Register as User 🏥
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">Register to request blood donations when needed for yourself or family members.</p>
              <div className="mt-2">
                <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
