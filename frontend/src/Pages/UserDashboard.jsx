import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("findDonors");
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "",
    city: "",
    availability: "available"
  });
  const [results, setResults] = useState([]);
  const [mrid, setMrid] = useState("");
  const [mridResults, setMridResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mridLoading, setMridLoading] = useState(false);
  const [mridError, setMridError] = useState("");
  const [mridSuccess, setMridSuccess] = useState("");
  const navigate = useNavigate();
  const [requestingId, setRequestingId] = useState(null);

  // Handle search form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const query = new URLSearchParams(searchParams).toString();
      const res = await api.get(`/donors/search?${query}`);
      if (res.data.success) {
        setResults(res.data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleMridSearch = async (event) => {
    event.preventDefault();
    const trimmed = mrid.trim();
    if (!trimmed) {
      setMridError('Please enter a patient MRID to search.');
      setMridSuccess('');
      setMridResults([]);
      return;
    }

    setMridLoading(true);
    setMridError('');
    setMridSuccess('');

    try {
      const response = await api.get(`/donors/searchByMrid/${encodeURIComponent(trimmed)}`);
      // Support both shapes: { data: Donor[] } or { data: { data: Donor[] } }
      const dataNode = response?.data?.data;
      const payload = Array.isArray(dataNode) ? dataNode : (dataNode?.data || []);
      setMridResults(payload);
      if (payload.length === 0) {
        setMridError('No available donors matched this MRID.');
      } else {
        setMridSuccess(`Found ${payload.length} donor${payload.length > 1 ? 's' : ''} for MRID ${trimmed}.`);
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to fetch donors for the provided MRID.';
      setMridError(message);
      setMridResults([]);
    } finally {
      setMridLoading(false);
    }
  };

  // Fetch donation requests received by the authenticated donor
  const fetchRequests = async () => {
    try {
      const [recRes, sentRes] = await Promise.all([
        api.get("/donors/requests"),
        api.get("/donors/requests/sent")
      ]);
      if (recRes.data.success) {
        setRequests(recRes.data.data);
      } else {
        setRequests([]);
      }
      if (sentRes.data.success) {
        setSentRequests(sentRes.data.data);
      } else {
        setSentRequests([]);
      }
    } catch (err) {
      setRequests([]);
      setSentRequests([]);
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { userId: localStorage.getItem('userId') });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (activeTab === "myRequests") {
      fetchRequests();
    }
  }, [activeTab]);

  const sendRequest = async (donor) => {
    try {
      setRequestingId(donor._id);
      const body = { bloodGroup: donor.bloodGroup };
      const res = await api.post(`/donors/${donor._id}/requests`, body);
      if (res.data.success) {
        alert('Request sent successfully');
      } else {
        alert(res.data.message || 'Failed to send request');
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <Layout>
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
            onClick={() => setActiveTab("searchByMrid")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "searchByMrid" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            🆔 Search by MRID
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

                {/* MRID quick search inside Find Donors tab */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient MRID</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter patient MRID"
                      value={mrid}
                      onChange={(e) => setMrid(e.target.value)}
                      className="flex-1 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleMridSearch}
                      disabled={mridLoading}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-indigo-500/30 active:scale-[0.99] disabled:opacity-50"
                    >
                      <span className="mr-2">🆔</span>
                      {mridLoading ? 'Searching...' : 'Search by MRID'}
                    </button>
                  </div>
                  {mridError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{mridError}</p>
                  )}
                  {mridSuccess && (
                    <p className="mt-2 text-sm text-green-700 dark:text-green-400">{mridSuccess}</p>
                  )}
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
                  🩸 Available Donors ({(mridResults.length > 0 ? mridResults : results).length})
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Donors matching your search criteria
                </p>
              </div>

              {(mridResults.length === 0 && results.length === 0) ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">No donors found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(mridResults.length > 0 ? mridResults : results).map((donor) => (
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
                          <button onClick={() => sendRequest(donor)} disabled={requestingId === donor._id} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 to-purple-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50">
                            <span className="mr-1">❤️</span>
                            {requestingId === donor._id ? 'Requesting...' : 'Request'}
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
                View requests you've received and sent
              </p>
            </div>
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Received Requests ({requests.length})</h3>
                  {requests.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No requests received yet.</p>
                  ) : (
                    requests.map((request) => (
                      <div
                        key={request._id}
                        className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5 mb-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Blood Request</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="mr-2">🩸 {request.bloodGroup}</span>
                              <span>Status: {request.status}</span>
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'accepted' ? 'bg-green-600' : request.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                            } text-white`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <p>Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</p>
                          <p>Issued: {request.issuedAt ? new Date(request.issuedAt).toLocaleString() : 'Not issued'}</p>
                          <p>Active: {request.isActive ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Sent Requests ({sentRequests.length})</h3>
                  {sentRequests.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No requests sent yet.</p>
                  ) : (
                    sentRequests.map((request) => (
                      <div
                        key={request._id}
                        className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5 mb-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Blood Request</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="mr-2">🩸 {request.bloodGroup}</span>
                              <span>Status: {request.status}</span>
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'accepted' ? 'bg-green-600' : request.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                            } text-white`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <p>Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</p>
                          <p>Issued: {request.issuedAt ? new Date(request.issuedAt).toLocaleString() : 'Not issued'}</p>
                          <p>Active: {request.isActive ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
    </Layout>
  );
}
