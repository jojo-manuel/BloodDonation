import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function TaxiBookingModal({ donationRequest, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fareData, setFareData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    bookingDate: '',
    bookingTime: '',
    notes: ''
  });

  // Fetch fare calculation on mount
  useEffect(() => {
    if (donationRequest?._id) {
      calculateFare();
    }
  }, [donationRequest]);

  const calculateFare = async () => {
    try {
      setLoading(true);
      const res = await api.post('/taxi/calculate-fare', {
        donationRequestId: donationRequest._id
      });
      
      if (res.data.success) {
        setFareData(res.data.data);
        
        // Auto-populate booking date and suggested pickup time
        if (res.data.data.donationDate) {
          setBookingDetails(prev => ({
            ...prev,
            bookingDate: res.data.data.donationDate,
            bookingTime: res.data.data.suggestedPickupTime || ''
          }));
        }
      }
    } catch (error) {
      console.error('Fare calculation error:', error);
      alert('Failed to calculate fare: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBookTaxi = async () => {
    if (!bookingDetails.bookingDate || !bookingDetails.bookingTime) {
      alert('Please select date and time for pickup');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create Razorpay order
      const orderRes = await api.post('/taxi/create-order', {
        donationRequestId: donationRequest._id,
        amount: fareData.distance.totalFare,
        bookingDate: bookingDetails.bookingDate,
        bookingTime: bookingDetails.bookingTime
      });

      if (!orderRes.data.success) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, key } = orderRes.data.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Blood Donation Taxi Service',
        description: `Taxi for ${fareData.donorName}`,
        order_id: orderId,
        handler: async function (response) {
          // Step 3: Verify payment and create booking
          try {
            const verifyRes = await api.post('/taxi/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingData: {
                donorId: donationRequest.donorId?._id || donationRequest.donorId,
                donationRequestId: donationRequest._id,
                bloodBankId: donationRequest.bloodBankId?._id || donationRequest.bloodBankId,
                pickupAddress: fareData.donorAddress,
                dropAddress: fareData.bloodBankAddress,
                pickupLocation: fareData.pickupLocation,
                dropLocation: fareData.dropLocation,
                distanceKm: fareData.distance.distanceKm,
                baseFare: fareData.distance.baseFare,
                perKmRate: fareData.distance.perKmRate,
                totalFare: fareData.distance.totalFare,
                bookingDate: bookingDetails.bookingDate,
                bookingTime: bookingDetails.bookingTime,
                donorName: fareData.donorName,
                donorPhone: fareData.donorPhone,
                notes: bookingDetails.notes
              }
            });

            if (verifyRes.data.success) {
              alert('✅ Taxi booked successfully!');
              onSuccess && onSuccess(verifyRes.data.data);
              onClose();
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            alert('Payment successful but booking failed. Please contact support.');
          }
        },
        prefill: {
          name: fareData?.donorName || '',
          contact: fareData?.donorPhone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to initiate payment: ' + (error.response?.data?.message || 'Unknown error'));
      setLoading(false);
    }
  };

  if (!donationRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🚖</span>
              Book Taxi for Donor
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && !fareData ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Calculating fare...</p>
            </div>
          ) : fareData ? (
            <div className="space-y-6">
              {/* Donor Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
                  👤 Donor Information
                </h3>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p><span className="font-semibold">Name:</span> {fareData.donorName}</p>
                  <p><span className="font-semibold">Phone:</span> {fareData.donorPhone}</p>
                </div>
              </div>

              {/* Pickup & Drop Locations */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-3">
                  📍 Journey Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      🏠 Pickup Address:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {fareData.donorAddress}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-2xl">⬇️</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      🏥 Drop Address ({fareData.bloodBankName}):
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {fareData.bloodBankAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
                <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100 mb-3">
                  💰 Fare Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Distance:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {fareData.distance.distanceKm} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Estimated Travel Time:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      ~{fareData.estimatedTravelMinutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Base Fare:</span>
                    <span className="text-gray-900 dark:text-white">
                      ₹{fareData.distance.baseFare}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Distance Fare ({fareData.distance.perKmRate}/km):
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      ₹{fareData.distance.distanceFare}
                    </span>
                  </div>
                  <div className="border-t-2 border-yellow-300 dark:border-yellow-700 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-yellow-900 dark:text-yellow-100">Total Fare:</span>
                      <span className="text-green-600 dark:text-green-400">
                        ₹{fareData.distance.totalFare}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-3">
                  📅 Schedule Pickup
                </h3>
                
                {fareData.donationDate && fareData.donationTime && (
                  <div className={`mb-3 p-3 rounded-lg ${
                    fareData.isBookedSlot 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      fareData.isBookedSlot 
                        ? 'text-green-900 dark:text-green-200' 
                        : 'text-blue-900 dark:text-blue-200'
                    }`}>
                      {fareData.isBookedSlot ? '✅ Confirmed Slot' : 'ℹ️ Requested Appointment'}
                    </p>
                    <p className={`text-sm ${
                      fareData.isBookedSlot 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      📅 {new Date(fareData.donationDate).toLocaleDateString()} at ⏰ {fareData.donationTime}
                    </p>
                    <p className={`text-xs mt-1 ${
                      fareData.isBookedSlot 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {fareData.isBookedSlot 
                        ? `💡 Pickup calculated for confirmed slot (~${fareData.estimatedTravelMinutes} min travel + 15 min buffer)`
                        : `💡 Pickup time based on requested appointment (~${fareData.estimatedTravelMinutes} min travel + 15 min buffer)`
                      }
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Pickup Date * {fareData.isBookedSlot ? '(From confirmed slot)' : '(From requested date)'}
                    </label>
                    <input
                      type="date"
                      value={bookingDetails.bookingDate}
                      onChange={(e) => setBookingDetails({...bookingDetails, bookingDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Pickup Time * (Auto-calculated at 50 km/h)
                    </label>
                    <input
                      type="time"
                      value={bookingDetails.bookingTime}
                      onChange={(e) => setBookingDetails({...bookingDetails, bookingTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    {fareData.suggestedPickupTime && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        💡 Suggested: {fareData.suggestedPickupTime} (Travel: {fareData.estimatedTravelMinutes} min + Buffer: 15 min)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={bookingDetails.notes}
                      onChange={(e) => setBookingDetails({...bookingDetails, notes: e.target.value})}
                      placeholder="Any special instructions for the driver..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookTaxi}
                  disabled={loading || !bookingDetails.bookingDate || !bookingDetails.bookingTime}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      Pay ₹{fareData.distance.totalFare} & Book
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Failed to load booking details. Please try again.
              </p>
              <button
                onClick={calculateFare}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

