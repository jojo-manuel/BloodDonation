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
    mrid: "", // Added MRID for patient-based donor search
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

  useEffect(() => {
    fetchDonors();
    fetchBloodBanks();
  }, []);

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let query = new URLSearchParams(searchParams).toString();

      // If MRID is provided, fetch patient by MRID to get blood group and search donors by that blood group
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
        // Reset form
        setSelectedDonorId('');
        setSelectedBloodBankId('');
        setRequestedDate('');
        setRequestedTime('');
      } else {
        alert('Failed to book slot');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('Error booking slot');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">User Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Logout</button>
        </div>
        <nav className="mb-6 flex gap-4 bg-black p-2 rounded">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "findDonors" ? "bg-white text-black" : "bg-black text-white"
            }`}
            onClick={() => setActiveTab("findDonors")}
          >
            Find Donors
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "myRequests" ? "bg-white text-black" : "bg-black text-white"
            }`}
            onClick={() => setActiveTab("myRequests")}
          >
            My Requests
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "leaveReviews" ? "bg-white text-black" : "bg-black text-white"
            }`}
            onClick={() => setActiveTab("leaveReviews")}
          >
            Leave Reviews
          </button>
        </nav>

        <main className="w-full">
          {activeTab === "findDonors" && (
            <>
              <h2 className="text-xl font-semibold mb-4">Find Blood Donors</h2>
              <form onSubmit={handleSearch} className="mb-6 bg-white p-4 rounded shadow flex flex-wrap gap-4 items-center">
                <div className="flex flex-col flex-grow min-w-[150px]">
                  <label htmlFor="mrid" className="mb-1 font-semibold">Patient MRID</label>
                  <input
                    id="mrid"
                    type="text"
                    name="mrid"
                    placeholder="Enter patient MRID"
                    value={searchParams.mrid}
                    onChange={handleChange}
                    className="rounded px-3 py-2 border"
                  />
                </div>
                <div className="flex flex-col flex-grow min-w-[150px]">
                  <label htmlFor="bloodGroup" className="mb-1 font-semibold">Blood Type</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={searchParams.bloodGroup}
                    onChange={handleChange}
                    className="rounded px-3 py-2 border"
                  >
                    <option value="">All Blood Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="flex flex-col flex-grow min-w-[150px]">
                  <label htmlFor="city" className="mb-1 font-semibold">Location</label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    placeholder="Enter location"
                    value={searchParams.city}
                    onChange={handleChange}
                    className="rounded px-3 py-2 border"
                  />
                </div>
                <div className="flex flex-col flex-grow min-w-[150px]">
                  <label htmlFor="availability" className="mb-1 font-semibold">Availability</label>
                  <select
                    id="availability"
                    name="availability"
                    value={searchParams.availability}
                    onChange={handleChange}
                    className="rounded px-3 py-2 border"
                  >
                    <option value="available">Available Only</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 px-6 py-3 rounded text-white font-semibold hover:bg-blue-700 disabled:opacity-50 self-end"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>

              <button onClick={() => setShowDirectBookingModal(true)} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Direct Book Slot
              </button>

              <div>
                <h3 className="font-semibold mb-2">Available Donors ({results.length})</h3>
                {results.length === 0 ? (
                  <p>No donors found.</p>
                ) : (
                  results.map((donor) => (
                    <div key={donor._id} className="mb-4 p-4 bg-white rounded shadow flex flex-col md:flex-row items-center justify-between">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white">
                          {donor.name ? donor.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{donor.name}</h4>
                          <p className="text-sm text-gray-600">{donor.email}</p>
                          <p className="text-sm text-gray-600">{donor.phone}</p>
                          <p className="text-sm text-gray-600">Blood Group: {donor.bloodGroup}</p>
                          <p className="text-sm text-gray-600">Address: {donor.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded">Contact</button>
                        <button onClick={() => { setSelectedDonorId(donor._id); setShowDirectBookingModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded">Book Slot</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "myRequests" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Requests</h2>
              <p>Here you can view your donation requests and their status.</p>
              {/* Placeholder for actual requests list */}
            </div>
          )}

          {activeTab === "leaveReviews" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Leave Reviews</h2>
              <p>Share your feedback about blood banks and donors.</p>
              {/* Placeholder for review form */}
            </div>
          )}
        </main>

        {showDirectBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Direct Book Slot</h3>
              <form onSubmit={handleDirectBookingSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Donor</label>
                  <select
                    value={selectedDonorId}
                    onChange={(e) => setSelectedDonorId(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Donor</option>
                    {donors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Blood Bank</label>
                  <select
                    value={selectedBloodBankId}
                    onChange={(e) => setSelectedBloodBankId(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Blood Bank</option>
                    {bloodBanks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Requested Date</label>
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Requested Time</label>
                  <input
                    type="time"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Book Slot</button>
                  <button type="button" onClick={() => setShowDirectBookingModal(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
