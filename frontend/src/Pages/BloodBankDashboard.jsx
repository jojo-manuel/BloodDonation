import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import DonorSearchForm from "../components/DonorSearchForm";
import UserSearchForm from "../components/UserSearchForm";

export default function BloodBankDashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [bookings, setBookings] = useState([]); // Added for booking display
  const [donors, setDonors] = useState([]);
  const [bloodBankDetails, setBloodBankDetails] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null); // For reschedule modal
  const [rescheduling, setRescheduling] = useState(false);
  const [tokenSearch, setTokenSearch] = useState(''); // Frontdesk token search
  const [searchedBooking, setSearchedBooking] = useState(null); // Found booking
  const [searchingToken, setSearchingToken] = useState(false); // Loading state
  const [visitedDonors, setVisitedDonors] = useState([]); // Donors who visited
  const [showVisitHistory, setShowVisitHistory] = useState(false); // Toggle visit history view
  const [expandedDonor, setExpandedDonor] = useState(null); // Expanded donor for visit details
  const [formData, setFormData] = useState({
    patientName: "",
    address: {
      houseName: "",
      houseAddress: "",
      pincode: "",
      district: "",
      city: "",
      localBody: "",
      state: ""
    },
    bloodGroup: "",
    mrid: "",
    phoneNumber: "",
    requiredUnits: "",
    requiredDate: "",
  });
  const [loading, setLoading] = useState(false);

  // Safely format address objects for display
  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const { houseName, houseAddress, localBody, city, district, state, pincode } = addr || {};
    return [houseName, houseAddress, localBody, city, district, state, pincode]
      .filter(Boolean)
      .join(', ');
  };

  // Search states for users
  const [searchUsername, setSearchUsername] = useState('');
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [searchUserRole, setSearchUserRole] = useState('');
  const [searchUserDate, setSearchUserDate] = useState('');

  // Search states for donors
  const [searchBloodGroup, setSearchBloodGroup] = useState('');
  const [searchDonorEmail, setSearchDonorEmail] = useState('');
  const [searchPlace, setSearchPlace] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch patients list
  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      if (res.data.success) setPatients(res.data.data);
    } catch (err) {
      // Handle error silently or show notification
      console.error("Failed to fetch patients", err);
    }
  };

  // Fetch patients list on mount
  useEffect(() => {
    fetchPatients();
    fetchBloodBankDetails();
  }, []);

  // Fetch blood bank details
  const fetchBloodBankDetails = async () => {
    try {
      const res = await api.get("/bloodbank/details");
      if (res.data.success) setBloodBankDetails(res.data.data);
    } catch (err) {
      console.error("Failed to fetch blood bank details", err);
    }
  };

  // Fetch bookings, donation requests and donors when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchBookings(); // Fetch actual bookings
    } else if (activeTab === 'received') {
      fetchDonationRequests(); // Fetch received donation requests
    } else if (activeTab === 'donors') {
      fetchDonors();
    }
  }, [activeTab]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get("/bloodbank/users");
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // Fetch bookings for "Booked Slots" tab
  const fetchBookings = async () => {
    try {
      const res = await api.get("/bloodbank/bookings");
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  // Fetch donation requests for "Received Requests" tab
  const fetchDonationRequests = async () => {
    try {
      const res = await api.get("/bloodbank/donation-requests");
      if (res.data.success) setDonationRequests(res.data.data);
    } catch (err) {
      console.error("Failed to fetch donation requests", err);
    }
  };

  // Fetch donors
  const fetchDonors = async () => {
    try {
      const res = await api.get("/bloodbank/donors");
      if (res.data.success) setDonors(res.data.data);
    } catch (err) {
      console.error("Failed to fetch donors", err);
    }
  };

  // Handle confirm booking
  const handleConfirmBooking = async (booking) => {
    if (!confirm(`Confirm booking for ${booking.donorName}?`)) return;
    
    try {
      const res = await api.put(`/bloodbank/bookings/${booking._id}/status`, { status: 'confirmed' });
      if (res.data.success) {
        alert('Booking confirmed successfully!');
        fetchBookings(); // Refresh bookings list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm booking');
    }
  };

  // Handle reject booking
  const handleRejectBooking = async (booking) => {
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason === null) return; // User clicked cancel
    
    try {
      const res = await api.put(`/bloodbank/bookings/${booking._id}/status`, { 
        status: 'rejected',
        rejectionReason: reason
      });
      if (res.data.success) {
        alert('Booking rejected');
        fetchBookings(); // Refresh bookings list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  // Handle reschedule booking
  const handleRescheduleBooking = async (newDate, newTime) => {
    if (!rescheduleModal) return;
    
    try {
      setRescheduling(true);
      const res = await api.put(`/bloodbank/bookings/${rescheduleModal._id}/reschedule`, {
        newDate,
        newTime
      });
      
      if (res.data.success) {
        alert('Booking rescheduled successfully!');
        setRescheduleModal(null);
        fetchBookings(); // Refresh bookings list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setRescheduling(false);
    }
  };

  // Frontdesk: Search booking by token number
  const handleTokenSearch = async () => {
    if (!tokenSearch.trim()) {
      alert('Please enter a token number');
      return;
    }

    try {
      setSearchingToken(true);
      const res = await api.get(`/bloodbank/bookings/token/${tokenSearch.trim()}`);
      
      if (res.data.success) {
        setSearchedBooking(res.data.data);
      } else {
        alert('Booking not found');
        setSearchedBooking(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Booking not found');
      setSearchedBooking(null);
    } finally {
      setSearchingToken(false);
    }
  };

  // Frontdesk: Mark arrival
  const handleMarkArrival = async () => {
    if (!searchedBooking) return;

    if (!confirm(`Mark arrival for ${searchedBooking.donorName}?`)) return;

    try {
      const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
        status: 'confirmed',
        arrived: true,
        arrivalTime: new Date().toISOString()
      });

      if (res.data.success) {
        alert('Arrival marked successfully!');
        setSearchedBooking(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark arrival');
    }
  };

  // Frontdesk: Mark rejection
  const handleMarkRejection = async () => {
    if (!searchedBooking) return;

    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;

    try {
      const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
        status: 'rejected',
        rejectionReason: reason
      });

      if (res.data.success) {
        alert('Booking rejected');
        setSearchedBooking(null);
        setTokenSearch('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  // Frontdesk: Mark completion
  const handleMarkCompletion = async () => {
    if (!searchedBooking) return;

    if (!confirm(`Mark donation as completed for ${searchedBooking.donorName}?`)) return;

    try {
      const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      if (res.data.success) {
        alert('✅ Donation completed! Thank you for saving lives! 🎉');
        setSearchedBooking(null);
        setTokenSearch('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark completion');
    }
  };

  // Handle user status change
  const handleUserStatusChange = async (userId, action, value) => {
    let status = {};
    if (action === 'block') {
      status = { isBlocked: value };
    } else if (action === 'suspend') {
      status = { isSuspended: value };
    } else if (action === 'warn') {
      const message = prompt('Enter warning message:');
      if (!message) return;
      status = { warningMessage: message };
    }

    try {
      const res = await api.put(`/bloodbank/users/${userId}/status`, status);
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? res.data.data : u));
        alert("User status updated successfully");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status");
    }
  };

  // Handle donor status change
  const handleDonorStatusChange = async (donorId, action, value) => {
    let status = {};
    if (action === 'block') {
      status = { isBlocked: value };
    } else if (action === 'suspend') {
      status = { isSuspended: value };
    } else if (action === 'warn') {
      const message = prompt('Enter warning message:');
      if (!message) return;
      status = { warningMessage: message };
    }

    try {
      const res = await api.put(`/bloodbank/donors/${donorId}/status`, status);
      if (res.data.success) {
        setDonors(donors.map(d => d._id === donorId ? res.data.data : d));
        alert("Donor status updated successfully");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update donor status");
    }
  };

  // Add patient handler
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/patients", {
        patientName: formData.patientName,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        mrid: formData.mrid,
        phoneNumber: formData.phoneNumber,
        requiredUnits: Number(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      });
      if (res.data.success) {
        setPatients([...patients, res.data.patient || res.data.data]);
        setFormData({
          patientName: "",
          address: {
            houseName: "",
            houseAddress: "",
            pincode: "",
            district: "",
            city: "",
            localBody: "",
            state: ""
          },
          bloodGroup: "",
          mrid: "",
          phoneNumber: "",
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
        patientName: formData.patientName,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        requiredUnits: Number(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      });
      if (res.data.success) {
        setPatients(
          patients.map((p) =>
            p._id === editingPatient._id ? res.data.updatedPatient : p
          )
        );
        setEditingPatient(null);
        setFormData({
          patientName: "",
          address: {
            houseName: "",
            houseAddress: "",
            pincode: "",
            district: "",
            city: "",
            localBody: "",
            state: ""
          },
          bloodGroup: "",
          mrid: "",
          phoneNumber: "",
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

  // Delete patient handler (soft delete)
  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await api.delete(`/patients/${id}`);
      if (res.data.success) {
        setPatients(patients.filter((p) => p._id !== id));
      } else {
        alert(res.data.message || "Failed to delete patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete patient");
    }
  };

  // Restore patient handler
  const handleRestorePatient = async (id) => {
    try {
      const res = await api.post(`/patients/${id}/restore`);
      if (res.data.success) {
        // Refresh patients list after restore
        fetchPatients();
      } else {
        alert(res.data.message || "Failed to restore patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore patient");
    }
  };

  // Start editing
  const startEditing = (patient) => {
    setEditingPatient(patient);
    setFormData({
      patientName: patient.patientName || patient.name || "",
      address: patient.address || {
        houseName: "",
        houseAddress: "",
        pincode: "",
        district: "",
        city: "",
        localBody: "",
        state: ""
      },
      bloodGroup: patient.bloodGroup || "",
      mrid: patient.mrid || "",
      phoneNumber: patient.phoneNumber || "",
      requiredUnits: patient.requiredUnits || patient.unitsRequired || "",
      requiredDate: patient.requiredDate
        ? new Date(patient.requiredDate).toISOString().split("T")[0]
        : patient.dateNeeded
        ? new Date(patient.dateNeeded).toISOString().split("T")[0]
        : "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPatient(null);
    setFormData({
      patientName: "",
      address: {
        houseName: "",
        houseAddress: "",
        pincode: "",
        district: "",
        city: "",
        localBody: "",
        state: ""
      },
      bloodGroup: "",
      mrid: "",
      phoneNumber: "",
      requiredUnits: "",
      requiredDate: "",
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/bloodbank-login";
  };

  const isSuspended = localStorage.getItem('isSuspended') === 'true';
  const warningMessage = localStorage.getItem('warningMessage');

  return (
    <Layout>
      <div>
        {/* Navbar with blood bank name and logout */}
        <div className="flex justify-between items-center bg-white/20 rounded-xl p-4 mb-6 backdrop-blur-md shadow-md">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {bloodBankDetails ? bloodBankDetails.name : "Blood Bank Dashboard"}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-2 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
          >
            🚪 Logout
          </button>
        </div>

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
        <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === 'patients'
                ? 'bg-pink-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
            }`}
          >
            🏥 Manage Patients
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === 'users'
                ? 'bg-pink-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
            }`}
          >
            📅 Booked Slots
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === 'donors'
                ? 'bg-pink-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
            }`}
          >
            🩸 Manage Donors
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === 'received'
                ? 'bg-pink-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
            }`}
          >
            📥 Received Requests
          </button>
          <button
            onClick={() => setActiveTab('frontdesk')}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === 'frontdesk'
                ? 'bg-pink-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white'
            }`}
          >
            🖥️ Frontdesk
          </button>
          <Link
            to="/bloodbank-register"
            className="px-6 py-2 rounded-full font-semibold text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white transition"
          >
            🔄 Update Details
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
        {activeTab === 'patients' && (
          <>
            {/* Add/Edit Patient Form */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8 mb-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  {editingPatient ? "✏️ Edit Patient" : "🏥 Add New Patient"}
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {editingPatient ? "Update patient information" : "Add a patient requiring blood transfusion"}
                </p>
              </div>

              <form onSubmit={editingPatient ? handleUpdatePatient : handleAddPatient} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient Name</label>
                    <input
                      type="text"
                      placeholder="Enter patient name"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="" className="text-gray-800">Select Blood Group</option>
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
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Medical Record ID (MRID)</label>
                    <input
                      type="text"
                      placeholder="Enter MRID"
                      value={formData.mrid}
                      onChange={(e) => setFormData({ ...formData, mrid: e.target.value })}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      pattern="[0-9]{10}"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Required Units</label>
                    <input
                      type="number"
                      placeholder="Number of units needed"
                      min="1"
                      value={formData.requiredUnits}
                      onChange={(e) => setFormData({ ...formData, requiredUnits: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Required Date</label>
                    <input
                      type="date"
                      value={formData.requiredDate}
                      onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address Details</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">House Name</label>
                        <input
                          type="text"
                          placeholder="Enter house name"
                          value={formData.address.houseName}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, houseName: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">House Address</label>
                        <input
                          type="text"
                          placeholder="Enter house address"
                          value={formData.address.houseAddress}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, houseAddress: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Pincode *</label>
                        <input
                          type="text"
                          placeholder="Enter pincode"
                          pattern="[0-9]{6}"
                          maxLength="6"
                          value={formData.address.pincode}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, pincode: e.target.value }
                          })}
                          required
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">District</label>
                        <input
                          type="text"
                          placeholder="Enter district"
                          value={formData.address.district}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, district: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">City</label>
                        <input
                          type="text"
                          placeholder="Enter city"
                          value={formData.address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Local Body</label>
                        <input
                          type="text"
                          placeholder="Enter local body"
                          value={formData.address.localBody}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, localBody: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">State</label>
                        <input
                          type="text"
                          placeholder="Enter state"
                          value={formData.address.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value }
                          })}
                          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="mr-2">{editingPatient ? "✏️" : "🏥"}</span>
                    {loading ? (editingPatient ? "Updating..." : "Adding...") : (editingPatient ? "Update Patient" : "Add Patient")}
                  </button>
                  {editingPatient && (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-600 to-gray-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-gray-500/30 active:scale-[0.99]"
                    >
                      <span className="mr-2">❌</span>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Patients List */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🏥 Patients List
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Manage all patients requiring blood transfusions
                </p>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">No patients added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.map((p) => (
                    <div key={p._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{p.patientName || p.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>🩸 Blood Group: {p.bloodGroup}</p>
                            <p>🏠 Address: {formatAddress(p.address)}</p>
                            <p>📋 MRID: {p.mrid}</p>
                            <p>📱 Phone: {p.phoneNumber}</p>
                            <p>🩸 Units Required: {p.requiredUnits || p.unitsRequired}</p>
                            <p>📅 Date Needed: {new Date(p.requiredDate || p.dateNeeded).toLocaleDateString()}</p>
                          </div>
                          {/* Donation Requests Section */}
                          {p.donationRequests && p.donationRequests.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🩸 Donation Requests:</h5>
                              <div className="space-y-2">
                                {p.donationRequests.map((request) => (
                                  <div key={request._id} className="bg-white/20 rounded-lg p-2 text-xs">
                                    <p><strong>Donor:</strong> {request.donorName}</p>
                                    <p><strong>Status:</strong> <span className={`font-semibold ${request.status === 'confirmed' ? 'text-green-600' : request.status === 'pending' ? 'text-yellow-600' : request.status === 'booked' ? 'text-blue-600' : 'text-red-600'}`}>{request.status}</span></p>
                                    {request.requestedDate && <p><strong>Date:</strong> {new Date(request.requestedDate).toLocaleDateString()}</p>}
                                    {request.requestedTime && <p><strong>Time:</strong> {request.requestedTime}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(p)}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                          >
                            <span className="mr-1">✏️</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p._id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                          >
                            <span className="mr-1">🗑️</span>
                            Delete
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

        {activeTab === 'users' && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                📅 Booked Slots
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                View and manage all confirmed booking slots
              </p>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">No bookings yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Bookings will appear here once donors book their slots</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5 hover:border-pink-300 dark:hover:border-pink-700 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                            Booking ID: {booking.bookingId}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">🎫 Token:</span>
                            <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded font-bold text-yellow-900 dark:text-yellow-200">
                              #{booking.tokenNumber || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">👤 Donor:</span>
                            <span>{booking.donorName || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">🩸 Blood Group:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">{booking.bloodGroup}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">📧 Email:</span>
                            <span className="text-xs">{booking.donorId?.userId?.email || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">📱 Phone:</span>
                            <span>{booking.donorId?.userId?.phone || booking.donorId?.contactNumber || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">📅 Date:</span>
                            <span className="font-semibold">{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">⏰ Time:</span>
                            <span className="font-semibold">{booking.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">🙋 Patient:</span>
                            <span>{booking.patientName || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">🏥 MRID:</span>
                            <span className="font-mono">{booking.patientMRID || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">📝 Requester:</span>
                            <span>{booking.requesterName || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setRescheduleModal(booking)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                              <span>📅</span>
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleConfirmBooking(booking)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                              <span>✅</span>
                              Confirm
                            </button>
                            <button
                              onClick={() => handleRejectBooking(booking)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                              <span>❌</span>
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => setRescheduleModal(booking)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            <span>📅</span>
                            Reschedule
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

        {activeTab === 'donors' && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🩸 Donors Management
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manage donor accounts and their status
              </p>
            </div>

            {/* Search Form */}
            <DonorSearchForm
              searchBloodGroup={searchBloodGroup}
              setSearchBloodGroup={setSearchBloodGroup}
              searchPlace={searchPlace}
              setSearchPlace={setSearchPlace}
              searchEmail={searchDonorEmail}
              setSearchEmail={setSearchDonorEmail}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              onClear={() => {
                setSearchBloodGroup('');
                setSearchDonorEmail('');
                setSearchPlace('');
              }}
            />

            {donors.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">No donors found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donors.map((donor) => (
                  <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>🆔 User ID: <strong>{donor.userId?._id || donor.userId}</strong></p>
                          <p>👤 Username: <strong>{donor.userId?.username}</strong></p>
                          <p>📧 Email: {donor.email}</p>
                          <p>📱 Phone: {donor.phone}</p>
                          <p>🩸 Blood Group: {donor.bloodGroup}</p>
                          <p>📍 Address: {formatAddress(donor.address)}</p>
                          <p>📅 Last Donation: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                          <p>🚫 Blocked: <span className={`font-semibold ${donor.isBlocked ? 'text-red-600' : 'text-green-600'}`}>{donor.isBlocked ? 'Yes' : 'No'}</span></p>
                          <p>⏸️ Suspended: <span className={`font-semibold ${donor.isSuspended ? 'text-yellow-600' : 'text-green-600'}`}>{donor.isSuspended ? 'Yes' : 'No'}</span></p>
                          <p>⚠️ Warning: <span className={`font-semibold ${donor.warningMessage ? 'text-orange-600' : 'text-green-600'}`}>{donor.warningMessage ? 'Yes' : 'No'}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDonorStatusChange(donor._id, 'block', !donor.isBlocked)}
                          className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${
                            donor.isBlocked
                              ? 'bg-gradient-to-r from-green-600 to-green-500'
                              : 'bg-gradient-to-r from-red-600 to-rose-500'
                          }`}
                        >
                          <span className="mr-1">{donor.isBlocked ? '✅' : '🚫'}</span>
                          {donor.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => handleDonorStatusChange(donor._id, 'suspend', !donor.isSuspended)}
                          className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${
                            donor.isSuspended
                              ? 'bg-gradient-to-r from-green-600 to-green-500'
                              : 'bg-gradient-to-r from-yellow-600 to-orange-500'
                          }`}
                        >
                          <span className="mr-1">{donor.isSuspended ? '▶️' : '⏸️'}</span>
                          {donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDonorStatusChange(donor._id, 'warn', true)}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
                          <span className="mr-1">⚠️</span>
                          Warn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'frontdesk' && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🖥️ Frontdesk Management
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Search donors by token number and manage arrivals
              </p>
            </div>

            {/* Token Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  Search by Token Number
                </h3>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter token number (e.g., 25)"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTokenSearch()}
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                  />
                  <button
                    onClick={handleTokenSearch}
                    disabled={searchingToken}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {searchingToken ? (
                      <>
                        <span className="inline-block animate-spin">⏳</span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {searchedBooking ? (
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <span className="text-3xl">✅</span>
                      Booking Found!
                    </h3>
                    <button
                      onClick={() => {
                        setSearchedBooking(null);
                        setTokenSearch('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      searchedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      searchedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      searchedBooking.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {searchedBooking.status.toUpperCase()}
                      {searchedBooking.arrived && ' - ARRIVED'}
                    </span>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🎫 Token Number</span>
                      <span className="text-2xl font-mono font-bold text-yellow-700 dark:text-yellow-400">#{searchedBooking.tokenNumber}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📋 Booking ID</span>
                      <span className="text-lg font-mono text-gray-900 dark:text-white">{searchedBooking.bookingId}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">👤 Donor Name</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{searchedBooking.donorName}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🩸 Blood Group</span>
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">{searchedBooking.bloodGroup}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📧 Email</span>
                      <span className="text-sm text-gray-900 dark:text-white">{searchedBooking.donorId?.userId?.email || 'N/A'}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📱 Phone</span>
                      <span className="text-sm text-gray-900 dark:text-white">{searchedBooking.donorId?.userId?.phone || searchedBooking.donorId?.contactNumber || 'N/A'}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📅 Appointment Date</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(searchedBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">⏰ Time</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{searchedBooking.time}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🙋 Patient Name</span>
                      <span className="text-lg text-gray-900 dark:text-white">{searchedBooking.patientName || 'N/A'}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🏥 Patient MRID</span>
                      <span className="text-lg font-mono text-gray-900 dark:text-white">{searchedBooking.patientMRID || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {searchedBooking.status !== 'completed' && searchedBooking.status !== 'rejected' && (
                    <div className="flex flex-wrap gap-3 justify-center">
                      {!searchedBooking.arrived && (
                        <button
                          onClick={handleMarkArrival}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-600 transition flex items-center gap-2 shadow-lg"
                        >
                          <span className="text-xl">✅</span>
                          Mark Arrival
                        </button>
                      )}
                      
                      {searchedBooking.arrived && (
                        <button
                          onClick={handleMarkCompletion}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 transition flex items-center gap-2 shadow-lg"
                        >
                          <span className="text-xl">🎉</span>
                          Mark Completed
                        </button>
                      )}
                      
                      <button
                        onClick={handleMarkRejection}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-600 transition flex items-center gap-2 shadow-lg"
                      >
                        <span className="text-xl">❌</span>
                        Reject
                      </button>
                    </div>
                  )}

                  {searchedBooking.status === 'completed' && (
                    <div className="text-center p-6 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                        🎉 Donation Completed!
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        Thank you for saving lives!
                      </p>
                    </div>
                  )}

                  {searchedBooking.status === 'rejected' && (
                    <div className="text-center p-6 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                        ❌ Booking Rejected
                      </p>
                      {searchedBooking.rejectionReason && (
                        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                          Reason: {searchedBooking.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎫</div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  Enter a token number to view booking details
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Donors will present their token number when they arrive
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-2xl border border-white/30 bg-white p-6 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-800">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              📅 Reschedule Booking
            </h3>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Booking ID:</strong> {rescheduleModal.bookingId}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Donor:</strong> {rescheduleModal.donorName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Current Date:</strong> {new Date(rescheduleModal.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Current Time:</strong> {rescheduleModal.time}
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Date
              </label>
              <input
                type="date"
                id="reschedule-date"
                min={new Date().toISOString().split('T')[0]}
                defaultValue={new Date(rescheduleModal.date).toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Time
              </label>
              <input
                type="time"
                id="reschedule-time"
                defaultValue={rescheduleModal.time}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const newDate = document.getElementById('reschedule-date').value;
                  const newTime = document.getElementById('reschedule-time').value;
                  if (!newDate || !newTime) {
                    alert('Please select both date and time');
                    return;
                  }
                  handleRescheduleBooking(newDate, newTime);
                }}
                disabled={rescheduling}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {rescheduling ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Rescheduling...
                  </>
                ) : (
                  <>✅ Confirm Reschedule</>
                )}
              </button>
              <button
                onClick={() => setRescheduleModal(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
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
