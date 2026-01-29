import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  CogIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function BloodBankManagerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [bloodBankDetails, setBloodBankDetails] = useState(null);
  
  // Dashboard data states
  const [analytics, setAnalytics] = useState({
    overview: {
      totalBookings: 0,
      completedBookings: 0,
      totalPatients: 0,
      fulfilledPatients: 0,
      pendingRequests: 0,
      todayBookings: 0
    },
    bloodGroupDistribution: [],
    monthlyTrend: [],
    recentActivity: []
  });
  
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {},
    inputPlaceholder: ''
  });
  
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [patientForm, setPatientForm] = useState({
    name: '',
    bloodGroup: '',
    mrid: '',
    phoneNumber: '',
    unitsRequired: '',
    dateNeeded: '',
    address: {
      houseName: '',
      houseAddress: '',
      localBody: '',
      city: '',
      district: '',
      state: '',
      pincode: ''
    }
  });
  
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'frontdesk',
    email: '',
    phone: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchBloodBankDetails();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'bookings':
        fetchBookings();
        break;
      case 'patients':
        fetchPatients();
        break;
      case 'requests':
        fetchDonationRequests();
        break;
      case 'staff':
        fetchStaff();
        break;
      case 'inventory':
        fetchInventory();
        break;
      default:
        break;
    }
  }, [activeTab]);

  const fetchBloodBankDetails = async () => {
    try {
      const response = await api.get('/api/bloodbank-manager/details');
      setBloodBankDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching blood bank details:', error);
      showToast('Failed to fetch blood bank details', 'error');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to fetch analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/patients');
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showToast('Failed to fetch patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/donation-requests');
      setDonationRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      showToast('Failed to fetch donation requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/staff');
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('Failed to fetch staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bloodbank-manager/inventory');
      setInventory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showToast('Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/api/bloodbank-manager/patients', patientForm);
      showToast('Patient created successfully', 'success');
      setShowPatientModal(false);
      setPatientForm({
        name: '',
        bloodGroup: '',
        mrid: '',
        phoneNumber: '',
        unitsRequired: '',
        dateNeeded: '',
        address: {
          houseName: '',
          houseAddress: '',
          localBody: '',
          city: '',
          district: '',
          state: '',
          pincode: ''
        }
      });
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      showToast(error.response?.data?.message || 'Failed to create patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/api/bloodbank-manager/staff', staffForm);
      showToast('Staff member created successfully', 'success');
      setShowStaffModal(false);
      setStaffForm({
        name: '',
        role: 'frontdesk',
        email: '',
        phone: ''
      });
      fetchStaff();
      
      // Show credentials modal if credentials are returned
      if (response.data.credentials) {
        setConfirmModal({
          isOpen: true,
          title: 'Staff Credentials Created',
          message: `Username: ${response.data.credentials.username}\nPassword: ${response.data.credentials.password}\n\nPlease save these credentials securely.`,
          type: 'info',
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      showToast(error.response?.data?.message || 'Failed to create staff member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/api/bloodbank-manager/bookings/${bookingId}/status`, { status });
      showToast(`Booking ${status} successfully`, 'success');
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${type}`,
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/api/bloodbank-manager/${type}/${id}`);
          showToast(`${type} deleted successfully`, 'success');
          
          // Refresh the appropriate data
          switch (type) {
            case 'patient':
              fetchPatients();
              break;
            case 'staff':
              fetchStaff();
              break;
            default:
              break;
          }
        } catch (error) {
          console.error(`Error deleting ${type}:`, error);
          showToast(`Failed to delete ${type}`, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address) return 'N/A';
    
    const { houseName, houseAddress, localBody, city, district, state, pincode } = address;
    return [houseName, houseAddress, localBody, city, district, state, pincode]
      .filter(Boolean)
      .join(', ');
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const staffRoles = [
    { value: 'frontdesk', label: 'Front Desk' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'bleeding_staff', label: 'Bleeding Staff' },
    { value: 'store_staff', label: 'Store Staff' },
    { value: 'centrifuge_staff', label: 'Centrifuge Staff' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'bookings', name: 'Bookings', icon: CalendarDaysIcon },
    { id: 'patients', name: 'Patients', icon: UserGroupIcon },
    { id: 'requests', name: 'Requests', icon: ClipboardDocumentListIcon },
    { id: 'staff', name: 'Staff', icon: UserGroupIcon },
    { id: 'inventory', name: 'Inventory', icon: BeakerIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalBookings}</p>
            </div>
            <CalendarDaysIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600">{analytics.overview.completedBookings}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalPatients}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Bookings</p>
              <p className="text-3xl font-bold text-orange-600">{analytics.overview.todayBookings}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Blood Group Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Blood Group Distribution</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {bloodGroups.map(group => {
            const data = analytics.bloodGroupDistribution.find(item => item._id === group) || { count: 0 };
            return (
              <div key={group} className="text-center">
                <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 mb-2">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.count}</p>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{group}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {analytics.recentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
          >
            <option value="all">All Blood Groups</option>
            {bloodGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setFilterBloodGroup('all');
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
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
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {booking.bookingId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booking.donorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booking.patientName}
                    {booking.patientMRID && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">MRID: {booking.patientMRID}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {booking.bloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.date)}
                    <div className="text-xs text-gray-500 dark:text-gray-400">{booking.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateBookingStatus(booking._id, 'completed')}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h2>
        <button
          onClick={() => setShowPatientModal(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div key={patient._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{patient.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">MRID: {patient.mrid}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                patient.isFulfilled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {patient.isFulfilled ? 'Fulfilled' : 'Pending'}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Blood Group:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{patient.bloodGroup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Units Required:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{patient.unitsRequired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Units Received:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{patient.unitsReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Date Needed:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(patient.dateNeeded)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address:</p>
              <p className="text-sm text-gray-900 dark:text-white">{formatAddress(patient.address)}</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingItem(patient);
                  setShowPatientModal(true);
                }}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem('patient', patient._id)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
        <button
          onClick={() => setShowStaffModal(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
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
              {staff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {staffRoles.find(role => role.value === member.role)?.label || member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {member.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {member.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(member);
                        setShowStaffModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem('staff', member._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
      case 'bookings':
        return renderBookings();
      case 'patients':
        return renderPatients();
      case 'staff':
        return renderStaff();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blood Bank Manager</h1>
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
                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
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

        {/* Patient Modal */}
        {showPatientModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPatientModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleCreatePatient}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      {editingItem ? 'Edit Patient' : 'Add New Patient'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={patientForm.name}
                          onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                          <select
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            value={patientForm.bloodGroup}
                            onChange={(e) => setPatientForm({...patientForm, bloodGroup: e.target.value})}
                          >
                            <option value="">Select Blood Group</option>
                            {bloodGroups.map(group => (
                              <option key={group} value={group}>{group}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">MRID</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            value={patientForm.mrid}
                            onChange={(e) => setPatientForm({...patientForm, mrid: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                          <input
                            type="tel"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            value={patientForm.phoneNumber}
                            onChange={(e) => setPatientForm({...patientForm, phoneNumber: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Units Required</label>
                          <input
                            type="number"
                            min="1"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                            value={patientForm.unitsRequired}
                            onChange={(e) => setPatientForm({...patientForm, unitsRequired: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Needed</label>
                        <input
                          type="date"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={patientForm.dateNeeded}
                          onChange={(e) => setPatientForm({...patientForm, dateNeeded: e.target.value})}
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
                        setShowPatientModal(false);
                        setEditingItem(null);
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

        {/* Staff Modal */}
        {showStaffModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowStaffModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleCreateStaff}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      {editingItem ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={staffForm.name}
                          onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={staffForm.role}
                          onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                        >
                          {staffRoles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          value={staffForm.phone}
                          onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
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
                      {loading ? 'Creating...' : (editingItem ? 'Update' : 'Create')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffModal(false);
                        setEditingItem(null);
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

        {/* Confirmation Modal */}
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