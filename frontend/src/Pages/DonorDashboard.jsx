
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

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
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientFormData, setPatientFormData] = useState({
    patientName: "",
    address: "",
    bloodGroup: "",
    mrid: "",
    requiredUnits: "",
    requiredDate: "",
  });
  const [editingPatient, setEditingPatient] = useState(null);

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

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      if (res.data.success) setPatients(res.data.data);
    } catch (err) {
      console.error("Failed to fetch patients");
    }
  };

  // Add patient handler
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/patients", {
        patientName: patientFormData.patientName,
        address: patientFormData.address,
        bloodGroup: patientFormData.bloodGroup,
        mrid: patientFormData.mrid,
        requiredUnits: Number(patientFormData.requiredUnits),
        requiredDate: patientFormData.requiredDate,
      });
      if (res.data.success) {
        setPatients([...patients, res.data.patient || res.data.data]);
        setPatientFormData({
          patientName: "",
          address: "",
          bloodGroup: "",
          mrid: "",
          requiredUnits: "",
          requiredDate: "",
        });
      } else {
        alert(res.data.message || "Failed to add patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add patient");
    }
    setLoading(false);
  };

  // Update patient handler
  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/patients/${editingPatient._id}`, {
        patientName: patientFormData.patientName,
        address: patientFormData.address,
        bloodGroup: patientFormData.bloodGroup,
        requiredUnits: Number(patientFormData.requiredUnits),
        requiredDate: patientFormData.requiredDate,
      });
      if (res.data.success) {
        setPatients(patients.map(p => p._id === editingPatient._id ? res.data.updatedPatient : p));
        setEditingPatient(null);
        setPatientFormData({
          patientName: "",
          address: "",
          bloodGroup: "",
          mrid: "",
          requiredUnits: "",
          requiredDate: "",
        });
      } else {
        alert(res.data.message || "Failed to update patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update patient");
    }
    setLoading(false);
  };

  // Delete patient handler
  const handleDeletePatient = async (id) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await api.delete(`/patients/${id}`);
      if (res.data.success) {
        setPatients(patients.filter(p => p._id !== id));
      } else {
        alert(res.data.message || "Failed to delete patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete patient");
    }
  };

  // Start editing
  const startEditing = (patient) => {
    setEditingPatient(patient);
    setPatientFormData({
      patientName: patient.name,
      address: patient.address,
      bloodGroup: patient.bloodGroup,
      mrid: patient.mrid,
      requiredUnits: patient.unitsRequired,
      requiredDate: patient.dateNeeded ? new Date(patient.dateNeeded).toISOString().split('T')[0] : "",
    });
  };

  // Fetch patients when patients tab is active
  useEffect(() => {
    if (activeTab === "patients") {
      fetchPatients();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Layout>
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("find")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "find" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Find Donors
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "patients" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Patient Details
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "requests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "reviews" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Reviews
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {activeTab === "find" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🩸 Find Blood Donors
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Search for available donors in your area
              </p>
            </div>

            {/* Search Filters */}
            <form onSubmit={handleSearch} className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Type</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
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
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <option value="available">Available Only</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99] disabled:opacity-50"
                >
                  🔍 {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            {/* Donor List */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Available Donors ({donors.length})
              </h3>
              <div className="space-y-4">
                {donors.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No donors found matching your criteria.
                  </div>
                ) : (
                  donors.map((donor, idx) => (
                    <div key={donor._id || idx} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-pink-400/30 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                            {getInitials(donor.userId?.username || donor.name)}
                          </div>
                          {donor.availability && (
                            <span className="mt-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                              Available
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {donor.userId?.username || donor.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                              <span className="text-pink-400">🩸</span> Blood Type: <span className="font-bold text-pink-600">{donor.bloodGroup}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              📍 {donor.houseAddress?.city || donor.location || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              ⭐ Rating: {donor.rating || "4.8"}/5
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Last donation: {donor.lastDonatedDate || donor.lastDonation || "N/A"}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]">
                            📞 Contact
                          </button>
                          <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]">
                            ❤️ Request
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🏥 Patient Details
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manage patient information and blood requirements
              </p>
            </div>

            {/* Patient Form */}
            <form onSubmit={editingPatient ? handleUpdatePatient : handleAddPatient} className="mb-8">
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient Name</label>
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={patientFormData.patientName}
                    onChange={(e) => setPatientFormData({ ...patientFormData, patientName: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address</label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={patientFormData.address}
                    onChange={(e) => setPatientFormData({ ...patientFormData, address: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Group</label>
                  <select
                    value={patientFormData.bloodGroup}
                    onChange={(e) => setPatientFormData({ ...patientFormData, bloodGroup: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
