// Update for UserDashboard.jsx - Enhanced Blood Bank Display
// Add these changes to make blood bank name more prominent

// Change 1: Update the column header to be more prominent (around line 845)
<th className="px-2 py-1 font-semibold text-pink-600 dark:text-pink-400">🏥 Blood Bank</th>

// Change 2: Update the blood bank cell display (line 862)
// REPLACE:
<td className="px-2 py-1">{request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'N/A'}</td>

// WITH:
<td className="px-2 py-1">
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
    🏥 {request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'N/A'}
  </span>
</td>

// Change 3: Update received requests blood bank display (line 928)
// REPLACE:
<td className="px-2 py-1">{request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'N/A'}</td>

// WITH:
<td className="px-2 py-1">
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
    🏥 {request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'N/A'}
  </span>
</td>

// Change 4: Add blood bank prominently in the request details modal (around line 1120)
// Add this in the modal content:
<div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800">
  <h4 className="font-semibold text-pink-800 dark:text-pink-200 mb-2 flex items-center gap-2">
    <span className="text-2xl">🏥</span>
    Blood Bank Issuing This Request
  </h4>
  <p className="text-lg font-bold text-pink-900 dark:text-pink-100">
    {selectedRequest.bloodBankId?.name || selectedRequest.bloodBankName || selectedRequest.bloodBankUsername || 'Not specified'}
  </p>
  {selectedRequest.bloodBankId?.address && (
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      📍 {selectedRequest.bloodBankId.address}
    </p>
  )}
</div>

// Change 5: Add blood bank info in booking modal (around line 1250)
// Add before the date/time selection:
<div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
  <div className="flex items-center gap-3 mb-2">
    <span className="text-3xl">🏥</span>
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-gray-200">Blood Bank</h4>
      <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
        {bookingModal.bloodBankId?.name || bookingModal.bloodBankName || 'Not specified'}
      </p>
    </div>
  </div>
  {bookingModal.bloodBankId?.address && (
    <p className="text-sm text-gray-600 dark:text-gray-400">
      📍 {bookingModal.bloodBankId.address}
    </p>
  )}
  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
    This is where you'll donate blood
  </p>
</div>

