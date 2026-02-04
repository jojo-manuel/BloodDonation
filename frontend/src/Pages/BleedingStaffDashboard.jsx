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
    const [filterDate, setFilterDate] = useState('');

    // Inventory & Billing State
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [billBookingDetails, setBillBookingDetails] = useState(null);
    const [billForm, setBillForm] = useState({
        tokenNumber: '',
        patientName: '',
        patientId: '',
        price: '',
        notes: ''
    });

    const { showToast } = useToast();
    const navigate = useNavigate();

    // Fetch data on mount
    React.useEffect(() => {
        fetchBookings();
        fetchInventory();
    }, []);

    // Refetch when filterDate changes
    React.useEffect(() => {
        fetchBookings();
    }, [filterDate]);

    const fetchBookings = async () => {
        try {
            let url = `/bloodbank/bookings`;
            if (filterDate) {
                url += `?date=${filterDate}`;
            }
            const res = await api.get(url);
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoadingInventory(true);
            // Fetch from store-manager endpoint to get all available inventory
            const res = await api.get('/store-manager/inventory?status=available');
            if (res.data.success) {
                setInventory(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
            // Try fallback to store-staff endpoint
            try {
                const fallbackRes = await api.get('/store-staff/inventory?includeAllocated=true');
                if (fallbackRes.data.success) {
                    setInventory(fallbackRes.data.data);
                }
            } catch (fallbackErr) {
                console.error("Fallback inventory fetch also failed:", fallbackErr);
                showToast("Failed to load inventory", "error");
            }
        } finally {
            setLoadingInventory(false);
        }
    };

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
                fetchBookings(); // Refresh bookings list
            }
        } catch (err) {
            console.error("Failed to complete bleeding", err);
            showToast(err.response?.data?.message || "Failed to update details", 'error');
        } finally {
            setUpdatingBleeding(false);
        }
    };

    // Inventory Billing Functions
    const handleTokenSearchForBill = async (tokenOverride) => {
        const tokenToSearch = (typeof tokenOverride === 'string') ? tokenOverride : billForm.tokenNumber;
        if (!tokenToSearch) return;

        try {
            const response = await api.get(`/store-staff/bookings/token/${tokenToSearch}`);
            if (response.data.success) {
                // Determine the best available name
                const bestName = response.data.data.patientName ||
                    (response.data.data.meta && response.data.data.meta.patientName) ||
                    response.data.data.requesterName ||
                    (response.data.data.meta && response.data.data.meta.requesterName) ||
                    response.data.data.donorName ||
                    (response.data.data.donorId && response.data.data.donorId.name) || '';

                setBillForm(prev => ({
                    ...prev,
                    patientName: bestName,
                    patientId: response.data.data.patientMRID || ''
                }));
                // Set full details for display
                setBillBookingDetails({
                    donor: response.data.data.donorDetails,
                    patient: response.data.data.patientDetails
                });
                showToast("Booking details found!", "success");
            }
        } catch (err) {
            console.error('Token search error:', err);
            showToast('Booking not found', 'error');
        }
    };

    const handleBillItem = async (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        try {
            // Using store-staff endpoint
            const response = await api.put(`/store-staff/inventory/${selectedItem._id}/bill`, billForm);
            if (response.data.success) {
                showToast("Item billed successfully", "success");
                setShowBillModal(false);
                setSelectedItem(null);
                setBillForm({ tokenNumber: '', patientName: '', patientId: '', price: '', notes: '' });
                fetchInventory(); // Refresh inventory
            }
        } catch (err) {
            console.error('Bill item error:', err);
            showToast(err.response?.data?.message || "Failed to bill item", 'error');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/staff-login"); // Redirect to staff login
    };

    const setTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        setFilterDate(today);
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
                <div className="max-w-4xl mx-auto mb-12">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {/* Today's Queue Section */}
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-4 px-2">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Booked Slots</h3>
                            <div className="flex gap-3 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Filter Date</label>
                                    <input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={setTodayFilter}
                                    className="h-[38px] px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-sm font-bold transition flex items-center gap-2 mt-auto"
                                >
                                    📅 Show Today
                                </button>
                                {filterDate && (
                                    <button
                                        onClick={() => setFilterDate('')}
                                        className="h-[38px] px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm underline mt-auto"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
                            {bookings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-bold">
                                            <tr>
                                                <th className="px-6 py-3">Token</th>
                                                <th className="px-6 py-3">Date/Time</th>
                                                <th className="px-6 py-3">Donor</th>
                                                <th className="px-6 py-3">Patient</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {bookings.map((b) => (
                                                <tr key={b._id} className="hover:bg-white/80 dark:hover:bg-gray-700/80 transition">
                                                    <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {b.tokenNumber || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div>{new Date(b.date).toLocaleDateString()}</div>
                                                        <div className="text-xs">{b.time}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {b.donorName}
                                                        <span className="ml-2 text-xs text-red-500 font-bold border border-red-200 px-1 rounded">{b.bloodGroup}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        <div>{b.patientName || '-'}</div>
                                                        {b.patientMRID && <div className="text-xs font-mono text-gray-500">{b.patientMRID}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            b.status === 'arrived' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
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


                    {/* Inventory & Purchase Section */}
                    <div className="w-full mb-12">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2 flex justify-between items-center">
                            <span>Available Inventory for Purchase</span>
                            <button onClick={fetchInventory} className="text-sm text-blue-500 hover:text-blue-700">Refresh</button>
                        </h3>

                        {/* Info Banner */}
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">ℹ️</span>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How to Purchase Inventory</h4>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                        <li><strong>🎫 With Booking:</strong> Search for a patient's token above, then click "Bill to Patient" to auto-fill their details</li>
                                        <li><strong>💰 Direct Purchase:</strong> Click "Buy Now" and manually enter patient name and details</li>
                                    </ul>
                                </div>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inventory.length > 0 ? (
                                inventory.map(item => (
                                    <div key={item._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                {item.itemName && (
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.itemName}</h4>
                                                )}
                                                {item.bloodGroup ? (
                                                    <span className={`px-2 py-1 rounded text-lg font-bold ${item.bloodGroup.includes('+') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {item.bloodGroup}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-sm font-bold bg-gray-100 text-gray-700">
                                                        General Item
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1 capitalize">{item.donationType?.replace('_', ' ')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        // Auto-fill from searched booking if available
                                                        if (searchedBooking) {
                                                            // Determine the best available name
                                                            const bestName = searchedBooking.patientName ||
                                                                (searchedBooking.meta && searchedBooking.meta.patientName) ||
                                                                searchedBooking.requesterName ||
                                                                (searchedBooking.meta && searchedBooking.meta.requesterName) ||
                                                                searchedBooking.donorName ||
                                                                (searchedBooking.donorId && searchedBooking.donorId.name) || '';

                                                            setBillForm(prev => ({
                                                                ...prev,
                                                                tokenNumber: searchedBooking.tokenNumber || '',
                                                                patientName: bestName,
                                                                patientId: searchedBooking.patientMRID || ''
                                                            }));

                                                            // Fetch full details
                                                            if (searchedBooking.tokenNumber) {
                                                                handleTokenSearchForBill(searchedBooking.tokenNumber);
                                                            }
                                                        } else {
                                                            // Clear form for direct purchase
                                                            setBillForm({
                                                                tokenNumber: '',
                                                                patientName: '',
                                                                patientId: '',
                                                                price: '',
                                                                notes: ''
                                                            });
                                                            setBillBookingDetails(null);
                                                        }
                                                        setShowBillModal(true);
                                                    }}
                                                    className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                                                    title={searchedBooking ? "Bill to selected patient" : "Direct purchase - enter patient details"}
                                                >
                                                    {searchedBooking ? '🎫 Bill to Patient' : '💰 Buy Now'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex justify-between">
                                                <span>Units:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">{item.unitsCount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Expiry:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {new Date(item.expiryDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Location:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">{item.location || 'Storage'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {loadingInventory ? 'Loading inventory...' : 'No available inventory items found.'}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Results Section */}
                {searchedBooking && (
                    <div className="w-full animate-fadeIn">
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


                {/* Bill Modal */}
                {showBillModal && selectedItem && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-fadeIn">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {searchedBooking ? '🎫 Bill to Patient' : '💰 Purchase Inventory'}
                                </h3>
                                <button
                                    onClick={() => setShowBillModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        {selectedItem.bloodGroup ? (
                                            <span className={`px-2 py-1 rounded text-sm font-bold ${selectedItem.bloodGroup.includes('+') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {selectedItem.bloodGroup}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded text-sm font-bold bg-gray-100 text-gray-700">
                                                {selectedItem.itemName || 'Item'}
                                            </span>
                                        )}
                                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                                            Serial: {selectedItem.serialNumber || `${selectedItem.firstSerialNumber}-${selectedItem.lastSerialNumber}`}
                                        </span>
                                    </div>

                                    {/* Quick Select Booking */}
                                    {bookings.length > 0 && (
                                        <div className="mb-2">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                Quick Select from Bookings
                                            </label>
                                            <select
                                                size={5}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer custom-scrollbar overflow-y-auto"
                                                onChange={(e) => {
                                                    const bookingId = e.target.value;
                                                    const booking = bookings.find(b => b._id === bookingId);
                                                    if (booking) {
                                                        // Determine the best available name
                                                        const bestName = booking.patientName ||
                                                            (booking.meta && booking.meta.patientName) ||
                                                            booking.requesterName ||
                                                            (booking.meta && booking.meta.requesterName) ||
                                                            booking.donorName ||
                                                            (booking.donorId && booking.donorId.name) || '';

                                                        setBillForm(prev => ({
                                                            ...prev,
                                                            tokenNumber: booking.tokenNumber || '',
                                                            patientName: bestName,
                                                            patientId: booking.patientMRID || ''
                                                        }));

                                                        // Fetch full details
                                                        if (booking.tokenNumber) {
                                                            handleTokenSearchForBill(booking.tokenNumber);
                                                        }
                                                    }
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>-- Select a patient from list --</option>
                                                {bookings.map(b => (
                                                    <option key={b._id} value={b._id}>
                                                        {b.tokenNumber ? `#${b.tokenNumber}` : 'No Token'} - {b.patientName || b.donorName || b.donorId?.name || 'Unknown Patient'} ({b.status})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Auto-filled Details Display using billBookingDetails */}
                                    {billBookingDetails && (
                                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Donor Details */}
                                                <div>
                                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase text-xs mb-2 border-b pb-1">Donor Details</h4>
                                                    <p><span className="font-semibold">Name:</span> {billBookingDetails.donor?.name || 'N/A'}</p>
                                                    {billBookingDetails.donor?.email && <p><span className="font-semibold">Email:</span> {billBookingDetails.donor.email}</p>}
                                                    {billBookingDetails.donor?.phone && <p><span className="font-semibold">Phone:</span> {billBookingDetails.donor.phone}</p>}
                                                    {billBookingDetails.donor?.bloodGroup && <p><span className="font-semibold">Blood Group:</span> {billBookingDetails.donor.bloodGroup}</p>}
                                                </div>

                                                {/* Patient Details */}
                                                <div>
                                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase text-xs mb-2 border-b pb-1">Patient Details</h4>
                                                    <p><span className="font-semibold">Name:</span> {billBookingDetails.patient?.name || billForm.patientName || 'N/A'}</p>
                                                    {billBookingDetails.patient?.mrid && <p><span className="font-semibold">MRID:</span> {billBookingDetails.patient.mrid}</p>}
                                                    {billBookingDetails.patient?.phone && <p><span className="font-semibold">Phone:</span> {billBookingDetails.patient.phone}</p>}
                                                    {billBookingDetails.patient?.address && (
                                                        <p className="whitespace-pre-wrap"><span className="font-semibold">Address:</span> {billBookingDetails.patient.address.houseName}, {billBookingDetails.patient.address.city}</p>
                                                    )}
                                                    {billBookingDetails.patient?.contact && <p><span className="font-semibold">Contact:</span> {billBookingDetails.patient.contact}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleBillItem} className="p-6 space-y-4">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Booking Token {!searchedBooking && <span className="text-gray-500 text-xs">(Optional)</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={billForm.tokenNumber}
                                                onChange={(e) => setBillForm({ ...billForm, tokenNumber: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={searchedBooking ? "Auto-filled from booking" : "Enter token to auto-fill patient details"}
                                            />
                                            {!searchedBooking && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    💡 Leave empty for direct purchase, or enter token to fetch patient details
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleTokenSearchForBill}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-[42px] flex items-center justify-center"
                                            title="Search Token"
                                        >
                                            🔍
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Patient Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={billForm.patientName}
                                            onChange={(e) => setBillForm({ ...billForm, patientName: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Name of patient buying"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Patient ID / MRID
                                        </label>
                                        <input
                                            type="text"
                                            value={billForm.patientId}
                                            onChange={(e) => setBillForm({ ...billForm, patientId: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Optional ID"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={billForm.price}
                                                onChange={(e) => setBillForm({ ...billForm, price: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Notes
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={billForm.notes}
                                            onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Additional details..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowBillModal(false)}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/30 transition"
                                        >
                                            Confirm Purchase
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
}