import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function DonorDashboard() {
  const [availability, setAvailability] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch donation requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/donation-requests");
      if (res.data.success) {
        setRequests(res.data.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAvailabilityToggle = async () => {
    setLoading(true);
    try {
      const res = await api.put("/donors/availability", { available: !availability });
      if (res.data.success) {
        setAvailability(!availability);
      } else {
        alert("Failed to update availability");
      }
    } catch (err) {
      alert("Failed to update availability");
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (id) => {
    setLoading(true);
    try {
      const res = await api.post(`/donation-requests/${id}/accept`);
      if (res.data.success) {
        fetchRequests();
      } else {
        alert("Failed to accept request");
      }
    } catch (err) {
      alert("Failed to accept request");
    }
    setLoading(false);
  };

  const handleDeclineRequest = async (id) => {
    setLoading(true);
    try {
      const res = await api.post(`/donation-requests/${id}/decline`);
      if (res.data.success) {
        fetchRequests();
      } else {
        alert("Failed to decline request");
      }
    } catch (err) {
      alert("Failed to decline request");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="glass-card p-6 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">Availability Status</h3>
            <p className="text-gray-300">You are currently {availability ? "available" : "unavailable"} for donations</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${availability ? "text-green-400" : "text-gray-400"}`}>
              {availability ? "Available" : "Unavailable"}
            </span>
            <label className="switch">
              <input type="checkbox" checked={availability} onChange={handleAvailabilityToggle} disabled={loading} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="mb-4 flex gap-4">
          <button
            className={`px-4 py-2 rounded-md font-semibold ${activeTab === "requests" ? "bg-gray-700 text-white" : "bg-gray-600 text-gray-300"}`}
            onClick={() => setActiveTab("requests")}
          >
            Donation Requests
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold ${activeTab === "bookings" ? "bg-gray-700 text-white" : "bg-gray-600 text-gray-300"}`}
            onClick={() => setActiveTab("bookings")}
            disabled
          >
            My Bookings
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold ${activeTab === "reviews" ? "bg-gray-700 text-white" : "bg-gray-600 text-gray-300"}`}
            onClick={() => setActiveTab("reviews")}
            disabled
          >
            Reviews
          </button>
        </div>

        {activeTab === "requests" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">Donation Requests</h2>
            {loading ? (
              <p className="text-gray-300">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-gray-400">No donation requests at the moment.</p>
            ) : (
              requests.map((request) => (
                <div key={request._id} className="glass-card p-4 mb-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{request.hospitalName}</h3>
                      <p className="text-sm text-gray-400">
                        Patient: {request.patientName} &nbsp;|&nbsp; Location: {request.hospitalLocation}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        request.priority === "High" ? "bg-red-600" :
                        request.priority === "Medium" ? "bg-yellow-600" : "bg-gray-600"
                      }`}
                    >
                      {request.priority} Priority
                    </span>
                  </div>
                  <div className="mb-2">
                    <p><span className="font-semibold">Blood Type Required:</span> <span className="text-red-400">{request.bloodType}</span></p>
                    <p><span className="font-semibold">Request Date:</span> {new Date(request.requestDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Additional Notes:</span> {request.notes || "None"}</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold transition"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request._id)}
                      disabled={loading}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-semibold transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="text-gray-400">My Bookings feature coming soon.</div>
        )}

        {activeTab === "reviews" && (
          <div className="text-gray-400">Reviews feature coming soon.</div>
        )}
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 42px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #4ade80;
        }
        input:checked + .slider:before {
          transform: translateX(18px);
        }
      `}</style>
    </Layout>
  );
}
