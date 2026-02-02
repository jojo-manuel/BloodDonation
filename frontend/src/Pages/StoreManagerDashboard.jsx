import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  ChartBarIcon,
  BeakerIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export default function StoreManagerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [bloodBankDetails, setBloodBankDetails] = useState(null);

  // Inventory data states
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUnits: 0,
    expiringUnits: 0,
    expiredUnits: 0,
    availableUnits: 0,
    reservedUnits: 0,
    expiryAlerts: []
  });

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => { },
    inputPlaceholder: ''
  });

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [inventoryForm, setInventoryForm] = useState({
    itemName: '',
    donationType: 'whole_blood', // whole_blood, plasma, platelets, red_cells
    serialNumber: '',
    quantity: 1,
    expiryDate: '',
    collectionDate: '',
    donorId: '',
    donorName: '',
    status: 'available', // available, reserved, expired, used
    location: '', // storage location
    temperature: '', // storage temperature
    notes: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExpiry, setFilterExpiry] = useState('all'); // all, expiring, expired
  const [sortBy, setSortBy] = useState('expiryDate'); // expiryDate, collectionDate, bloodGroup

  const [staffList, setStaffList] = useState([]); // Staff list for allocation
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocatingItem, setAllocatingItem] = useState(null);
  const [allocationForm, setAllocationForm] = useState({ userId: '', notes: '', quantity: 1 });
  const [allocatedInventory, setAllocatedInventory] = useState([]);

  useEffect(() => {
    fetchBloodBankDetails();
    fetchAnalytics();
    fetchStaff();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'inventory':
        fetchInventory();
        break;
      case 'expiry':
        fetchExpiryAlerts();
        break;
      case 'allocations':
        fetchAllocatedInventory();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const fetchBloodBankDetails = async () => {
    try {
      const response = await api.get('/bloodbank/details');
      setBloodBankDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching blood bank details:', error);
      showToast('Failed to fetch blood bank details', 'error');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/store-manager/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to fetch analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterExpiry !== 'all') params.append('expiry', filterExpiry);
      params.append('sortBy', sortBy);

      const response = await api.get(`/store-manager/inventory?${params}`);
      setInventory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showToast('Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/store-manager/expiry-alerts');
      setAnalytics(prev => ({ ...prev, expiryAlerts: response.data.data || [] }));
    } catch (error) {
      console.error('Error fetching expiry alerts:', error);
      showToast('Failed to fetch expiry alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/store-manager/staff');
      setStaffList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Don't toast error here to avoid annoyance if permission issue, silently fail or debug log
    }
  };

  const fetchAllocatedInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/store-manager/inventory?status=reserved');
      const allocated = response.data.data.filter(item => item.allocatedTo);
      setAllocatedInventory(allocated || []);
    } catch (error) {
      console.error('Error fetching allocated inventory:', error);
      showToast('Failed to fetch allocated inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventoryItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...inventoryForm,
        quantity: parseInt(inventoryForm.quantity) || 1
      };

      if (editingItem) {
        await api.put(`/store-manager/inventory/${editingItem._id}`, payload);
        showToast('Inventory item updated successfully', 'success');
      } else {
        await api.post('/store-manager/inventory', payload);
        showToast('Inventory item created successfully', 'success');
      }

      setShowInventoryModal(false);
      resetForm();
      fetchInventory();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showToast(error.response?.data?.message || 'Failed to save inventory item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      await api.put(`/store-manager/inventory/${itemId}/status`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'success');
      fetchInventory();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this inventory item? This action cannot be undone.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/store-manager/inventory/${itemId}`);
          showToast('Inventory item deleted successfully', 'success');
          fetchInventory();
          fetchAnalytics();
        } catch (error) {
          console.error('Error deleting inventory item:', error);
          showToast('Failed to delete inventory item', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAllocateItem = async (e) => {
    e.preventDefault();
    try {
      if (!allocatingItem) return;

      const payload = {
        userId: allocationForm.userId,
        notes: allocationForm.notes
      };

      await api.put(`/store-manager/inventory/${allocatingItem._id}/allocate`, payload);
      showToast('Inventory item allocated successfully', 'success');

      setShowAllocateModal(false);
      setAllocatingItem(null);
      setAllocationForm({ userId: '', notes: '', quantity: 1 });
      fetchInventory();
      fetchAnalytics();
    } catch (error) {
      console.error('Error allocating inventory item:', error);
      showToast(error.response?.data?.message || 'Failed to allocate inventory item', 'error');
    }
  };

  const resetForm = () => {
    setInventoryForm({
      itemName: '',
      donationType: 'whole_blood',
      serialNumber: '',
      quantity: 1,
      expiryDate: '',
      collectionDate: '',
      donorId: '',
      donorName: '',
      status: 'available',
      location: '',
      temperature: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { status: 'expired', color: 'text-red-600 bg-red-100', label: 'Expired' };
    if (days <= 7) return { status: 'critical', color: 'text-red-600 bg-red-100', label: `${days} days` };
    if (days <= 14) return { status: 'warning', color: 'text-yellow-600 bg-yellow-100', label: `${days} days` };
    return { status: 'good', color: 'text-green-600 bg-green-100', label: `${days} days` };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'reserved':
        return 'text-blue-600 bg-blue-100';
      case 'used':
        return 'text-gray-600 bg-gray-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };


  const donationTypes = [
    { value: 'whole_blood', label: 'Whole Blood' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'red_cells', label: 'Red Blood Cells' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'inventory', name: 'Inventory', icon: BeakerIcon },
    { id: 'allocations', name: 'Allocations', icon: UserGroupIcon },
    { id: 'expiry', name: 'Expiry Alerts', icon: ExclamationTriangleIcon },
    { id: 'reports', name: 'Reports', icon: DocumentArrowDownIcon }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Units</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalUnits}</p>
            </div>
            <BeakerIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-3xl font-bold text-green-600">{analytics.availableUnits}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reserved</p>
              <p className="text-3xl font-bold text-blue-600">{analytics.reservedUnits}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-600">{analytics.expiringUnits}</p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
              <p className="text-3xl font-bold text-red-600">{analytics.expiredUnits}</p>
            </div>
            <XCircleIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Expiry Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Expiry Alerts</h3>
        <div className="space-y-3">
          {analytics.expiryAlerts.slice(0, 5).map((alert, index) => {
            const expiryStatus = getExpiryStatus(alert.expiryDate);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.itemName || 'Item'} - Serial {alert.serialNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {alert.unitsCount} units • Expires {formatDate(alert.expiryDate)}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                  {expiryStatus.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div >
  );

  const renderInventory = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Inventory</h2>
        <button
          onClick={() => setShowInventoryModal(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Inventory
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>



          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={filterExpiry}
            onChange={(e) => setFilterExpiry(e.target.value)}
          >
            <option value="all">All Expiry</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={fetchInventory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Collection Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inventory.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.itemName || 'General Item'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.serialNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className={item.unitsCount === 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                          {item.unitsCount}
                        </span>
                        {item.unitsCount === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            SOLD OUT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(item.collectionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{formatDate(item.expiryDate)}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setInventoryForm({
                            itemName: item.itemName || '',
                            donationType: item.donationType,
                            serialNumber: item.serialNumber,
                            quantity: item.unitsCount || 1,
                            expiryDate: item.expiryDate.split('T')[0],
                            collectionDate: item.collectionDate.split('T')[0],
                            donorId: item.donorId || '',
                            donorName: item.donorName || '',
                            status: item.status,
                            location: item.location || '',
                            temperature: item.temperature || '',
                            notes: item.notes || ''
                          });
                          setShowInventoryModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      {item.status === 'available' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'reserved')}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        >
                          Reserve
                        </button>
                      )}
                      {item.status === 'reserved' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'available')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Release
                        </button>
                      )}
                      {item.status === 'available' && (
                        <button
                          onClick={() => {
                            setAllocatingItem(item);
                            setShowAllocateModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Allocate to Staff"
                        >
                          <UserGroupIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'inventory':
        return renderInventory();
      case 'allocations':
        return renderAllocations();
      case 'expiry':
        return renderExpiryAlerts();
      default:
        return renderOverview();
    }
  };

  const renderAllocations = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Allocated Inventory</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocated To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department/Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocated Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allocatedInventory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.itemName || item.bloodGroup || 'General Item'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.unitsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">
                          {item.allocatedTo?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.allocatedTo?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.allocatedTo?.email || ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 capitalize">
                      {item.allocatedTo?.role?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.allocatedAt ? formatDate(item.allocatedAt) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {item.allocationNotes || '-'}
                  </td>
                </tr>
              ))}
              {allocatedInventory.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No allocated inventory found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpiryAlerts = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expiry Alerts</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.expiryAlerts.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.itemName || 'General Item'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.serialNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.unitsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{formatDate(item.expiryDate)}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(item._id, 'expired')}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Mark as Expired
                      </button>
                    </td>
                  </tr>
                );
              })}
              {analytics.expiryAlerts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No expiry alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Store Manager Dashboard</h1>
                {bloodBankDetails && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{bloodBankDetails.name}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/bloodbank/reports')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === tab.id
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>

        {/* Inventory Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInventoryModal(false)}></div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleCreateInventoryItem}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.itemName}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, itemName: e.target.value })}
                          placeholder="e.g. Syringes, Blood Bags, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.serialNumber}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, serialNumber: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.quantity}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection Date</label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.collectionDate}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, collectionDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.expiryDate}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, expiryDate: e.target.value })}
                        />
                      </div>



                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Storage Location</label>
                        <input
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.location}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, location: e.target.value })}
                          placeholder="e.g., Refrigerator A, Shelf 2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temperature (°C)</label>
                        <input
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.temperature}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, temperature: e.target.value })}
                          placeholder="e.g., 2-6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.status}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, status: e.target.value })}
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="used">Used</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea
                          rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={inventoryForm.notes}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInventoryModal(false);
                        resetForm();
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Modal */}
        {showAllocateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleAllocateItem}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                      Attribute Inventory to Staff
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Allocating: <span className="font-semibold">{allocatingItem?.itemName}</span> (Serial: {allocatingItem?.serialNumber})
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Member</label>
                        <select
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.userId}
                          onChange={(e) => setAllocationForm({ ...allocationForm, userId: e.target.value })}
                        >
                          <option value="">Select Staff...</option>
                          {staffList.map(staff => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to Allocate</label>
                        <input
                          type="number"
                          min="1"
                          max={allocatingItem?.unitsCount || 1}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.quantity}
                          onChange={(e) => setAllocationForm({ ...allocationForm, quantity: e.target.value })}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Available: {allocatingItem?.unitsCount || 0} units
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allocation Notes</label>
                        <textarea
                          rows="3"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.notes}
                          onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                          placeholder="Reason for allocation or instructions..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {loading ? 'Allocating...' : 'Allocate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllocateModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {/* Allocation Modal */}
        {showAllocateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAllocateModal(false)}></div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleAllocateItem}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      Allocate Item to Staff
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Item:</strong> {allocatingItem?.itemName || allocatingItem?.donationType}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Serial:</strong> {allocatingItem?.serialNumber}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Member</label>
                        <select
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.userId}
                          onChange={(e) => setAllocationForm({ ...allocationForm, userId: e.target.value })}
                        >
                          <option value="">Select Staff...</option>
                          {staffList.map(staff => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to Allocate</label>
                        <input
                          type="number"
                          min="1"
                          max={allocatingItem?.unitsCount || 1}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.quantity}
                          onChange={(e) => setAllocationForm({ ...allocationForm, quantity: e.target.value })}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Available: {allocatingItem?.unitsCount || 0} units
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                        <textarea
                          rows="3"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={allocationForm.notes}
                          onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                          placeholder="Reason for allocation, instructions, etc."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Allocate
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowAllocateModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          inputPlaceholder={confirmModal.inputPlaceholder}
        />
      </div>
    </Layout>
  );
}