import { useEffect, useState } from "react";
import axios from "axios";

export default function DonorDashboard({ donorId }) {
  const [requests, setRequests] = useState([]);
  const [donor, setDonor] = useState(null);
  const [slotDate, setSlotDate] = useState("");

  // Fetch donor info & requests
  const fetchData = async () => {
    const resRequests = await axios.get(`http://localhost:5000/api/requests/donor/${donorId}`);
    setRequests(resRequests.data);

    const resDonor = await axios.get(`http://localhost:5000/api/donors/${donorId}`);
    setDonor(resDonor.data);
  };

  useEffect(() => {
    fetchData();
  }, [donorId]);

  // Update donation status
  const updateStatus = async (requestId, status) => {
    await axios.put(`http://localhost:5000/api/requests/${requestId}/status`, { status });
    fetchData();
  };

  // Book donation slot
  const bookSlot = async (requestId) => {
    if (!slotDate) return alert("Please select a date!");
    await axios.put(`http://localhost:5000/api/requests/${requestId}/slot`, { slotDate });
    setSlotDate("");
    fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Donor Profile */}
      {donor && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">Welcome, {donor.name}</h2>
          <p><b>Blood Group:</b> {donor.bloodGroup}</p>
          <p><b>Location:</b> {donor.location}</p>
          <p><b>Next Donation Possible:</b> {donor.nextDonationDate || "Available now"}</p>
        </div>
      )}

      {/* Requests Section */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Donation Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No requests yet.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li key={req._id} className="p-4 border rounded shadow">
                <p><b>Requester:</b> {req.userName}</p>
                <p><b>Location:</b> {req.location}</p>
                <p><b>Status:</b> {req.status}</p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => updateStatus(req._id, "can donate")}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Can Donate
                  </button>
                  <button 
                    onClick={() => updateStatus(req._id, "cannot donate")}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Cannot Donate
                  </button>
                </div>
                <div className="mt-3">
                  <input 
                    type="date" 
                    value={slotDate} 
                    onChange={(e) => setSlotDate(e.target.value)} 
                    className="border p-2 rounded mr-2"
                  />
                  <button 
                    onClick={() => bookSlot(req._id)}
                    className="bg-blue-600 text-white px-4 py-1 rounded"
                  >
                    Book Slot
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
