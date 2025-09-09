import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white w-screen h-screen overflow-hidden text-lg">
      <header className="flex items-center justify-between p-6 w-full max-w-full glass">
        <h1 className="text-4xl font-bold">Hope Web - User Portal</h1>
        <div className="flex items-center gap-6 text-xl">
          <Link
            to="/donor-register"
            className="px-6 py-3 bg-green-600 rounded hover:bg-green-700 text-lg"
          >
            Become a Donor
          </Link>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 rounded hover:bg-red-700 text-lg"
          >
            Logout
          </button>
          <div className="rounded-full bg-pink-600 w-12 h-12 flex items-center justify-center font-bold text-xl">
            {localStorage.getItem("username")?.slice(0, 2).toUpperCase() || "U"}
          </div>
          <span>{localStorage.getItem("username") || "User"}</span>
        </div>
      </header>

      <nav className="mb-6 flex gap-4 bg-purple-700 rounded p-2 w-full max-w-full">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "findDonors" ? "bg-purple-900 font-semibold" : "bg-purple-600"
          }`}
          onClick={() => setActiveTab("findDonors")}
        >
          Find Donors
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "myRequests" ? "bg-purple-900 font-semibold" : "bg-purple-600"
          }`}
          onClick={() => setActiveTab("myRequests")}
        >
          My Requests
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "leaveReviews" ? "bg-purple-900 font-semibold" : "bg-purple-600"
          }`}
          onClick={() => setActiveTab("leaveReviews")}
        >
          Leave Reviews
        </button>
      </nav>

      <main className="flex-grow max-w-full mx-auto w-full p-6 overflow-auto">
        {activeTab === "findDonors" && (
          <>
            <h2 className="text-xl font-semibold mb-4">Find Blood Donors</h2>
            <form onSubmit={handleSearch} className="mb-6 bg-purple-700 p-4 rounded flex flex-wrap gap-4 items-center">
              <div className="flex flex-col flex-grow min-w-[150px]">
                <label htmlFor="bloodGroup" className="mb-1 font-semibold">Blood Type</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={searchParams.bloodGroup}
                  onChange={handleChange}
                  className="rounded px-3 py-2 bg-purple-600 text-white"
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
                  className="rounded px-3 py-2 bg-purple-600 text-white"
                />
              </div>
              <div className="flex flex-col flex-grow min-w-[150px]">
                <label htmlFor="availability" className="mb-1 font-semibold">Availability</label>
                <select
                  id="availability"
                  name="availability"
                  value={searchParams.availability}
                  onChange={handleChange}
                  className="rounded px-3 py-2 bg-purple-600 text-white"
                >
                  <option value="available">Available Only</option>
                  <option value="all">All</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-3 rounded text-white font-semibold hover:brightness-110 disabled:opacity-50 self-end"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            <div>
              <h3 className="font-semibold mb-2">Available Donors ({results.length})</h3>
              {results.length === 0 ? (
                <p>No donors found.</p>
              ) : (
                results.map((donor) => (
                  <div key={donor._id} className="mb-4 p-4 bg-purple-800 rounded flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white">
                        {donor.userId?.username?.slice(0, 2).toUpperCase() || "NA"}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{donor.userId?.username || "N/A"}</div>
                        <div className="text-sm flex flex-wrap items-center gap-2">
                          <span>❤️ Blood Type: {donor.bloodGroup}</span>
                          <span>📍 {donor.houseAddress?.city || "N/A"}</span>
                          <span>⭐ Rating: 4.8/5</span>
                        </div>
                        <div className="text-xs text-gray-300">
                          Last donation: {donor.lastDonatedDate || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h1l2 3 3-3 4 4 5-5 3 3v6H3v-8z" />
                        </svg>
                        Contact
                      </button>
                      <button className="bg-pink-600 px-4 py-2 rounded text-white hover:bg-pink-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        Request
                      </button>
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
            <p>Feature coming soon.</p>
          </div>
        )}

        {activeTab === "leaveReviews" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Leave Reviews</h2>
            <p>Feature coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
