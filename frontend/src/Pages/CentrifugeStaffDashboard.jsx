import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  ArrowRight,
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
  Beaker,
  Droplets,
  Activity,
  Clock,
  Link
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const CentrifugeStaffDashboard = () => {
  const [bloodBags, setBloodBags] = useState([]);
  const [components, setComponents] = useState([]);
  const [filteredBags, setFilteredBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSeparateModal, setShowSeparateModal] = useState(false);
  const [selectedBag, setSelectedBag] = useState(null);
  const [activeTab, setActiveTab] = useState('bags'); // 'bags' or 'components'

  // Form states
  const [receiveForm, setReceiveForm] = useState({
    serialNumber: '',
    bloodGroup: '',
    donorName: '',
    collectionDate: '',
    volume: 450,
    notes: ''
  });

  const [separationForm, setSeparationForm] = useState({
    components: [
      { type: 'red_cells', volume: '', serialNumber: '', notes: '' },
      { type: 'plasma', volume: '', serialNumber: '', notes: '' },
      { type: 'platelets', volume: '', serialNumber: '', notes: '' }
    ],
    separationDate: new Date().toISOString().split('T')[0],
    technician: '',
    method: 'centrifugation',
    notes: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const componentTypes = [
    { value: 'red_cells', label: 'Red Blood Cells', color: 'bg-red-100 text-red-800' },
    { value: 'plasma', label: 'Plasma', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'platelets', label: 'Platelets', color: 'bg-blue-100 text-blue-800' },
    { value: 'white_cells', label: 'White Blood Cells', color: 'bg-green-100 text-green-800' },
    { value: 'cryoprecipitate', label: 'Cryoprecipitate', color: 'bg-purple-100 text-purple-800' }
  ];

  const separationMethods = [
    { value: 'centrifugation', label: 'Centrifugation' },
    { value: 'apheresis', label: 'Apheresis' },
    { value: 'filtration', label: 'Filtration' }
  ];

  useEffect(() => {
    fetchBloodBags();
    fetchComponents();
  }, []);

  useEffect(() => {
    filterBloodBags();
  }, [bloodBags, searchTerm, filterStatus, filterBloodGroup]);

  const fetchBloodBags = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/centrifuge-staff/blood-bags', 'GET');
      setBloodBags(response.data || []);
    } catch (err) {
      setError('Failed to fetch blood bags');
      console.error('Blood bags fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async () => {
    try {
      const response = await apiRequest('/centrifuge-staff/components', 'GET');
      setComponents(response.data || []);
    } catch (err) {
      console.error('Components fetch error:', err);
    }
  };

  const filterBloodBags = () => {
    let filtered = [...bloodBags];

    if (searchTerm) {
      filtered = filtered.filter(bag =>
        bag.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bag.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bag.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(bag => bag.status === filterStatus);
    }

    if (filterBloodGroup !== 'all') {
      filtered = filtered.filter(bag => bag.bloodGroup === filterBloodGroup);
    }

    setFilteredBags(filtered);
  };

  const handleReceiveBag = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest('/centrifuge-staff/blood-bags', 'POST', receiveForm);
      if (response.success) {
        setBloodBags([response.data, ...bloodBags]);
        setShowReceiveModal(false);
        setReceiveForm({
          serialNumber: '',
          bloodGroup: '',
          donorName: '',
          collectionDate: '',
          volume: 450,
          notes: ''
        });
      }
    } catch (err) {
      setError('Failed to receive blood bag');
      console.error('Receive bag error:', err);
    }
  };

  const handleSeparateBag = async (e) => {
    e.preventDefault();
    try {
      const separationData = {
        ...separationForm,
        originalBagId: selectedBag._id,
        components: separationForm.components.filter(comp => comp.volume && comp.serialNumber)
      };

      const response = await apiRequest(`/centrifuge-staff/blood-bags/${selectedBag._id}/separate`, 'POST', separationData);
      if (response.success) {
        // Update the blood bag status
        setBloodBags(bloodBags.map(bag =>
          bag._id === selectedBag._id ? { ...bag, status: 'separated' } : bag
        ));
        // Add new components
        setComponents([...components, ...response.data.components]);
        setShowSeparateModal(false);
        setSelectedBag(null);
        setSeparationForm({
          components: [
            { type: 'red_cells', volume: '', serialNumber: '', notes: '' },
            { type: 'plasma', volume: '', serialNumber: '', notes: '' },
            { type: 'platelets', volume: '', serialNumber: '', notes: '' }
          ],
          separationDate: new Date().toISOString().split('T')[0],
          technician: '',
          method: 'centrifugation',
          notes: ''
        });
      }
    } catch (err) {
      setError('Failed to separate blood bag');
      console.error('Separate bag error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'separated': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'quarantine': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComponentColor = (type) => {
    const component = componentTypes.find(c => c.value === type);
    return component ? component.color : 'bg-gray-100 text-gray-800';
  };

  const getComponentLabel = (type) => {
    const component = componentTypes.find(c => c.value === type);
    return component ? component.label : type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading centrifuge data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Centrifuge Staff Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Receive blood bags and separate into components</p>
            </div>
            <button
              onClick={() => setShowReceiveModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Receive Blood Bag
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('bags')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'bags'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Blood Bags ({bloodBags.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'components'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Components ({components.length})
                </div>
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bags or components..."
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
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="separated">Separated</option>
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'bags' ? (
          /* Blood Bags Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBags.map((bag) => (
              <div key={bag._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bag.bloodGroup}</h3>
                      <p className="text-sm text-gray-500">Serial: {bag.serialNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      {bag.status === 'received' && (
                        <button
                          onClick={() => {
                            setSelectedBag(bag);
                            setShowSeparateModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Separate components"
                        >
                          <Beaker className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bag.status)}`}>
                      {bag.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Donor:</span>
                      <span className="font-medium">{bag.donorName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume:</span>
                      <span className="font-medium">{bag.volume} ml</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Collection Date:</span>
                      <span className="font-medium">
                        {new Date(bag.collectionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Received:</span>
                      <span className="font-medium">
                        {new Date(bag.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Components Count */}
                  {bag.componentsCount > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          {bag.componentsCount} components separated
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bag.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">{bag.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Components Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component) => (
              <div key={component._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getComponentLabel(component.type)}
                      </h3>
                      <p className="text-sm text-gray-500">Serial: {component.serialNumber}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComponentColor(component.type)}`}>
                      {component.type}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Blood Group:</span>
                      <span className="font-medium">{component.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume:</span>
                      <span className="font-medium">{component.volume} ml</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Separated:</span>
                      <span className="font-medium">
                        {new Date(component.separationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span className="font-medium capitalize">{component.separationMethod}</span>
                    </div>
                  </div>

                  {/* Original Bag Link */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        From bag: {component.originalBag?.serialNumber || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {component.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">{component.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'bags' && filteredBags.length === 0) ||
          (activeTab === 'components' && components.length === 0)) && (
            <div className="text-center py-12">
              {activeTab === 'bags' ? (
                <>
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No blood bags</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by receiving a blood bag.</p>
                </>
              ) : (
                <>
                  <Beaker className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No components</h3>
                  <p className="mt-1 text-sm text-gray-500">Separate blood bags to create components.</p>
                </>
              )}
            </div>
          )}
      </div>

      {/* Receive Blood Bag Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Receive Blood Bag</h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleReceiveBag} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={receiveForm.serialNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, serialNumber: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={receiveForm.bloodGroup}
                    onChange={(e) => setReceiveForm({ ...receiveForm, bloodGroup: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={receiveForm.donorName}
                    onChange={(e) => setReceiveForm({ ...receiveForm, donorName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    value={receiveForm.collectionDate}
                    onChange={(e) => setReceiveForm({ ...receiveForm, collectionDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be today or later</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml)</label>
                  <input
                    type="number"
                    value={receiveForm.volume}
                    onChange={(e) => setReceiveForm({ ...receiveForm, volume: parseInt(e.target.value) })}
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Receive Bag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Separate Components Modal */}
      {showSeparateModal && selectedBag && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Separate Blood Components</h3>
              <button
                onClick={() => setShowSeparateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Original Bag:</strong> {selectedBag.bloodGroup} - Serial: {selectedBag.serialNumber} ({selectedBag.volume} ml)
              </p>
            </div>

            <form onSubmit={handleSeparateBag} className="space-y-6">
              {/* Separation Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Separation Date</label>
                  <input
                    type="date"
                    value={separationForm.separationDate}
                    onChange={(e) => setSeparationForm({ ...separationForm, separationDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                  <input
                    type="text"
                    value={separationForm.technician}
                    onChange={(e) => setSeparationForm({ ...separationForm, technician: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    value={separationForm.method}
                    onChange={(e) => setSeparationForm({ ...separationForm, method: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {separationMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Components */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Components to Separate</h4>
                <div className="space-y-4">
                  {separationForm.components.map((component, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{getComponentLabel(component.type)}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComponentColor(component.type)}`}>
                          {component.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml)</label>
                          <input
                            type="number"
                            value={component.volume}
                            onChange={(e) => {
                              const newComponents = [...separationForm.components];
                              newComponents[index].volume = e.target.value;
                              setSeparationForm({ ...separationForm, components: newComponents });
                            }}
                            min="1"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={component.serialNumber}
                            onChange={(e) => {
                              const newComponents = [...separationForm.components];
                              newComponents[index].serialNumber = e.target.value;
                              setSeparationForm({ ...separationForm, components: newComponents });
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            value={component.notes}
                            onChange={(e) => {
                              const newComponents = [...separationForm.components];
                              newComponents[index].notes = e.target.value;
                              setSeparationForm({ ...separationForm, components: newComponents });
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                <textarea
                  value={separationForm.notes}
                  onChange={(e) => setSeparationForm({ ...separationForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSeparateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Separate Components
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentrifugeStaffDashboard;