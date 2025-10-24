import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function UserProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/comprehensive');
      if (response.data.success) {
        setProfileData(response.data.data);
        // Initialize edit data
        setEditData({
          name: response.data.data.user.name || '',
          phone: response.data.data.user.phone || '',
          email: response.data.data.user.email || ''
        });
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await api.put('/users/me', {
        name: editData.name,
        phone: editData.phone
      });
      
      if (response.data.success) {
        alert('Profile updated successfully!');
        setEditMode(false);
        fetchUserProfile();
      } else {
        alert('Failed to update profile: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profileData?.isDonor) {
      alert('Only donors can toggle availability');
      return;
    }

    const newAvailability = !profileData.donorInfo.availability;
    
    try {
      setUpdatingAvailability(true);
      const response = await api.patch('/users/me/availability', {
        availability: newAvailability
      });
      
      if (response.data.success) {
        alert(`Availability updated to ${newAvailability ? 'Available' : 'Not Available'}`);
        fetchUserProfile();
      } else {
        alert('Failed to update availability: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? Your account will be deactivated and you will be logged out. You can contact support to restore it if needed."
    );

    if (!confirmed) return;

    try {
      const response = await api.delete('/users/me');
      if (response.data.success) {
        alert("Account deactivated successfully. You have been logged out.");
        localStorage.clear();
        navigate("/login");
      } else {
        alert("Failed to deactivate account: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert("Error deactivating account: " + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', icon: '⏳' },
      confirmed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200', icon: '✓' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: '❌' },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200', icon: '🚫' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading your profile...</p>
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
            <Link
              to="/user-dashboard"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const { user, isDonor, donorInfo, donations, patientsHelped, nextDonationDate, totalDonations } = profileData;

  return (
    <Layout onLogout={handleLogout}>
      {/* Glassmorphic background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      
      <div className="mx-auto w-full max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent dark:from-rose-400 dark:via-pink-400 dark:to-purple-400 md:text-5xl">
            👤 My Profile
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 font-medium">
            View and manage your account information and donation history
          </p>
        </div>

        {/* Profile Overview Section - Glassmorphic */}
        <div className="mb-8 rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl p-8 shadow-2xl transition-all hover:shadow-3xl hover:border-white/60 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-2xl ring-4 ring-white/50 backdrop-blur-sm dark:ring-white/20 mb-4 hover:scale-105 transition-transform">
                <span className="text-white font-bold text-5xl">
                  {user?.username ? user.username.charAt(0).toUpperCase() : user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              {isDonor && (
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-100/80 to-pink-100/80 backdrop-blur-md border border-red-300/50 dark:bg-red-900/30 dark:border-red-800 text-red-800 dark:text-red-200 rounded-full font-bold text-lg shadow-lg mb-3 hover:scale-105 transition-transform">
                  🩸 {donorInfo?.bloodGroup || 'N/A'}
                </div>
              )}

              {/* User Type Badge */}
              {isDonor ? (
                <div className="inline-flex items-center px-4 py-2 bg-green-100 border-2 border-green-300 dark:bg-green-900/30 dark:border-green-800 text-green-800 dark:text-green-200 rounded-full font-semibold shadow-lg">
                  ✅ User (Donor)
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 border-2 border-blue-300 dark:bg-blue-900/30 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-full font-semibold shadow-lg">
                  👤 User
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {user?.name || 'User'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">📧 Email</label>
                  <p className="text-gray-900 dark:text-white font-medium text-lg break-all">{user?.email || user?.username || 'Not provided'}</p>
                  </div>
                <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">📱 Phone</label>
                  <p className="text-gray-900 dark:text-white font-medium text-lg">{user?.phone || 'Not provided'}</p>
                  </div>
                <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">👤 Role</label>
                  <p className="text-gray-900 dark:text-white font-medium text-lg capitalize">{user?.role || 'User'}</p>
                </div>
                <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">📅 Member Since</label>
                  <p className="text-gray-900 dark:text-white font-medium text-lg">{formatDate(user?.createdAt)}</p>
            </div>
          </div>

          {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span className="mr-2">{editMode ? '❌' : '✏️'}</span>
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>

                {isDonor && (
                  <button
                    onClick={handleToggleAvailability}
                    disabled={updatingAvailability}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${
                      donorInfo?.availability 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    } ${updatingAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="mr-2">{donorInfo?.availability ? '✅' : '⏸️'}</span>
                    {updatingAvailability ? 'Updating...' : (donorInfo?.availability ? 'Available' : 'Not Available')}
                  </button>
                )}

                <Link
                  to="/user-dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span className="mr-2">←</span>
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {editMode && (
          <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">✏️ Edit Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
                <button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {updating ? 'Updating...' : '💾 Save Changes'}
                </button>
            </div>
          </div>
        )}

        {/* Donor Statistics (Only for Donors) */}
        {isDonor && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Donation Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-500/20 dark:to-pink-500/20 dark:border-white/30 p-6 shadow-lg hover:shadow-2xl transition-all">
                <div className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">{totalDonations}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">Total Donations</div>
              </div>
              
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-white/30 p-6 shadow-lg hover:shadow-2xl transition-all">
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{patientsHelped.length}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">Patients Helped</div>
              </div>
              
              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/20 dark:to-indigo-500/20 dark:border-white/30 p-6 shadow-lg hover:shadow-2xl transition-all">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {donorInfo?.lastDonatedDate ? formatDate(donorInfo.lastDonatedDate) : 'Never'}
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">Last Donation</div>
              </div>
              
              <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/20 dark:border-white/30 p-6 shadow-lg hover:shadow-2xl transition-all">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {nextDonationDate ? formatDate(nextDonationDate) : 'Ready'}
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">Next Eligible Date</div>
              </div>
            </div>

            {/* Next Donation Info */}
            {nextDonationDate && (
              <div className="mt-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  ℹ️ You can donate again after <strong>{formatDate(nextDonationDate)}</strong> (3 months after your last donation)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Donation History (Only for Donors) */}
        {isDonor && donations.length > 0 && (
          <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🩸 Donation History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Booking ID</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Blood Bank</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-800 dark:text-gray-300">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation, index) => (
                    <tr key={donation.id} className={`border-b border-gray-200 dark:border-gray-800 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/20' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors`}>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{donation.bookingId || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(donation.date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{donation.bloodBankName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {donation.patientName || 'N/A'}
                        {donation.patientMRID && (
                          <div className="text-xs text-gray-500">MRID: {donation.patientMRID}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(donation.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {donation.completedAt ? formatDateTime(donation.completedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patients Helped (Only for Donors) */}
        {isDonor && patientsHelped.length > 0 && (
          <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💝 Patients You Helped</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientsHelped.map((patient, index) => (
                <div key={index} className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-500/10 dark:to-purple-500/10 rounded-xl p-5 border-2 border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl transition-all">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{patient.patientName}</h4>
                  {patient.patientMRID && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>MRID:</strong> {patient.patientMRID}
                    </p>
                  )}
                  {patient.bloodGroup && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Blood Group:</strong> {patient.bloodGroup}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Donation Date:</strong> {formatDate(patient.donationDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Donation History Message */}
        {isDonor && donations.length === 0 && (
          <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl transition dark:border-white/10 dark:bg-white/5 text-center">
            <div className="text-6xl mb-4">🩸</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Donation History Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't completed any donations yet. Start saving lives today!
            </p>
            <Link
              to="/user-dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Find Donation Opportunities
            </Link>
          </div>
        )}

        {/* Donor Info Card (Only for Donors) */}
        {isDonor && donorInfo && (
          <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🩸 Donor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Blood Group</label>
                <p className="text-gray-900 dark:text-white font-bold text-2xl">{donorInfo.bloodGroup}</p>
              </div>
              <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Weight</label>
                <p className="text-gray-900 dark:text-white font-medium text-lg">{donorInfo.weight} kg</p>
              </div>
              <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Contact Number</label>
                <p className="text-gray-900 dark:text-white font-medium text-lg">{donorInfo.contactNumber}</p>
              </div>
              <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Priority Points</label>
                <p className="text-gray-900 dark:text-white font-medium text-lg">{donorInfo.priorityPoints || 0}</p>
              </div>
              <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Availability Status</label>
                <p className={`font-bold text-lg ${donorInfo.availability ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {donorInfo.availability ? '✅ Available' : '⏸️ Not Available'}
                </p>
              </div>
              {donorInfo.address && (
                <div className="bg-white border-2 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Address</label>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">
                    {donorInfo.address.houseName && `${donorInfo.address.houseName}, `}
                    {donorInfo.address.city && `${donorInfo.address.city}, `}
                    {donorInfo.address.pincode}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="mb-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⚙️ Account Actions</h3>
          <div className="flex flex-wrap gap-4">
            {!isDonor && (
              <Link
                to="/donor-register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
              >
                <span className="mr-2">🩸</span>
                Become a Donor
              </Link>
            )}
            <button
              onClick={handleDeleteAccount}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
            >
              <span className="mr-2">🗑️</span>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
