import React, { useState, useEffect } from "react";
import api from "../lib/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("donors");
  const [donors, setDonors] = useState([]);
  const [users, setUsers] = useState([]);
  const [bloodbanks, setBloodbanks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "donors") fetchDonors();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "bloodbanks") fetchBloodbanks();
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

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/approve`);
      alert("Bloodbank approved");
      fetchBloodbanks();
    } catch (error) {
      alert("Error approving: " + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/reject`);
      alert("Bloodbank rejected");
      fetchBloodbanks();
    } catch (error) {
      alert("Error rejecting: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white w-screen h-screen overflow-hidden text-lg">
      <header className="flex items-center justify-between p-6 w-full max-w-full glass">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-6 text-xl">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 rounded hover:bg-red-700 text-lg"
          >
            Logout
          </button>
          <div className="rounded-full bg-pink-600 w-12 h-12 flex items-center justify-center font-bold text-xl">
            A
          </div>
          <span>Admin</span>
        </div>
      </header>

      <nav className="mb-6 flex gap-4 bg-purple-700 rounded p-2 w-full max-w-full">
        <button
          className={`px-4 py-2 rounded ${activeTab === "donors" ? "bg-purple-900 font-semibold" : "bg-purple-600"}`}
          onClick={() => setActiveTab("donors")}
        >
          Donors
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "users" ? "bg-purple-900 font-semibold" : "bg-purple-600"}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "bloodbanks" ? "bg-purple-900 font-semibold" : "bg-purple-600"}`}
          onClick={() => setActiveTab("bloodbanks")}
        >
          Bloodbanks
        </button>
      </nav>

      <main className="flex-grow max-w-full mx-auto w-full p-6 overflow-auto">
        {activeTab === "donors" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Donors</h2>
            {loading ? <p>Loading...</p> : (
              donors.map((donor) => (
                <div key={donor._id} className="mb-4 p-4 bg-purple-800 rounded">
                  <p>Name: {donor.userId?.name || "N/A"}</p>
                  <p>Blood Group: {donor.bloodGroup}</p>
                  <p>Contact: {donor.contactNumber}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Users</h2>
            {loading ? <p>Loading...</p> : (
              users.map((user) => (
                <div key={user._id} className="mb-4 p-4 bg-purple-800 rounded">
                  <p>Username: {user.username}</p>
                  <p>Name: {user.name}</p>
                  <p>Email: {user.email}</p>
                  <p>Role: {user.role}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "bloodbanks" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Bloodbanks</h2>
            {loading ? <p>Loading...</p> : (
              bloodbanks.map((bb) => (
                <div key={bb._id} className="mb-4 p-4 bg-purple-800 rounded">
                  <p>Name: {bb.name}</p>
                  <p>Address: {bb.address}</p>
                  <p>Status: {bb.status}</p>
                  {bb.status === "pending" && (
                    <div className="mt-2">
                      <button onClick={() => handleApprove(bb._id)} className="bg-green-600 px-4 py-2 rounded mr-2">Approve</button>
                      <button onClick={() => handleReject(bb._id)} className="bg-red-600 px-4 py-2 rounded">Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
