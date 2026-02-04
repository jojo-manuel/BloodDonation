import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import { doctorSelectionCriteria } from "../data/DoctorChecklist";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- DOCTOR MODULE STATE ---
    const [doctorToken, setDoctorToken] = useState('');
    const [doctorBooking, setDoctorBooking] = useState(null);
    const [doctorChecklist, setDoctorChecklist] = useState({}); // { id: boolean }
    const [searchDoctorLoading, setSearchDoctorLoading] = useState(false);
    const [assessmentComments, setAssessmentComments] = useState('');

    // --- INVENTORY STATE ---
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [purchaseForm, setPurchaseForm] = useState({
        units: 1,
        patientName: '',
        patientId: '',
        notes: ''
    });

    // Fetch inventory on mount
    React.useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoadingInventory(true);
            const res = await api.get('/store-manager/inventory?status=available');
            if (res.data.success) {
                setInventory(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
            showToast("Failed to load inventory", "error");
        } finally {
            setLoadingInventory(false);
        }
    };

    const handleDoctorTokenSearch = async (e) => {
        e?.preventDefault();
        if (!doctorToken.trim()) return;
        setSearchDoctorLoading(true);
        setDoctorBooking(null);
        setDoctorChecklist({}); // Reset checklist
        try {
            const res = await api.get(`/bloodbank/bookings/token/${doctorToken.trim()}`);
            if (res.data.success) {
                setDoctorBooking(res.data.data);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Booking not found', 'error');
        } finally {
            setSearchDoctorLoading(false);
        }
    };

    const handleAssessmentAction = async (action) => {
        // action: 'medical_cleared' or 'rejected'
        if (!doctorBooking) return;

        const payload = {
            status: action,
            rejectionReason: action === 'rejected' ? (assessmentComments || 'Medical reasons') : undefined,
        };

        try {
            const res = await api.put(`/bloodbank/bookings/${doctorBooking._id}/status`, payload);
            if (res.data.success) {
                showToast(`Donor ${action === 'medical_cleared' ? 'Approved' : 'Rejected'} Successfully`, 'success');
                setDoctorBooking(null);
                setDoctorToken('');
                setDoctorChecklist({});
                setAssessmentComments('');
            }
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    const toggleChecklist = (id) => {
        setDoctorChecklist(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handlePurchaseItem = async (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (purchaseForm.units > selectedItem.unitsCount) {
            showToast(`Only ${selectedItem.unitsCount} units available`, 'error');
            return;
        }

        try {
            const response = await api.post(`/store-manager/inventory/${selectedItem._id}/purchase`, {
                units: purchaseForm.units,
                patientName: purchaseForm.patientName,
                patientId: purchaseForm.patientId,
                notes: purchaseForm.notes
            });

            if (response.data.success) {
                const message = response.data.message || "Purchase completed successfully";
                showToast(message, "success");
                setShowPurchaseModal(false);
                setSelectedItem(null);
                setPurchaseForm({ units: 1, patientName: '', patientId: '', notes: '' });
                fetchInventory(); // Refresh inventory
            }
        } catch (err) {
            console.error('Purchase error:', err);
            showToast(err.response?.data?.message || "Failed to complete purchase", 'error');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/bloodbank-login");
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="text-4xl">🩺</span>
                                Doctor Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Medical Assessment & Inventory Management
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-2"
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>

                    {/* Inventory Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="text-2xl">📦</span>
                                Available Inventory
                            </h2>
                            <button
                                onClick={fetchInventory}
                                className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inventory.length > 0 ? (
                                inventory.map(item => (
                                    <div key={item._id} className="bg-gray-50 dark:bg-gray-900/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                {item.itemName && (
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.itemName}</h4>
                                                )}
                                                <span className={`px-3 py-1 rounded-lg text-lg font-bold ${item.bloodGroup?.includes('+') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                    }`}>
                                                    {item.bloodGroup}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 capitalize">
                                                    {item.donationType?.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            <div className="flex justify-between">
                                                <span>Available Units:</span>
                                                <span className="font-bold text-gray-900 dark:text-gray-200">{item.unitsCount}</span>
                                            </div>
                                            {item.status === 'available' && item.unitsCount > 0 ? (
                                                <div className="flex justify-between">
                                                    <span>Serial Range:</span>
                                                    <span className="font-mono text-xs text-gray-900 dark:text-gray-200">
                                                        {item.firstSerialNumber}-{item.lastSerialNumber}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between">
                                                    <span>Status:</span>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">
                                                        {item.status === 'used' ? 'Fully Purchased' : item.status}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span>Expiry:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {new Date(item.expiryDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Location:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {item.location || 'Storage'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setPurchaseForm({
                                                    units: 1,
                                                    patientName: doctorBooking?.patientName || '',
                                                    patientId: doctorBooking?.patientMRID || '',
                                                    notes: ''
                                                });
                                                setShowPurchaseModal(true);
                                            }}
                                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg"
                                        >
                                            💳 Purchase by Unit
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {loadingInventory ? 'Loading inventory...' : 'No available inventory items found.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">🔍</span>
                            Find Donor for Assessment
                        </h2>
                        <form onSubmit={handleDoctorTokenSearch} className="flex gap-4 max-w-2xl">
                            <input
                                type="text"
                                placeholder="Enter Token Number (e.g., BK-123)"
                                className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-lg focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition"
                                value={doctorToken}
                                onChange={(e) => setDoctorToken(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={searchDoctorLoading}
                                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-lg font-bold rounded-xl transition shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {searchDoctorLoading ? 'Scanning...' : 'Search'}
                            </button>
                        </form>
                    </div>

                    {/* Results Section */}
                    {doctorBooking && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* Donor Profile Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="text-9xl">👤</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-2xl">👤</span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{doctorBooking.donorName}</h3>
                                            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{doctorBooking.bookingId}</p>
                                        </div>
                                    </div>

                                    {/* Patient Details Section */}
                                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">🏥</span>
                                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Patient Information</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Patient Name</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {doctorBooking.patientName || doctorBooking.patientId?.patientName || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Patient MRID</p>
                                                <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                                                    {doctorBooking.patientMrid || doctorBooking.patientMRID || doctorBooking.patientId?.mrid || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Blood Group</p>
                                            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{doctorBooking.bloodGroup}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Age / Gender</p>
                                            <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                                {doctorBooking.age || 'N/A'} <span className="text-gray-400">/</span> {doctorBooking.gender || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Weight</p>
                                            <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                                {doctorBooking.weight ? `${doctorBooking.weight} kg` : 'Not Measured'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Status</p>
                                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${doctorBooking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                doctorBooking.status === 'medical_cleared' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {doctorBooking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right relative z-10 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">Token Number</p>
                                    <p className="text-5xl font-mono font-bold text-gray-900 dark:text-white tracking-tighter">
                                        #{doctorBooking.tokenNumber || '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Two Column Layout for Action */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Available Criteria Checklist */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[800px]">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>📋</span> Eligibility Checklist
                                        </h3>
                                    </div>

                                    <div className="p-6 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-8">
                                            {doctorSelectionCriteria.map((category) => (
                                                <div key={category.category} className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                                                    <h4 className="font-bold text-pink-600 dark:text-pink-400 mb-4 text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                                                        {category.category}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {category.items.map((item) => (
                                                            <label
                                                                key={item.id}
                                                                className={`flex items-start gap-4 p-3 rounded-lg transition border-2 cursor-pointer group ${doctorChecklist[item.id]
                                                                    ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-800'
                                                                    : 'border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                                                    }`}
                                                            >
                                                                <div className="mt-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-6 h-6 text-pink-600 rounded focus:ring-pink-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                                                                        checked={!!doctorChecklist[item.id]}
                                                                        onChange={() => toggleChecklist(item.id)}
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className={`font-bold block text-base ${doctorChecklist[item.id] ? 'text-pink-900 dark:text-pink-300' : 'text-gray-900 dark:text-white'
                                                                        }`}>
                                                                        {item.label}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">
                                                                        {item.description}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Final Decision Panel */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 sticky top-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <span>⚖️</span> Final Decision
                                        </h3>

                                        <div className="mb-6">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Medical Notes / Rejection Reason
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none resize-none min-h-[120px]"
                                                placeholder="Enter key observations or reasons for rejection..."
                                                value={assessmentComments}
                                                onChange={(e) => setAssessmentComments(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <button
                                                onClick={() => handleAssessmentAction('medical_cleared')}
                                                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"
                                            >
                                                ✅ Approve Donor
                                            </button>

                                            <button
                                                onClick={() => handleAssessmentAction('rejected')}
                                                className="w-full py-4 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2"
                                            >
                                                ❌ Reject Donor
                                            </button>
                                        </div>

                                        <p className="text-xs text-center text-gray-400 mt-4">
                                            Approved donors will be sent to the Bleeding Room.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                💳 Purchase Inventory by Unit
                            </h3>
                            <button
                                onClick={() => setShowPurchaseModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${selectedItem.bloodGroup?.includes('+') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {selectedItem.bloodGroup}
                                </span>
                                <span className="text-gray-600 dark:text-gray-300 text-sm">
                                    {selectedItem.itemName || 'Blood Product'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>Available Units: <span className="font-bold text-gray-900 dark:text-white">{selectedItem.unitsCount}</span></p>
                                <p>Serial Range: <span className="font-mono text-xs">{selectedItem.firstSerialNumber}-{selectedItem.lastSerialNumber}</span></p>
                            </div>
                        </div>

                        <form onSubmit={handlePurchaseItem} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Number of Units <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedItem.unitsCount}
                                    value={purchaseForm.units}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, units: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Patient Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={purchaseForm.patientName}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, patientName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Patient name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Patient ID / MRID
                                </label>
                                <input
                                    type="text"
                                    value={purchaseForm.patientId}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, patientId: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Optional ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    rows="2"
                                    value={purchaseForm.notes}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Additional details..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition"
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
