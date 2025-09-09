
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function DonorDashboard() {
  const navigate = useNavigate();

  function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  }

  const [bloodType, setBloodType] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("available");
  const [activeTab, setActiveTab] = useState("find");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDonors();
    // eslint-disable-next-line
  }, []);

  const fetchDonors = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bloodType) params.append("bloodGroup", filters.bloodType);
      if (filters.location) params.append("location", filters.location);
      if (filters.availability === "available") params.append("availability", "true");
      const { data } = await api.get(`/donors/search?${params.toString()}`);
      if (data.success) {
        setDonors(data.data.data || []);
      } else {
        setDonors([]);
      }
    } catch (err) {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDonors({ bloodType, location, availability });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] px-0 py-0">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <span className="bg-pink-400/20 rounded-full p-3 text-3xl">❤️</span>
          <span className="font-bold text-xl text-white">Hope Web - User Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-gray-700/60 rounded-full px-3 py-2 text-white font-bold">jojo</span>
          <button onClick={() => navigate('/donor-register')} className="bg-pink-600 rounded-full px-3 py-2 text-white font-semibold">Become a Donor</button>
          <button className="bg-gray-700/60 rounded-full px-3 py-2 text-white font-semibold">Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-4 px-10 pb-2">
        <button onClick={() => setActiveTab("find")} className={`px-5 py-2 rounded-full font-semibold ${activeTab === "find" ? "bg-white/10 text-pink-400" : "bg-transparent text-white"}`}>Find Donors</button>
        <button onClick={() => setActiveTab("requests")} className={`px-5 py-2 rounded-full font-semibold ${activeTab === "requests" ? "bg-white/10 text-pink-400" : "bg-transparent text-white"}`}>My Requests</button>
        <button onClick={() => setActiveTab("reviews")} className={`px-5 py-2 rounded-full font-semibold ${activeTab === "reviews" ? "bg-white/10 text-pink-400" : "bg-transparent text-white"}`}>Leave Reviews</button>
      </div>

      {/* Main Card */}
      <main className="px-10 pt-2">
        <div className="rounded-3xl bg-white/10 shadow-2xl p-8 max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Find Blood Donors</h2>
          {/* Search Filters */}
          <form onSubmit={handleSearch} className="flex flex-wrap gap-6 items-end mb-8">
            <div>
              <label className="block text-white font-semibold mb-2">Blood Type</label>
              <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="rounded-xl bg-white/20 px-4 py-2 text-white">
                <option value="">All Blood Types</option>
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter location" className="rounded-xl bg-white/20 px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Availability</label>
              <select value={availability} onChange={e => setAvailability(e.target.value)} className="rounded-xl bg-white/20 px-4 py-2 text-white">
                <option value="available">Available Only</option>
                <option value="all">All</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="ml-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold shadow-lg flex items-center gap-2">
              <span className="material-icons">search</span> {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Donor List */}
          <h3 className="text-lg font-bold text-white mb-4">Available Donors ({donors.length})</h3>
          <div className="space-y-6">
            {donors.length === 0 ? (
              <div className="text-white/70">No donors found.</div>
            ) : (
              donors.map((donor, idx) => (
                <div key={donor._id || idx} className="rounded-2xl bg-white/10 border border-white/20 shadow-lg p-6 flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center mr-6">
                    <div className="bg-pink-400/30 rounded-full w-14 h-14 flex items-center justify-center text-2xl font-bold text-white">{getInitials(donor.userId?.username || donor.name)}</div>
                    {donor.availability && <span className="mt-2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">Available</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">{donor.userId?.username || donor.name}</span>
                    </div>
                    <div className="flex gap-6 text-sm text-white/80 mb-2">
                      <span className="flex items-center gap-1"><span className="text-pink-400">❤️</span> Blood Type: <span className="font-bold text-pink-400">{donor.bloodGroup}</span></span>
                      <span className="flex items-center gap-1"><span className="material-icons text-white/60">location_on</span> {donor.houseAddress?.city || donor.location || "N/A"}</span>
                      <span className="flex items-center gap-1"><span className="material-icons text-yellow-400">star</span> Rating: {donor.rating || "4.8"}/5</span>
                    </div>
                    <div className="text-xs text-white/60">Last donation: {donor.lastDonatedDate || donor.lastDonation || "N/A"}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="px-6 py-2 rounded-full bg-gray-700/60 text-white font-semibold flex items-center gap-2"><span className="material-icons">call</span> Contact</button>
                    <button className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold flex items-center gap-2"><span className="material-icons">favorite</span> Request</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
