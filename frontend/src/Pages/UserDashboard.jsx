import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function UserDashboard() {
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "",
    city: "",
    state: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">User Dashboard</h1>
      <button
        onClick={handleLogout}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
      <div className="mb-8 flex gap-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <select
            name="bloodGroup"
            value={searchParams.bloodGroup}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={searchParams.city}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={searchParams.state}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <Link to="/donor-register" className="px-6 py-2 rounded-full bg-pink-500 text-white font-semibold shadow hover:bg-pink-600 flex items-center gap-2">
          <span>❤️</span> Register as Donor
        </Link>
      </div>
      <div>
        {results.length === 0 ? (
          <p>No donors found.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1">Name</th>
                <th className="border border-gray-300 px-2 py-1">Blood Group</th>
                <th className="border border-gray-300 px-2 py-1">City</th>
                <th className="border border-gray-300 px-2 py-1">State</th>
                <th className="border border-gray-300 px-2 py-1">Last Donated</th>
              </tr>
            </thead>
            <tbody>
              {results.map((donor) => (
                <tr key={donor._id}>
                  <td className="border border-gray-300 px-2 py-1">{donor.userId?.username || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 py-1">{donor.bloodGroup}</td>
                  <td className="border border-gray-300 px-2 py-1">{donor.houseAddress?.city || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 py-1">{donor.houseAddress?.district || 'N/A'}</td>
                  <td className="border border-gray-300 px-2 py-1">{donor.lastDonatedDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
