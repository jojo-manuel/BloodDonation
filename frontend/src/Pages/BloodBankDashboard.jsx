import React, { useState, useEffect } from "react";
import api from "../lib/api";

export default function BloodBankDashboard() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    bloodType: "",
    contact: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch patients list on mount
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await api.get("/patients");
        if (res.data.success) setPatients(res.data.data);
      } catch (err) {
        // Handle error silently
      }
    }
    fetchPatients();
  }, []);

  // Add patient handler
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/patients", formData);
      if (res.data.success) {
        setPatients([...patients, res.data.data]);
        setFormData({ name: "", bloodType: "", contact: "", reason: "" });
      } else {
        alert(res.data.message || "Failed to add patient");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add patient");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Blood Bank Dashboard</h2>
      <form onSubmit={handleAddPatient} className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Add Patient Needing Blood</h3>
        <input
          type="text"
          placeholder="Patient Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Blood Type (e.g. A+, O-)"
          value={formData.bloodType}
          onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Reason/Notes"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Adding..." : "Add Patient"}
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-2">Patients List</h3>
      <ul className="divide-y divide-gray-300">
        {patients.length === 0 && <li className="py-2 text-gray-500">No patients added yet.</li>}
        {patients.map((p, idx) => (
          <li key={idx} className="py-2 flex flex-col">
            <span className="font-bold">{p.name}</span>
            <span>Blood Type: {p.bloodType}</span>
            <span>Contact: {p.contact}</span>
            <span>Reason: {p.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
