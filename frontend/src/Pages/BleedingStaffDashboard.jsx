import React, { useState } from "react";
import api from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function BleedingStaffDashboard() {
    const [tokenSearch, setTokenSearch] = useState('');
    const [searchedBooking, setSearchedBooking] = useState(null);
    const [searchingToken, setSearchingToken] = useState(false);
    const [bleedingData, setBleedingData] = useState({ weight: '', bagSerialNumber: '' });
    const [updatingBleeding, setUpdatingBleeding] = useState(false);
    const [bookings, setBookings] = useState([]);
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Fetch all bookings on mount
    React.useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get(`/bloodbank/bookings`);
                if (res.data.success) {
                    setBookings(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching bookings:", err);
            }
        };
        fetchBookings();
    }, []);

    const handleTokenSearchWithToken = async (token) => {
        if (!token) return;
        setSearchingToken(true);
        try {
            const res = await api.get(`/bloodbank/bookings/token/${token}`);
            if (res.data.success) {
                setSearchedBooking(res.data.data);
                setBleedingData({
                    weight: res.data.data.weight || '',
                    bagSerialNumber: res.data.data.bagSerialNumber || ''
                });
            } else {
                showToast('Booking not found', 'error');
                setSearchedBooking(null);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Booking not found', 'error');
            setSearchedBooking(null);
        } finally {
            setSearchingToken(false);
        }
    };

    const handleTokenSearch = () => {
        handleTokenSearchWithToken(tokenSearch);
    };

    const handleBleedingComplete = async () => {
        if (!searchedBooking) return;
        if (!bleedingData.weight || !bleedingData.bagSerialNumber) {
            showToast('Please enter both Weight and Bag Serial Number', 'warning');
            return;
        }

        setUpdatingBleeding(true);
        try {
            const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
                status: 'completed',
                weight: bleedingData.weight,
                bagSerialNumber: bleedingData.bagSerialNumber
            });

            if (res.data.success) {
                setSearchedBooking(res.data.data); // Update view with new data
                showToast('Donation completed and verified successfully! 🎉', 'success');
                // Clear search after a moment to allow next donor? Or keep it? 
                // Keeping it is better for feedback. User can clear manually or search new token.
            }
        } catch (err) {
            console.error("Failed to complete bleeding", err);
            showToast(err.response?.data?.message || "Failed to update details", 'error');
        } finally {
            setUpdatingBleeding(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/staff-login"); // Redirect to staff login
    };

    return (
        <Layout>
            <div className="min-h-screen py-8">
                <div className="flex justify-between items-center mb-8 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span>💉</span> Bleeding Room Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 ml-11">
                            Welcome, {localStorage.getItem('username') || 'Staff'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-lg"
                    >
                        Logout
                    </button>
                </div>

                {/* Search Section */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">🔎</span>
                            Scan Donor Token
                        </h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Enter Token Number (e.g. T-123)"
                                value={tokenSearch}
                                onChange={(e) => setTokenSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleTokenSearch()}
                                className="flex-1 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-5 py-4 text-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono tracking-wider"
                                autoFocus
                            />
                            <button
                                onClick={handleTokenSearch}
                                disabled={searchingToken}
                                className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-pink-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {searchingToken ? 'Scanning...' : 'Search'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Today's Queue Section */}
                <div className="max-w-4xl mx-auto mb-12">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2">All Booked Slots</h3>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
                        {bookings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-bold">
                                        <tr>
                                            <th className="px-6 py-3">Token</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {bookings.map((b) => (
                                            <tr key={b._id} className="hover:bg-white/80 dark:hover:bg-gray-700/80 transition">
                                                <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {b.tokenNumber || '-'}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {b.donorName}
                                                    <span className="ml-2 text-xs text-red-500 font-bold border border-red-200 px-1 rounded">{b.bloodGroup}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        b.status === 'arrived' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.date).toLocaleDateString()} {b.time}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setTokenSearch(b.tokenNumber || '');
                                                            if (b.tokenNumber) handleTokenSearchWithToken(b.tokenNumber);
                                                        }}
                                                        className="text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 px-3 py-1 rounded text-gray-800 dark:text-white transition"
                                                    >
                                                        Select
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No booked slots found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                {searchedBooking && (
                    <div className="max-w-4xl mx-auto animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 flex justify-between items-center border-b border-gray-700">
                                <div className="flex items-center gap-6">
                                    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-mono font-bold text-2xl shadow-lg border border-yellow-200">
                                        #{searchedBooking.tokenNumber}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-1">{searchedBooking.donorName}</h2>
                                        <p className="text-gray-400 font-mono text-sm">ID: {searchedBooking.bookingId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-4xl font-extrabold ${searchedBooking.bloodGroup.includes('+') ? 'text-red-500' : 'text-orange-500'
                                        }`}>
                                        {searchedBooking.bloodGroup}
                                    </div>
                                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider mt-1">Blood Group</div>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Info */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-gray-500 dark:text-gray-400 font-bold uppercase text-xs tracking-wider mb-2">Patient Details</h3>
                                            <p className="text-xl font-medium text-gray-900 dark:text-white">
                                                {searchedBooking.patientName || 'General Instock Donation'}
                                            </p>
                                            {searchedBooking.patientMRID && (
                                                <p className="text-sm text-gray-500 mt-1 font-mono">MRID: {searchedBooking.patientMRID}</p>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-gray-500 dark:text-gray-400 font-bold uppercase text-xs tracking-wider mb-2">Current Status</h3>
                                            <div className="flex items-center gap-3">
                                                <span className={`h-4 w-4 rounded-full ${searchedBooking.status === 'completed' ? 'bg-green-500' :
                                                    searchedBooking.status === 'arrived' ? 'bg-blue-500' : 'bg-yellow-500'
                                                    }`}></span>
                                                <span className="text-xl font-bold capitalize text-gray-900 dark:text-white">
                                                    {searchedBooking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Comparison & Action */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                                                    ⚖️ Donor Weight (kg)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={bleedingData.weight}
                                                    onChange={(e) => setBleedingData({ ...bleedingData, weight: e.target.value })}
                                                    disabled={searchedBooking.status === 'completed'}
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-2xl font-bold text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                                                    placeholder="0.0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                                                    👜 Bag Serial Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bleedingData.bagSerialNumber}
                                                    onChange={(e) => setBleedingData({ ...bleedingData, bagSerialNumber: e.target.value })}
                                                    disabled={searchedBooking.status === 'completed'}
                                                    className="w-full px-5 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-2xl font-mono font-bold text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                                                    placeholder="SCAN-BAG-001"
                                                />
                                            </div>
                                        </div>

                                        {searchedBooking.status !== 'completed' ? (
                                            <button
                                                onClick={handleBleedingComplete}
                                                disabled={updatingBleeding}
                                                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-xl shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:grayscale"
                                            >
                                                {updatingBleeding ? 'Verifying & Saving...' : '✅ Verify & Complete Donation'}
                                            </button>
                                        ) : (
                                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                                <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                                                    Donation Completed Successfully!
                                                </p>
                                                <p className="text-green-600/70 dark:text-green-400/70 text-sm mt-1">
                                                    Data recorded in system.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}