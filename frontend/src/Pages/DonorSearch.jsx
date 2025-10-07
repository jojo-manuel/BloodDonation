import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorSearch() {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    city: "",
    state: "",
    pincode: "",
    mrnumber: "",
    page: 1,
    limit: 10,
  });
  const [donors, setDonors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonors, setTotalDonors] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      let response;
      if (filters.mrnumber && filters.mrnumber.trim() !== "") {
        // Search donors by MR number
        const params = {
          city: filters.city || undefined,
          state: filters.state || undefined,
          pincode: filters.pincode || undefined,
          page: filters.page,
          limit: filters.limit,
        };
        response = await api.get(`/donors/searchByMrid/${filters.mrnumber}`, { params });
      } else {
        // Normal donor search
        const params = {
          bloodGroup: filters.bloodGroup || undefined,
          city: filters.city || undefined,
          state: filters.state || undefined,
          pincode: filters.pincode || undefined,
          page: filters.page,
          limit: filters.limit,
        };
        response = await api.get("/donors/search", { params });
      }
      if (response.data.success) {
        // Handle two response shapes:
        // 1) Normal search: { data: { data: Donor[], page, total, pages } }
        // 2) MRID search: { data: Donor[] }
        const payload = response.data.data;
        if (Array.isArray(payload)) {
          setDonors(payload);
          setTotalPages(1);
          setTotalDonors(payload.length);
        } else {
          setDonors(payload.data);
          setTotalPages(payload.pages);
          setTotalDonors(payload.total);
        }
      } else {
        alert("Failed to fetch donors: " + response.data.message);
      }
    } catch (error) {
      alert("Error fetching donors: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, [filters.page]);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Search Blood Donors</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchDonors();
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <input
            type="text"
            name="mrnumber"
            placeholder="Patient MRID"
            value={filters.mrnumber}
            onChange={handleInputChange}
            className="rounded border px-3 py-2 md:col-span-2"
          />
          <select
            name="bloodGroup"
            value={filters.bloodGroup}
            onChange={handleInputChange}
            className="rounded border px-3 py-2"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={filters.city}
            onChange={handleInputChange}
            className="rounded border px-3 py-2"
          />
          <input
            type="text"
            name="state"
            placeholder="State/District"
            value={filters.state}
            onChange={handleInputChange}
            className="rounded border px-3 py-2"
          />
          <input
            type="text"
            name="pincode"
            placeholder="Pincode"
            value={filters.pincode}
            onChange={handleInputChange}
            className="rounded border px-3 py-2"
          />
          <button
            type="submit"
            className="md:col-span-4 bg-red-600 text-white rounded py-2 mt-2 hover:bg-red-700 transition"
          >
            Search
          </button>
        </form>

        {loading ? (
          <p className="text-center">Loading donors...</p>
        ) : donors.length === 0 ? (
          <p className="text-center">No donors found.</p>
        ) : (
          <div className="space-y-4">
            {donors.map((donor) => (
              <div
                key={donor._id}
                className="border rounded p-4 shadow hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold">{donor.name}</h2>
                <p>
                  Blood Group: <strong>{donor.bloodGroup}</strong>
                </p>
                <p>
                  Location: {donor.houseAddress?.city}, {donor.houseAddress?.district},{" "}
                  {donor.houseAddress?.pincode}
                </p>
                <p>Contact Preference: {donor.contactPreference}</p>
                <p>Contact Number: {donor.contactNumber}</p>
                <p>Availability: {donor.availability ? "Available" : "Unavailable"}</p>
                <p>Last Donated: {donor.lastDonatedDate || "N/A"}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page <= 1}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {filters.page} of {totalPages} (Total: {totalDonors})
          </span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= totalPages}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
