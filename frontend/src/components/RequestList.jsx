import React from 'react';

export default function RequestList({ requests, onAccept, onReject, isDonorView, currentUser }) {
  if (!requests || requests.length === 0) {
    return <p className="text-center text-gray-600 dark:text-gray-400">No requests found.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p><strong>From:</strong> {isDonorView ? req.requesterId?.username || 'N/A' : req.donorId?.userId?.username || 'N/A'}</p>
              <p><strong>Message:</strong> {req.message}</p>
              <p><strong>Status:</strong> {req.status || 'Pending'}</p>
              <p><strong>Requested At:</strong> {new Date(req.createdAt).toLocaleString()}</p>
              <p><strong>Heading:</strong> {req.donorId?.userId?.name || 'N/A'}</p>
              <p><strong>Phone Number:</strong> {req.requesterId?.phone || 'N/A'}</p>
              <p><strong>Requested By:</strong> {req.requesterId?.name || 'N/A'}</p>
              <p><strong>Blood Bank:</strong> {req.patientId?.bloodBankId?.name || 'N/A'}</p>
            </div>
            {isDonorView && req.status === 'Pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAccept(req._id)}
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => onReject(req._id)}
                  className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
