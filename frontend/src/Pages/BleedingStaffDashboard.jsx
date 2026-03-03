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
    const [issuedInventory, setIssuedInventory] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [showInventoryPicker, setShowInventoryPicker] = useState(false);
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
        fetchCurrentUser();
        fetchBookings();
        fetchInventory();
    }, []);

    // Re-fetch inventory when user is loaded to get issued items
    React.useEffect(() => {
        if (currentUser) {
            fetchIssuedInventory();
        }
    }, [currentUser]);

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

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/users/me');
            if (res.data.success) {
                setCurrentUser(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching user:", err);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoadingInventory(true);
            const res = await api.get('/store-manager/inventory?status=available');
            if (res.data.success) {
                // Sort by serial number ascending (numeric aware)
                const sorted = res.data.data.sort((a, b) => {
                    const serialA = a.firstSerialNumber || a.serialNumber || '';
                    const serialB = b.firstSerialNumber || b.serialNumber || '';
                    return serialA.localeCompare(serialB, undefined, { numeric: true });
                });
                setInventory(sorted);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
            showToast("Failed to load inventory", "error");
        } finally {
            setLoadingInventory(false);
        }
    };

    const fetchIssuedInventory = async () => {
        if (!currentUser) return;
        try {
            // Fetch items reserved/issued to this user
            const res = await api.get(`/store-manager/inventory?status=reserved&allocatedTo=${currentUser._id}`);
            if (res.data.success) {
                setIssuedInventory(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching issued inventory:", err);
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

        let finalSerialNumber = bleedingData.bagSerialNumber;
        let finalWeight = bleedingData.weight;

        // If inventory item selected, consume it
        if (bleedingData.selectedInventoryId) {
            setUpdatingBleeding(true);
            try {
                const purchaseData = {
                    units: 1,
                    patientName: `Donor: ${searchedBooking.donorName}`,
                    notes: `Donation Blood Bag for Token ${searchedBooking.tokenNumber}`
                };

                const res = await api.post(`/store-manager/inventory/${bleedingData.selectedInventoryId}/purchase`, purchaseData);
                if (res.data.success) {
                    // Get the generated serial
                    const purchaseInfo = res.data.data;
                    // Use firstSerialNumber if string, or create from range
                    if (purchaseInfo.purchasedSerials && purchaseInfo.purchasedSerials.start) {
                        // The route returns { start: X, end: Y, count: 1 }
                        // If X is numeric, handled. If string (e.g. BAG-001), handled.
                        // finalSerialNumber = purchaseInfo.purchasedSerials.start;
                    } else {
                        // Fallback logic if route changed
                        // finalSerialNumber = purchaseInfo.serialNumber;
                    }
                    // Use the user's manual input if present, otherwise fall back to purchased one
                    if (!bleedingData.bagSerialNumber) {
                        finalSerialNumber = purchaseInfo.purchasedSerials?.start || purchaseInfo.serialNumber;
                    }
                    showToast(`Inventory updated. Used Serial: ${purchaseInfo.purchasedSerials?.start || purchaseInfo.serialNumber}`, 'success');
                    showToast(`Allocated Bag Serial: ${finalSerialNumber}`, 'success');
                }
            } catch (err) {
                console.error("Failed to allocate bag", err);
                showToast("Failed to allocate bag from inventory. Please enter manually.", 'error');
                setUpdatingBleeding(false);
                return; // Stop here
            }
        }

        if (!finalWeight || !finalSerialNumber) {
            showToast('Please enter Weight and ensure Bag Serial Number is selected/entered', 'warning');
            setUpdatingBleeding(false);
            return;
        }

        try {
            const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
                status: 'completed',
                weight: finalWeight,
                bagSerialNumber: finalSerialNumber
            });

            if (res.data.success) {
                setSearchedBooking(res.data.data);
                showToast('Donation completed and verified successfully! 🎉', 'success');
                fetchBookings();
                fetchInventory(); // Refresh stock
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
            // Backend expects units, patientName, patientId, notes
            const purchaseData = {
                units: 1, // Defaulting to 1 for ad-hoc buy
                patientName: billForm.patientName,
                patientId: billForm.patientId,
                notes: `${billForm.notes || ''} [Price: ${billForm.price}]`.trim()
            };

            const response = await api.post(`/store-manager/inventory/${selectedItem._id}/purchase`, purchaseData);
            if (response.data.success) {
                showToast("Item billed successfully", "success");
                setShowBillModal(false);
                setSelectedItem(null);
                setBillForm({ tokenNumber: '', patientName: '', patientId: '', price: '', notes: '' });
                fetchInventory();
                fetchIssuedInventory();
            }
        } catch (err) {
            console.error('Bill item error:', err);
            showToast(err.response?.data?.message || "Failed to bill item", 'error');
        }
    };

    const addToCart = (item) => {
        setCart(prev => {
            // Check if item already exists
            const exists = prev.find(i => i._id === item._id);
            if (exists) {
                showToast("Item already in cart", "info");
                return prev;
            }
            return [...prev, { ...item, unitsToBill: 1 }];
        });
        showToast("Added to donor's bill", "success");
    };

    const updateCartQuantity = (itemId, newQty) => {
        setCart(prev => prev.map(item => {
            if (item._id === itemId) {
                // Validate against available stock
                const max = item.unitsCount;
                const qty = Math.max(1, Math.min(newQty, max));
                return { ...item, unitsToBill: qty };
            }
            return item;
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i._id !== itemId));
    };

    const handleBulkPurchase = async () => {
        if (!searchedBooking || cart.length === 0) return;

        const loadingToast = showToast("Processing billing...", "info");

        let successCount = 0;
        let failCount = 0;

        // Process sequentially to avoid overwhelming or race conditions
        for (const item of cart) {
            try {
                const bestName = searchedBooking.patientName || searchedBooking.donorName || 'Unknown';
                const purchaseData = {
                    units: item.unitsToBill || 1,
                    patientName: bestName,
                    patientId: searchedBooking.patientMRID || '',
                    notes: `Billed from Bleeding Dashboard for Token #${searchedBooking.tokenNumber}`
                };

                await api.post(`/store-manager/inventory/${item._id}/purchase`, purchaseData);
                successCount++;
            } catch (err) {
                console.error(`Failed to bill item ${item.itemName}`, err);
                failCount++;
            }
        }

        if (successCount > 0) {
            showToast(`Successfully billed ${successCount} items!`, "success");
            setCart([]); // Clear cart
            fetchInventory();
            fetchIssuedInventory();
        }

        if (failCount > 0) {
            showToast(`Failed to bill ${failCount} items. check logs.`, "warning");
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
            <div className="min-h-screen w-full p-0">
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
                <div className="w-full mx-auto mb-12">
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

                <div className="w-full">
                    {/* Today's Queue Section - Now Full Width */}
                    <div className="w-full mb-12">
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
                </div>

                {/* Results Section */}
                {searchedBooking && (
                    <div className="w-full animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 border-b border-gray-700">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                                    👜 Select Blood Bag (Inventory)
                                                </label>
                                                <div className="space-y-2">
                                                    <select
                                                        value={bleedingData.selectedInventoryId || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const item = inventory.find(i => i._id === val);
                                                            setBleedingData(prev => ({
                                                                ...prev,
                                                                selectedInventoryId: val,
                                                                // Auto-fill with the next serial number
                                                                bagSerialNumber: item ? (item.firstSerialNumber || item.serialNumber) : prev.bagSerialNumber
                                                            }));
                                                        }}
                                                        disabled={searchedBooking.status === 'completed'}
                                                        className="w-full px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-lg font-mono text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                                                    >
                                                        <option value="">-- Select Inventory Bag (Auto-Fill) --</option>
                                                        {inventory.map(item => (
                                                            <option key={item._id} value={item._id}>
                                                                {item.itemName} (Next: {item.firstSerialNumber || item.serialNumber}) - {item.unitsCount} left
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={bleedingData.bagSerialNumber}
                                                            onChange={(e) => setBleedingData({ ...bleedingData, bagSerialNumber: e.target.value })}
                                                            disabled={searchedBooking.status === 'completed'}
                                                            className={`w-full px-5 py-3 rounded-xl border-2 ${bleedingData.selectedInventoryId ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'} text-lg font-mono text-gray-900 dark:text-white focus:border-red-500 transition-all`}
                                                            placeholder="Scan or Enter Bag Serial Number..."
                                                        />
                                                        {bleedingData.selectedInventoryId && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 text-xs font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-green-200">
                                                                Auto-Filled from Inventory
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Used Invenory / Cart Section */}
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                                            <h3 className="text-blue-800 dark:text-blue-200 font-bold uppercase text-xs tracking-wider mb-3 flex justify-between items-center">
                                                <span>Used Inventory / Consumables</span>
                                                <span className="bg-blue-200 text-blue-800 py-0.5 px-2 rounded-full text-[10px]">{cart.length} items</span>
                                            </h3>

                                            {cart.length > 0 ? (
                                                <div className="space-y-3 mb-4">
                                                    {cart.map((item) => (
                                                        <div key={item._id} className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-gray-900 dark:text-white">{item.itemName || item.bloodGroup || 'Item'}</span>
                                                                        <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                                            {searchedBooking.patientName || searchedBooking.donorName}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-0.5">Serial: {item.firstSerialNumber === item.lastSerialNumber ? item.firstSerialNumber : `${item.firstSerialNumber}-...`}</p>
                                                                    <p className="text-xs text-gray-400">Stock: {item.unitsCount}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeFromCart(item._id)}
                                                                    className="text-gray-400 hover:text-red-500 transition"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                                                <span className="text-xs font-semibold text-gray-500 uppercase">Quantity</span>
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        onClick={() => updateCartQuantity(item._id, (item.unitsToBill || 1) - 1)}
                                                                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="font-mono font-bold text-gray-900 dark:text-white w-8 text-center">
                                                                        {item.unitsToBill || 1}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateCartQuantity(item._id, (item.unitsToBill || 1) + 1)}
                                                                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={handleBulkPurchase}
                                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                                                    >
                                                        Confirm Usage & Bill All
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-gray-400 text-sm italic">
                                                    No items added yet. Click "+ Add Consumable"
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                                <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2 block">Quick Add Consumable</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex-1 text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 focus:ring-2 focus:ring-blue-500"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            // Search in both arrays
                                                            const item = issuedInventory.find(i => i._id === val) || inventory.find(i => i._id === val);
                                                            if (item) {
                                                                addToCart(item);
                                                            }
                                                            e.target.value = ""; // Reset
                                                        }}
                                                    >
                                                        <option value="">Select item to add...</option>
                                                        {issuedInventory.length > 0 && (
                                                            <optgroup label="Issued to You">
                                                                {issuedInventory.map(i => (
                                                                    <option key={i._id} value={i._id}>
                                                                        {i.itemName} (Issued: {i.unitsCount})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {inventory.length > 0 && (
                                                            <optgroup label="Store Inventory">
                                                                {inventory.map(i => (
                                                                    <option key={i._id} value={i._id}>
                                                                        {i.itemName} (Stock: {i.unitsCount})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <button
                                                        onClick={() => setShowInventoryPicker(true)}
                                                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition"
                                                        title="Open Full Inventory Grid"
                                                    >
                                                        Grid
                                                    </button>
                                                </div>
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
                {/* Inventory Picker Modal */}
                {showInventoryPicker && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scaleUp">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Inventory to Bill</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Adding to Donor: {searchedBooking?.donorName}</p>
                                </div>
                                <button
                                    onClick={() => setShowInventoryPicker(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900/50 flex-1">
                                {/* Issued Inventory Section */}
                                {issuedInventory.length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="text-sm font-bold uppercase text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                                            📦 Issued to You
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {issuedInventory.map(item => (
                                                <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{item.itemName}</p>
                                                        <p className="text-xs text-gray-500">Available: {item.unitsCount}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition active:scale-95"
                                                    >
                                                        Add +
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* General Inventory Section */}
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-3 flex justify-between items-center">
                                        <span>🏭 Store Inventory</span>
                                        <button onClick={fetchInventory} className="text-blue-500 hover:text-blue-600 text-xs">Refresh</button>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {inventory.map(item => (
                                            <div key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition">
                                                <div className="mb-2">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate" title={item.itemName}>{item.itemName || 'Item'}</p>
                                                    <p className="text-xs text-gray-500">Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Stock: {item.unitsCount}</p>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg transition active:scale-95"
                                                >
                                                    Select to Add +
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {inventory.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm py-4">No available inventory found.</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl flex justify-between items-center">
                                <span className="text-sm text-gray-500">{cart.length} items in cart</span>
                                <button
                                    onClick={() => setShowInventoryPicker(false)}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition"
                                >
                                    Done Selecting
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
}