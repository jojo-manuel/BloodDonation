import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function UserDashboard() {
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "",
    city: "",
    state: "",
    availability: "available", // Added availability filter
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("findDonors");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileCompletionData, setProfileCompletionData] = useState({ name: "", phone: "" });

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const query = new URLSearchParams(searchParams).toString();
      const { data } = await api.get(`/donors/search?${query}`);
      if (data.success) {
        setResults(data.data.data);
      } else {
        alert("Search failed: " + data.message);
      }
    } catch (error) {
      alert("Error searching donors: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const isSuspended = localStorage.getItem('isSuspended') === 'true';
  const warningMessage = localStorage.getItem('warningMessage');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/users/me');
        if (data.success) {
          setUser(data.data);
          if (data.data.needsProfileCompletion) {
            setShowProfileCompletion(true);
          }
          if (data.data.role === 'donor') {
            // Fetch donor availability
            const { data: donorData } = await api.get('/donors/me');
            if (donorData.success) {
              setAvailability(donorData.data.availability);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <Layout>
      <div>
        {warningMessage && (
          <div className="mb-6 text-center bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Warning!</strong>
            <span className="block sm:inline"> {warningMessage}</span>
          </div>
        )}
        {isSuspended && (
          <div className="mb-6 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Account Suspended!</strong>
            <span className="block sm:inline"> Your account is currently suspended. Some features may be restricted.</span>
          </div>
        )}

        {/* Profile Icon and Dropdown */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white shadow-lg hover:bg-pink-700 transition"
            >
              {user?.profileImage ? (
                <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.username?.slice(0, 2).toUpperCase() || "U"
              )}
            </button>
            {profileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white">
                      {user?.profileImage ? (
                        <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user?.username?.slice(0, 2).toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user?.role}</p>
                    </div>
                  </div>
                  {user?.role === 'donor' && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={availability}
                          onChange={async () => {
                            try {
                              const { data } = await api.patch('/users/me/availability', { availability: !availability });
                              if (data.success) {
                                setAvailability(!availability);
                              }
                            } catch (error) {
                              alert('Error updating availability');
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Available for donation</span>
                      </label>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('profileImage', file);
                          try {
                            const { data } = await api.patch('/me/profile-image', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            if (data.success) {
                              setUser(data.data);
                            }
                          } catch (error) {
                            alert('Error uploading image');
                          }
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Modal */}
        {showProfileCompletion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Complete Your Profile</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await api.post('/me/complete-profile', profileCompletionData);
                  if (res.data.success) {
                    setUser(res.data.data);
                    setShowProfileCompletion(false);
                  } else {
                    alert("Failed to complete profile");
                  }
                } catch (error) {
                  alert("Error completing profile");
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileCompletionData.name}
                    onChange={(e) => setProfileCompletionData({ ...profileCompletionData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileCompletionData.phone}
                    onChange={(e) => setProfileCompletionData({ ...profileCompletionData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileCompletion(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("findDonors")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "findDonors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            🔍 Find Donors
          </button>
          <button
            onClick={() => setActiveTab("myRequests")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "myRequests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            📋 My Requests
          </button>
          <button
            onClick={() => setActiveTab("leaveReviews")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "leaveReviews" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            ⭐ Leave Reviews
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
        {activeTab === "findDonors" && (
          <>
            {/* Search Form */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8 mb-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🔍 Find Blood Donors
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Search for available blood donors in your area
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Type</label>
                    <select
                      name="bloodGroup"
                      value={searchParams.bloodGroup}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="" className="text-gray-800">All Blood Types</option>
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
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Location</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      value={searchParams.city}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                    <select
                      name="availability"
                      value={searchParams.availability}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="available" className="text-gray-800">Available Only</option>
                      <option value="all" className="text-gray-800">All Donors</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="mr-2">🔍</span>
                    {loading ? "Searching..." : "Search Donors"}
                  </button>
                </div>
              </form>
            </div>

            {/* Search Results */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🩸 Available Donors ({results.length})
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Donors matching your search criteria
                </p>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">No donors found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((donor) => (
                    <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white">
                            {donor.userId?.username?.slice(0, 2).toUpperCase() || "NA"}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.userId?.username || "N/A"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p>🩸 Blood Type: {donor.bloodGroup}</p>
                              <p>📍 Location: {donor.houseAddress?.city || "N/A"}</p>
                              <p>⭐ Rating: 4.8/5</p>
                              <p>📅 Last Donation: {donor.lastDonatedDate ? new Date(donor.lastDonatedDate).toLocaleDateString() : "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]">
                            <span className="mr-1">📞</span>
                            Contact
                          </button>
                          <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 to-purple-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]">
                            <span className="mr-1">❤️</span>
                            Request
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "myRequests" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                📋 My Requests
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                View and manage your blood donation requests
              </p>
            </div>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Feature coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === "leaveReviews" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                ⭐ Leave Reviews
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Share your experience and help others
              </p>
            </div>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Feature coming soon...</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/donor-register"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-green-500/30 active:scale-[0.99] mr-4"
        >
          <span className="mr-2">🩸</span>
          Become a Donor
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
        >
          🚪 Logout
        </button>
        <div className="mt-4">
          <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Home
          </Link>
        </div>
      </div>
      </div>
    </Layout>
  );
}
