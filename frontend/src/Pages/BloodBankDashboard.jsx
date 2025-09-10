import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function BloodBankDashboard() {
  const [patients, setPatients] = useState([]);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    address: "",
    bloodGroup: "",
    mrid: "",
    requiredUnits: "",
    requiredDate: "",
  });
  const [loading, setLoading] = useState(false);

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
  }, []);

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
        requiredUnits: Number(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      });
      if (res.data.success) {
        setPatients([...patients, res.data.patient || res.data.data]);
        setFormData({
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
      address: patient.address || "",
      bloodGroup: patient.bloodGroup || "",
      mrid: patient.mrid || "",
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
      address: "",
      bloodGroup: "",
      mrid: "",
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
          <button className="px-6 py-2 rounded-full font-semibold bg-pink-600 text-white">
            🏥 Manage Patients
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
                  required
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address</label>
                <input
                  type="text"
                  placeholder="Enter patient address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                />
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
                        <p>🏠 Address: {p.address}</p>
                        <p>📋 MRID: {p.mrid}</p>
                        <p>🩸 Units Required: {p.requiredUnits || p.unitsRequired}</p>
                        <p>📅 Date Needed: {new Date(p.requiredDate || p.dateNeeded).toLocaleDateString()}</p>
                      </div>
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
      </div>

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
