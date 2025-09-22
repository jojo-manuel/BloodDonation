import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function UserDashboard() {
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "",
    city: "",
    state: "",
    availability: "available",
    mrid: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("findDonors");
  const [donors, setDonors] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [selectedBloodBankId, setSelectedBloodBankId] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requestsSent, setRequestsSent] = useState([]);
  const [requestsReceived, setRequestsReceived] = useState([]);
  const [activeRequestTab, setActiveRequestTab] = useState("sent");
  const [isDonor, setIsDonor] = useState(false);
  const [checkingDonorStatus, setCheckingDonorStatus] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDonors();
    fetchBloodBanks();
    checkDonorStatus();
    if (activeTab === 'myRequests') {
      fetchMyRequests();
    }
  }, [activeTab]);

  const checkDonorStatus = async () => {
    try {
      const response = await api.get('/donors/me');
      if (response.data.success) {
        setIsDonor(true);
      } else {
        setIsDonor(false);
      }
    } catch (error) {
      // If 404, user is not a donor
      if (error.response?.status === 404) {
        setIsDonor(false);
      } else {
        console.error('Error checking donor status:', error);
      }
    } finally {
      setCheckingDonorStatus(false);
    }
  };

  const handleDonorRegistration = () => {
    navigate('/donor-register');
  };

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let query = new URLSearchParams(searchParams).toString();

      if (searchParams.mrid && searchParams.mrid.trim() !== "") {
        const patientRes = await api.get(`/patients/mrid/${searchParams.mrid.trim()}`);
        if (patientRes.data.success && patientRes.data.data) {
          const patientBloodGroup = patientRes.data.data.bloodGroup;
          query = new URLSearchParams({ bloodGroup: patientBloodGroup }).toString();
        } else {
          alert("No patient found with the provided MRID");
          setLoading(false);
          return;
        }
      }

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

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors/search');
      if (response.data.success) {
        setDonors(response.data.data.data);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  const fetchBloodBanks = async () => {
    try {
      const response = await api.get('/users/bloodbanks/approved');
      if (response.data.success) {
        setBloodBanks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching blood banks:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/users/my-requests');
      if (response.data.success) {
        const allRequests = response.data.data;
        // Separate requests into sent and received
        const sent = allRequests.filter(request => request.type === 'sent' || request.senderId === localStorage.getItem('userId'));
        const received = allRequests.filter(request => request.type === 'received' || request.senderId !== localStorage.getItem('userId'));
        setRequestsSent(sent);
        setRequestsReceived(received);
      }
    } catch (error) {
      console.error('Error fetching my requests:', error);
    }
  };

  const handleDirectBookingSubmit = async () => {
    if (!selectedDonorId || !selectedBloodBankId || !requestedDate || !requestedTime) {
      alert('Please fill all fields');
      return;
    }
    try {
      const response = await api.post('/users/direct-book-slot', {
        donorId: selectedDonorId,
        bloodBankId: selectedBloodBankId,
        requestedDate,
        requestedTime,
      });
      if (response.data.success) {
        alert('Slot booked successfully');
        setShowDirectBookingModal(false);
        setSelectedDonorId('');
        setSelectedBloodBankId('');
        setRequestedDate('');
        setRequestedTime('');
        fetchMyRequests();
      } else {
        alert('Failed to book slot');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('Error booking slot');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      const response = await api.delete(`/users/my-requests/${requestId}`);
      if (response.data.success) {
        alert('Request cancelled successfully');
        fetchMyRequests();
      } else {
        alert('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Error cancelling request');
    }
  };

  return (
    <Layout>
      <div>
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center bg-white/20 rounded-xl p-4 mb-6 backdrop-blur-md shadow-md">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            🩸 User Dashboard
          </div>
          <div className="flex items-center gap-4">
            {/* Donor Registration Button */}
            {!checkingDonorStatus && (
              <button
                onClick={handleDonorRegistration}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
              >
                <span className="mr-1">🩸</span>
                {isDonor ? 'Update Donor Details' : 'Register as Donor'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-2 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('findDonors')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                activeTab === 'findDonors'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
              }`}
            >
              🔍 Find Donors
            </button>
            <button
              onClick={() => setActiveTab('myRequests')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                activeTab === 'myRequests'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
              }`}
            >
              📋 My Requests
            </button>
            <button
              onClick={() => setActiveTab('directBooking')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                activeTab === 'directBooking'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
              }`}
            >
              📅 Direct Booking
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
          {activeTab === 'findDonors' && (
            <>
              {/* Search Form */}
              <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8 mb-8">
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                    🔍 Find Blood Donors
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Search for available blood donors based on your requirements
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient MRID</label>
                      <input
                        type="text"
                        name="mrid"
                        placeholder="Enter patient MRID"
                        value={searchParams.mrid}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Group</label>
                      <select
                        name="bloodGroup"
                        value={searchParams.bloodGroup}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      >
                        <option value="" className="text-gray-800">All Blood Groups</option>
                        <option value="A+" className="text-gray-800">A+</option>
                        <option value="A-" className="text-gray-800">A-</option>
                        <option value="B+" className="text-gray-800">B+</option>
                        <option value="B-" className="text-gray-800">B-</option>
                        <option value="O+" className="text-gray-800">O+</option>
                        <option value="O-" className="text-gray-800">O-</option>
                        <option value="AB+" className="text-gray-800">AB+</option>
                        <option value="AB-" className="text-gray-800">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">City</label>
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
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">State</label>
                      <input
                        type="text"
                        name="state"
                        placeholder="Enter state"
                        value={searchParams.state}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                      />
                    </div>

                    <div className="md:col-span-2">
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

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
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
                    Contact available blood donors for donation
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Searching for donors...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No donors found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((donor) => (
                      <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center font-bold text-lg text-white">
                              {donor.name ? donor.name.charAt(0).toUpperCase() : 'D'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>📧 Email: {donor.email}</p>
                                <p>📱 Phone: {donor.phone}</p>
                                <p>🩸 Blood Group: {donor.bloodGroup}</p>
                                <p>📍 Address: {donor.address}</p>
                                <p>📅 Last Donation: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                                <p>✅ Status: <span className="text-green-600 font-semibold">Available</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedDonorId(donor._id); setShowDirectBookingModal(true); }}
                              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-green-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                            >
                              <span className="mr-1">📅</span>
                              Book Slot
                            </button>
                            <button
                              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                            >
                              <span className="mr-1">📞</span>
                              Contact
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

          {activeTab === 'myRequests' && (
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  📋 My Donation Requests
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Track and manage your donation requests
                </p>
              </div>

              {/* Sub-tabs for Requests Sent and Received */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
                  <button
                    onClick={() => setActiveRequestTab('sent')}
                    className={`px-6 py-2 rounded-full font-semibold transition ${
                      activeRequestTab === 'sent'
                        ? 'bg-pink-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
                    }`}
                  >
                    📤 Requests Sent ({requestsSent.length})
                  </button>
                  <button
                    onClick={() => setActiveRequestTab('received')}
                    className={`px-6 py-2 rounded-full font-semibold transition ${
                      activeRequestTab === 'received'
                        ? 'bg-pink-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
                    }`}
                  >
                    📥 Requests Received ({requestsReceived.length})
                  </button>
                </div>
              </div>

              {/* Requests Sent Section */}
              {activeRequestTab === 'sent' && (
                <div className="mb-8">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">📤 Requests Sent</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Donation requests you have sent to donors and blood banks
                    </p>
                  </div>

                  {requestsSent.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No requests sent yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requestsSent.map((request) => (
                        <div key={request._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{request.donorName || request.name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>🏥 Blood Bank: {request.bloodBankName}</p>
                                <p>📅 Date: {new Date(request.donationDate).toLocaleDateString()}</p>
                                <p>⏰ Time: {request.timeSlot}</p>
                                <p>🩸 Blood Group: {request.bloodGroup}</p>
                                <p>📍 Address: {request.address}</p>
                                <p>📝 Status: <span className={`font-semibold ${
                                  request.status === 'confirmed' ? 'text-green-600' :
                                  request.status === 'pending' ? 'text-yellow-600' :
                                  request.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                                }`}>{request.status}</span></p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelRequest(request._id)}
                                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                >
                                  <span className="mr-1">❌</span>
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Requests Received Section */}
              {activeRequestTab === 'received' && (
                <div>
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">📥 Requests Received</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Donation requests you have received from patients
                    </p>
                  </div>

                  {requestsReceived.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No requests received yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requestsReceived.map((request) => (
                        <div key={request._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{request.patientName || request.name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>🏥 Blood Bank: {request.bloodBankName}</p>
                                <p>📅 Date: {new Date(request.donationDate).toLocaleDateString()}</p>
                                <p>⏰ Time: {request.timeSlot}</p>
                                <p>🩸 Blood Group: {request.bloodGroup}</p>
                                <p>📍 Address: {request.address}</p>
                                <p>📝 Status: <span className={`font-semibold ${
                                  request.status === 'confirmed' ? 'text-green-600' :
                                  request.status === 'pending' ? 'text-yellow-600' :
                                  request.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                                }`}>{request.status}</span></p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-green-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                  >
                                    <span className="mr-1">✅</span>
                                    Accept
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                  >
                                    <span className="mr-1">❌</span>
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'directBooking' && (
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  📅 Direct Slot Booking
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Book donation slots directly with donors and blood banks
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Select Donor</label>
                    <select
                      value={selectedDonorId}
                      onChange={(e) => setSelectedDonorId(e.target.value)}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="">Choose a donor</option>
                      {donors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.bloodGroup})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Select Blood Bank</label>
                    <select
                      value={selectedBloodBankId}
                      onChange={(e) => setSelectedBloodBankId(e.target.value)}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="">Choose a blood bank</option>
                      {bloodBanks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Requested Date</label>
                    <input
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Requested Time</label>
                    <input
                      type="time"
                      value={requestedTime}
                      onChange={(e) => setRequestedTime(e.target.value)}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleDirectBookingSubmit}
                    disabled={!selectedDonorId || !selectedBloodBankId || !requestedDate || !requestedTime}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="mr-2">📅</span>
                    Book Slot
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
