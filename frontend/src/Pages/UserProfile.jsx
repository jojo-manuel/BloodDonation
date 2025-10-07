import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Error loading user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <Layout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
            <Link
              to="/user-dashboard"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={handleLogout}>
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            👤 User Profile
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            View and manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/80 to-red-600/80 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg ring-1 ring-white/10 mb-4">
                <span className="text-white font-bold text-2xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">{user?.bloodGroup || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-white/20">
            <Link
              to="/user-settings"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              <span className="mr-2">⚙️</span>
              Edit Profile
            </Link>
            <Link
              to="/user-dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              <span className="mr-2">←</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
