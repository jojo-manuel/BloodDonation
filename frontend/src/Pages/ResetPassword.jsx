// Pages/ResetPassword.jsx
// Reset a password using the token returned from the forgot-password endpoint (dev) or query string.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import api from '../lib/api';

function Navbar() {
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
      <UserAvatar />
    </nav>
  );
}

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");

    // Try to grab token from query string if present
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) setToken(t);
    } catch { /* no-op */ }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Token is required');
    if (!newPassword || newPassword.length < 6) return alert('Password must be at least 6 characters');
    if (newPassword !== confirm) return alert('Passwords do not match');
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      if (data?.success) {
        alert('Password reset successful. Please log in.');
        navigate('/login');
      } else {
        alert(data?.message || 'Failed to reset password');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reset password';
      alert(msg);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-amber-100 dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl dark:bg-rose-600/30" />
      <div className="pointer-events-none absolute top-32 -right-16 h-80 w-80 rounded-full bg-red-500/30 blur-3xl dark:bg-amber-500/20" />

      <header className="relative z-10">
        <Navbar />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-4 pb-16 pt-4 md:px-6 md:pb-24 md:pt-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">Reset password</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">Paste your token and set a new password</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Reset token</label>
              <input
                type="text"
                placeholder="paste token here"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">New password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Confirm new password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
            >
              Reset Password
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">← Back to Login</Link>
          </div>
        </form>
      </main