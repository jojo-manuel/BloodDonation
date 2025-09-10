import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("donors");
  const [donors, setDonors] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [bloodbanks, setBloodbanks] = useState([]);
  const [pendingBloodbanks, setPendingBloodbanks] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "donors") fetchDonors();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "admins") fetchAdmins();
    else if (activeTab === "bloodbanks") fetchBloodbanks();
    else if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    else if (activeTab === "patients") fetchPatients();
  }, [activeTab]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/donors");
      if (data.success) setDonors(data.data);
    } catch (error) {
      alert("Error fetching donors: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      if (data.success) setUsers(data.data);
    } catch (error) {
      alert("Error fetching users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/admins");
      if (data.success) setAdmins(data.data);
    } catch (error) {
      alert("Error fetching admins: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodbanks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/bloodbanks");
      if (data.success) setBloodbanks(data.data);
    } catch (error) {
      alert("Error fetching bloodbanks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBloodbanks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/bloodbanks");
      console.log("All bloodbanks data:", data.data);
      if (data.success) {
        const pending = data.data.filter(bb => bb.status === "pending");
        console.log("Filtered pending bloodbanks:", pending);
        setPendingBloodbanks(pending);
      }
    } catch (error) {
      console.log("Error fetching pending bloodbanks:", error);
      alert("Error fetching pending bloodbanks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/patients");
      if (data.success) setPatients(data.data);
    } catch (error) {
      alert("Error fetching patients: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/approve`);
      alert("Bloodbank approved");
      fetchBloodbanks();
      if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    } catch (error) {
      alert("Error approving: " + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/reject`);
      alert("Bloodbank rejected");
      fetchBloodbanks();
      if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    } catch (error) {
      alert("Error rejecting: " + error.message);
    }
  };

  const handleSetStatus = async (type, id, status) => {
    const { isBlocked, isSuspended, warningMessage } = status;
    try {
      await api.put(`/admin/${type}/${id}/status`, { isBlocked, isSuspended, warningMessage });
      alert(`${type} status updated`);
      if (type === "donors") fetchDonors();
      else if (type === "users") fetchUsers();
      else if (type === "bloodbanks") fetchBloodbanks();
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Layout>
      <div className="flex justify-center mb-6">
      <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("donors")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "donors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Donors
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "users" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "admins" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => setActiveTab("bloodbanks")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "bloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          All Blood Banks
        </button>
        <button
          onClick={() => setActiveTab("pendingBloodbanks")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "pendingBloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Pending Blood Banks
        </button>
        <button
          onClick={() => setActiveTab("patients")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "patients" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Patients
        </button>
      </div>
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
        {activeTab === "donors" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🩸 All Donors
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manage donor registrations and information
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading donors...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donors.map((donor) => (
                  <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {donor.userId?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Blood Group: {donor.bloodGroup} | Contact: {donor.contactNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {donor.isBlocked ? 'Blocked' : donor.isSuspended ? 'Suspended' : 'Active'} | Warning: {donor.warningMessage || 'None'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSetStatus('donors', donor._id, { isBlocked: !donor.isBlocked, isSuspended: donor.isSuspended, warningMessage: donor.warningMessage })}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
                          {donor.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => handleSetStatus('donors', donor._id, { isBlocked: donor.isBlocked, isSuspended: !donor.isSuspended, warningMessage: donor.warningMessage })}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-600 to-orange-500 px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
                          {donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => {
                            const message = prompt('Enter warning message:');
                            if (message !== null) handleSetStatus('donors', donor._id, { isBlocked: donor.isBlocked, isSuspended: donor.isSuspended, warningMessage: message });
                          }}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
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
        {activeTab === "users" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                👥 All Users
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manage user accounts and roles
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email} | Role: {user.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "admins" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                👨‍💼 All Admins
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                View all admin accounts
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading admins...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {admin.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {admin.email} | Role: {admin.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "bloodbanks" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🏥 All Blood Banks
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Approve or reject blood bank registrations
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading blood banks...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bloodbanks.map((bb) => (
                  <div key={bb._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {bb.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bb.address} | Status: {bb.status}
                        </p>
                      </div>
                      {bb.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(bb._id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(bb._id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "pendingBloodbanks" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🏥 Pending Blood Bank Approvals
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Review and approve blood bank registration requests
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading pending blood banks...</p>
              </div>
            ) : pendingBloodbanks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No pending blood bank approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBloodbanks.map((bb) => (
                  <div key={bb._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {bb.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bb.address} | District: {bb.district}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Contact: {bb.contactNumber} | License: {bb.licenseNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: <span className="text-yellow-600 font-semibold">Pending Approval</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(bb._id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(bb._id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "patients" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                🏥 All Patients
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                View all patient records across all blood banks
              </p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading patients...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Blood Group: {patient.bloodGroup} | MRID: {patient.mrid} | Units Required: {patient.unitsRequired}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Address: {patient.address} | Date Needed: {new Date(patient.dateNeeded).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Blood Bank: {patient.bloodBankId?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
    </Layout>
  );
}
