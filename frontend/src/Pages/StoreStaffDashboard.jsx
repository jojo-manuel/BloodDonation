import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Trash2,
  Edit3,
  Save,
  X,
  Share2,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const StoreStaffDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [newItem, setNewItem] = useState({
    bloodGroup: '',
    donationType: 'whole_blood',
    firstSerialNumber: '',
    lastSerialNumber: '',
    collectionDate: '',
    expiryDate: '',
    donorName: '',
    location: '',
    temperature: '2-6°C',
    notes: ''
  });

  const [takeForm, setTakeForm] = useState({
    department: '',
    takenBy: '',
    unitsToTake: 1,
    reason: '',
    notes: ''
  });

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    department: '',
    userId: '',
    notes: ''
  });

  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    tokenNumber: '',
    patientName: '',
    patientId: '',
    price: '',
    notes: ''
  });

  const [staffList, setStaffList] = useState([]);


  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const donationTypes = ['whole_blood', 'plasma', 'platelets', 'red_cells', 'white_cells'];
  const departments = ['Emergency', 'Surgery', 'ICU', 'Pediatrics', 'Oncology', 'Cardiology', 'Orthopedics', 'General Medicine'];

  useEffect(() => {
    fetchInventory();
    fetchStaff();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, filterStatus, filterBloodGroup]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/store-staff/inventory', 'GET');
      setInventory(response.data || []);
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiRequest('/store-staff/staff', 'GET');
      setStaffList(response.data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.firstSerialNumber?.toString().includes(searchTerm) ||
        item.lastSerialNumber?.toString().includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterBloodGroup !== 'all') {
      filtered = filtered.filter(item => item.bloodGroup === filterBloodGroup);
    }

    setFilteredInventory(filtered);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest('/store-staff/inventory', 'POST', newItem);
      if (response.success) {
        setInventory([response.data, ...inventory]);
        setShowAddModal(false);
        setNewItem({
          bloodGroup: '',
          donationType: 'whole_blood',
          firstSerialNumber: '',
          lastSerialNumber: '',
          collectionDate: '',
          expiryDate: '',
          donorName: '',
          location: '',
          temperature: '2-6°C',
          notes: ''
        });
      }
    } catch (err) {
      setError('Failed to add inventory item');
      console.error('Add item error:', err);
    }
  };

  const handleTakeItem = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        status: 'used',
        takenBy: takeForm.takenBy,
        department: takeForm.department,
        reason: takeForm.reason,
        takenAt: new Date().toISOString(),
        notes: `${selectedItem.notes || ''}\nTaken by ${takeForm.takenBy} for ${takeForm.department} - ${takeForm.reason}`.trim()
      };

      const response = await apiRequest(`/store-staff/inventory/${selectedItem._id}`, 'PUT', updateData);
      if (response.success) {
        setInventory(inventory.map(item =>
          item._id === selectedItem._id ? response.data : item
        ));
        setShowTakeModal(false);
        setSelectedItem(null);
        setTakeForm({
          department: '',
          takenBy: '',
          unitsToTake: 1,
          reason: '',
          notes: ''
        });
      }
    } catch (err) {
      setError('Failed to mark item as taken');
      console.error('Take item error:', err);
    }
  };

  const handleAllocateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(`/store-staff/inventory/${selectedItem._id}/allocate`, 'PUT', allocateForm);
      if (response.success) {
        setInventory(inventory.map(item =>
          item._id === selectedItem._id ? response.data : item
        ));
        setShowAllocateModal(false);
        setSelectedItem(null);
        setAllocateForm({ department: '', userId: '', notes: '' });
      }
    } catch (err) {
      setError('Failed to allocate item');
    }
  };

  const handleTokenSearch = async () => {
    if (!billForm.tokenNumber) return;

    try {
      const response = await apiRequest(`/store-staff/bookings/token/${billForm.tokenNumber}`, 'GET');
      if (response.success) {
        setBillForm(prev => ({
          ...prev,
          patientName: response.data.patientName || '',
          patientId: response.data.patientMRID || ''
        }));
      }
    } catch (err) {
      console.error('Token search error:', err);
      alert('Booking not found or error fetching details');
    }
  };

  const handleBillItem = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(`/store-staff/inventory/${selectedItem._id}/bill`, 'PUT', billForm);
      if (response.success) {
        setInventory(inventory.map(item =>
          item._id === selectedItem._id ? response.data : item
        ));
        setShowBillModal(false);
        setSelectedItem(null);
        setBillForm({ tokenNumber: '', patientName: '', patientId: '', price: '', notes: '' });
      }
    } catch (err) {
      setError('Failed to bill item');
      console.error('Bill item error:', err);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await apiRequest(`/store-staff/inventory/${itemId}`, 'PUT', updates);
      if (response.success) {
        setInventory(inventory.map(item =>
          item._id === itemId ? response.data : item
        ));
        setEditingItem(null);
      }
    } catch (err) {
      setError('Failed to update item');
      console.error('Update item error:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiRequest(`/store-staff/inventory/${itemId}`, 'DELETE');
      setInventory(inventory.filter(item => item._id !== itemId));
    } catch (err) {
      setError('Failed to delete item');
      console.error('Delete item error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'reserved': return 'text-yellow-600 bg-yellow-100';
      case 'used': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'quarantine': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 14 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store Staff Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage blood inventory and track department usage</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
                <option value="quarantine">Quarantine</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select
                value={filterBloodGroup}
                onChange={(e) => setFilterBloodGroup(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Blood Groups</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterBloodGroup('all');
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.bloodGroup}</h3>
                    <p className="text-sm text-gray-500 capitalize">{item.donationType?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.status === 'available' && (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowTakeModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Mark as taken"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                    {item.status === 'available' && (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAllocateModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                        title="Allocate to Department"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                    {['available', 'reserved'].includes(item.status) && (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowBillModal(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Bill / Sell stock"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingItem(item._id)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit item"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {isExpired(item.expiryDate) && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                      Expired
                    </span>
                  )}
                  {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expiring Soon
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serial Range:</span>
                    <span className="font-medium">{item.firstSerialNumber} - {item.lastSerialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Units:</span>
                    <span className="font-medium">{item.unitsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Donor:</span>
                    <span className="font-medium">{item.donorName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expiry:</span>
                    <span className="font-medium">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{item.location}</span>
                    </div>
                  )}
                  {item.temperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Temperature:</span>
                      <span className="font-medium">{item.temperature}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new inventory item.</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Inventory Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={newItem.bloodGroup}
                    onChange={(e) => setNewItem({ ...newItem, bloodGroup: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type</label>
                  <select
                    value={newItem.donationType}
                    onChange={(e) => setNewItem({ ...newItem, donationType: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {donationTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Serial Number</label>
                  <input
                    type="number"
                    value={newItem.firstSerialNumber}
                    onChange={(e) => setNewItem({ ...newItem, firstSerialNumber: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Serial Number</label>
                  <input
                    type="number"
                    value={newItem.lastSerialNumber}
                    onChange={(e) => setNewItem({ ...newItem, lastSerialNumber: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    value={newItem.collectionDate}
                    onChange={(e) => setNewItem({ ...newItem, collectionDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={newItem.donorName}
                    onChange={(e) => setNewItem({ ...newItem, donorName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="e.g., Refrigerator A, Shelf 1"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Take Item Modal */}
      {showTakeModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Mark Item as Taken</h3>
              <button
                onClick={() => setShowTakeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>{selectedItem.bloodGroup}</strong> - Serial: {selectedItem.firstSerialNumber}-{selectedItem.lastSerialNumber} ({selectedItem.unitsCount} units)
              </p>
            </div>

            <form onSubmit={handleTakeItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={takeForm.department}
                  onChange={(e) => setTakeForm({ ...takeForm, department: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taken By</label>
                <input
                  type="text"
                  value={takeForm.takenBy}
                  onChange={(e) => setTakeForm({ ...takeForm, takenBy: e.target.value })}
                  required
                  placeholder="Staff name or ID"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={takeForm.reason}
                  onChange={(e) => setTakeForm({ ...takeForm, reason: e.target.value })}
                  required
                  placeholder="e.g., Patient transfusion, Emergency surgery"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={takeForm.notes}
                  onChange={(e) => setTakeForm({ ...takeForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTakeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Mark as Taken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Allocate Item Modal */}
      {showAllocateModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Allocate Item to Department</h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>{selectedItem.bloodGroup}</strong> - Serial: {selectedItem.firstSerialNumber}-{selectedItem.lastSerialNumber} ({selectedItem.unitsCount} units)
              </p>
            </div>

            <form onSubmit={handleAllocateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                <select
                  value={allocateForm.userId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={allocateForm.department}
                  onChange={(e) => setAllocateForm({ ...allocateForm, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Notes</label>
                <textarea
                  value={allocateForm.notes}
                  onChange={(e) => setAllocateForm({ ...allocateForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for allocation or instructions..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Bill Item Modal */}
      {showBillModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bill Inventory Stock</h3>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>{selectedItem.bloodGroup}</strong> - Serial: {selectedItem.firstSerialNumber}-{selectedItem.lastSerialNumber} ({selectedItem.unitsCount} units)
              </p>
            </div>

            <form onSubmit={handleBillItem} className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Number (Optional)</label>
                  <input
                    type="text"
                    value={billForm.tokenNumber}
                    onChange={(e) => setBillForm({ ...billForm, tokenNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter booking token"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTokenSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 h-[42px] flex items-center justify-center"
                  title="Search & Auto-fill"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={billForm.patientName}
                  onChange={(e) => setBillForm({ ...billForm, patientName: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID / MRID (Optional)</label>
                <input
                  type="text"
                  value={billForm.patientId}
                  onChange={(e) => setBillForm({ ...billForm, patientId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter ID if available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={billForm.price}
                  onChange={(e) => setBillForm({ ...billForm, price: e.target.value })}
                  required
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={billForm.notes}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any billing notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Confirm & Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreStaffDashboard;