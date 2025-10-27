import React from 'react';

export default function RescheduleNotificationModal({ notifications, onClose, onMarkAsRead }) {
  if (!notifications || notifications.length === 0) return null;

  const handleAcknowledge = async (notificationId) => {
    await onMarkAsRead(notificationId);
  };

  const handleAcknowledgeAll = async () => {
    for (const notification of notifications) {
      await onMarkAsRead(notification._id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl animate-bounce">⚠️</span>
                Slot Rescheduled
              </h2>
              <p className="text-sm opacity-90 mt-1">
                Your donation appointment has been rescheduled
              </p>
            </div>
            {notifications.length > 1 && (
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                {notifications.length} {notifications.length === 1 ? 'Update' : 'Updates'}
              </span>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 space-y-4">
          {notifications.map((notification, index) => (
            <div
              key={notification._id}
              className="border-2 border-orange-200 dark:border-orange-800 rounded-xl p-5 bg-orange-50 dark:bg-orange-900/20"
            >
              {/* Notification Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reschedule Details */}
              {notification.rescheduleData && (
                <div className="space-y-4">
                  {/* Blood Bank & Patient Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Blood Bank</p>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <span>🏥</span> {notification.rescheduleData.bloodBankName}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Patient</p>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <span>👤</span> {notification.rescheduleData.patientName}
                      </p>
                    </div>
                  </div>

                  {/* Old Slot */}
                  <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                      <span className="text-lg">❌</span> Previous Slot (Cancelled)
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-red-700 dark:text-red-400 font-medium">Date:</p>
                        <p className="text-red-900 dark:text-red-200 font-bold">
                          {new Date(notification.rescheduleData.oldDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-red-700 dark:text-red-400 font-medium">Time:</p>
                        <p className="text-red-900 dark:text-red-200 font-bold">
                          {notification.rescheduleData.oldTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-6 py-2 font-bold flex items-center gap-2 shadow-lg">
                      <span className="text-xl">↓</span>
                      <span>RESCHEDULED TO</span>
                      <span className="text-xl">↓</span>
                    </div>
                  </div>

                  {/* New Slot */}
                  <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                      <span className="text-lg">✅</span> New Slot (Confirmed)
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-green-700 dark:text-green-400 font-medium">Date:</p>
                        <p className="text-green-900 dark:text-green-200 font-bold text-lg">
                          {new Date(notification.rescheduleData.newDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700 dark:text-green-400 font-medium">Time:</p>
                        <p className="text-green-900 dark:text-green-200 font-bold text-lg">
                          {notification.rescheduleData.newTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  {notification.rescheduleData.reason && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        📝 Reason for Reschedule:
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {notification.rescheduleData.reason}
                      </p>
                    </div>
                  )}

                  {/* Important Notice */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      ⚠️ Important:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                      <li>• Please arrive <strong>15 minutes before</strong> your scheduled time</li>
                      <li>• Bring a valid ID and your booking confirmation</li>
                      <li>• Contact the blood bank if you cannot attend</li>
                      <li>• Check your email for the confirmation</li>
                    </ul>
                  </div>

                  {/* Acknowledge Button for Individual Notification */}
                  {notifications.length === 1 && (
                    <button
                      onClick={() => handleAcknowledge(notification._id)}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg"
                    >
                      <span>✓</span>
                      I Acknowledge - Close
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        {notifications.length > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl sticky bottom-0">
            <div className="flex gap-3">
              <button
                onClick={handleAcknowledgeAll}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold flex items-center justify-center gap-2 transition shadow-lg"
              >
                <span>✓</span>
                Acknowledge All & Close
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-semibold transition"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

