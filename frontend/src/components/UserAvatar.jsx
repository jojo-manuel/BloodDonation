import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function UserAvatar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        // User not logged in, that's okay
        console.log('User not logged in');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    navigate("/user-profile");
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    navigate("/user-settings");
    setShowDropdown(false);
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setShowDropdown(false);
  };

  if (!user) {
    return null; // Don't show avatar if user is not logged in
  }

  return (
    <div className="relative">
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/80 to-red-600/80 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg ring-1 ring-white/10 hover:ring-white/30 transition-all duration-300 cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="text-white font-bold text-lg">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </span>
      </div>

      {showDropdown && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-3 z-20 w-52 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-2">
              <button
                onClick={handleDashboardClick}
                className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white px-4 py-3 mb-1"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🏠</span>
                  Dashboard
                </span>
              </button>
              
              <button
                onClick={handleProfileClick}
                className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white px-4 py-3 mb-1"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">👤</span>
                  Profile
                  <span className="ml-auto badge badge-primary badge-sm bg-rose-500/20 text-rose-200 border-rose-500/30">New</span>
                </span>
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white px-4 py-3 mb-1"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">⚙️</span>
                  Settings
                </span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full text-left rounded-xl bg-white/5 hover:bg-red-500/20 transition-all duration-200 text-white hover:text-red-200 px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">🚪</span>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

