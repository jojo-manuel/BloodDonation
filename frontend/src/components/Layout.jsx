import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import api from "../lib/api";

function Navbar({ onLogout }) {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // Only fetch user if there's a token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return; // No token, user is not logged in
      }
      
      try {
        const response = await api.get('/users/me');
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        // Silently handle 401 errors (user not logged in)
        if (error.response?.status !== 401) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.clear();
      window.location.href = "/login";
    }
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    // Navigate to user profile page
    window.location.href = "/user-profile";
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    // Navigate to user settings page
    window.location.href = "/user-settings";
    setShowDropdown(false);
  };

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
      <div className="flex items-center gap-4">
        {user ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/80 to-red-600/80 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg ring-1 ring-white/10 hover:ring-white/30 transition-all duration-300">
                <span className="text-white font-bold text-lg">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>
            {showDropdown && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl w-52 border border-white/20">
                <li className="mb-1">
                  <a
                    onClick={handleProfileClick}
                    className="justify-between rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">👤</span>
                      Profile
                    </span>
                    <span className="badge badge-primary badge-sm bg-rose-500/20 text-rose-200 border-rose-500/30">New</span>
                  </a>
                </li>
                <li className="mb-1">
                  <a
                    onClick={handleSettingsClick}
                    className="rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">⚙️</span>
                      Settings
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleLogout}
                    className="rounded-xl bg-white/5 hover:bg-red-500/20 transition-all duration-200 text-white hover:text-red-200"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🚪</span>
                      Logout
                    </span>
                  </a>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <div className="skeleton h-12 w-12 rounded-full bg-white/20 backdrop-blur-md"></div>
        )}
      </div>
    </nav>
  );
}

export default function Layout({ children }) {
  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-auto bg-gradient-to-br from-rose-50 via-red-50 to-amber-100 dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl dark:bg-rose-600/30" />
      <div className="pointer-events-none absolute top-32 -right-16 h-80 w-80 rounded-full bg-red-500/30 blur-3xl dark:bg-amber-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-pink-400/20 blur-3xl dark:bg-fuchsia-600/20" />

      <header className="relative z-10">
        <Navbar />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        {children}
      </main>

      <Footer />
    </div>
  );
}
