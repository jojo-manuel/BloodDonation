import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';
import ReviewTab from '../components/ReviewTab';
// TaxiBookingModal removed with taxi booking feature
import CitySearchDropdown from '../components/CitySearchDropdown';
import MedicalConsentForm from '../components/MedicalConsentForm';
import RescheduleNotificationModal from '../components/RescheduleNotificationModal';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';



const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_booking', label: 'Pending Booking' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'booked', label: 'Booked' },
];

const SORT_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("findDonors");
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "",
    city: "",
    availability: "available"
  });
  const [results, setResults] = useState([]);
  const [mrid, setMrid] = useState("");
  const [mridBloodBankFilter, setMridBloodBankFilter] = useState(""); // Filter for MRID search
  const [bloodBanks, setBloodBanks] = useState([]); // List of available blood banks
  const [searchMode, setSearchMode] = useState('general'); // 'general' | 'mrid'

  // Clear results when switching search modes
  useEffect(() => {
    setResults([]);
    setMridResults([]);
    setMridError('');
    setMridSuccess('');
  }, [searchMode]);

  // Fetch blood banks for dropdown
  useEffect(() => {
    const fetchBloodBanks = async () => {
      try {
        const res = await api.get('/bloodbank/all');
        if (res.data.success) {
          setBloodBanks(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch blood banks", err);
      }
    };
    fetchBloodBanks();
  }, []);
  const [mridResults, setMridResults] = useState([]);
  const [selectedBloodBank, setSelectedBloodBank] = useState(""); // For multiple blood bank selection
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mridLoading, setMridLoading] = useState(false);
  const [mridError, setMridError] = useState("");
  const [mridSuccess, setMridSuccess] = useState("");
  const navigate = useNavigate();
  const [requestingId, setRequestingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [newStatuses, setNewStatuses] = useState({});
  const [contactModalDonor, setContactModalDonor] = useState(null); // For contact modal
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [requestType, setRequestType] = useState('sent'); // 'sent' or 'received'

  // Additional filters
  const [filterMRID, setFilterMRID] = useState('');
  const [filterPatientName, setFilterPatientName] = useState('');
  const [filterDonorName, setFilterDonorName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [filterBloodBankName, setFilterBloodBankName] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Toggle filter panel visibility
  const [profileData, setProfileData] = useState({});
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // For request details modal
  const [notifications, setNotifications] = useState([]); // For notifications

  const [rescheduleNotifications, setRescheduleNotifications] = useState([]); // Reschedule notifications
  const [showRescheduleModal, setShowRescheduleModal] = useState(false); // Show reschedule modal
  const [settingsData, setSettingsData] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    donationReminders: true,
    marketingEmails: false,
    twoFactorAuth: false,
    darkMode: false,
    language: 'en',
    timezone: 'Asia/Kolkata'
  });
  const loginUsername = (typeof window !== 'undefined' && localStorage.getItem('username')) || '';
  const [bookingBloodBankId, setBookingBloodBankId] = useState(''); // State for selecting blood bank in booking modal

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      pending_booking: { color: 'bg-blue-100 text-blue-800', icon: '📅' },
      accepted: { color: 'bg-green-100 text-green-800', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800', icon: '❌' },
      booked: { color: 'bg-purple-100 text-purple-800', icon: '🎫' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: '🚫' },
      completed: { color: 'bg-emerald-100 text-emerald-800', icon: '🎉' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Handle search form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };









  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const query = new URLSearchParams(searchParams).toString();
      console.log('🔍 Executing search with query:', query);
      const res = await api.get(`/donors/search?${query}`);
      console.log('📩 Search response:', res.data);
      if (res.data.success) {
        const node = res?.data?.data;
        // Handle both pagination formats and direct array
        const arr = Array.isArray(node) ? node : (node?.data || []);
        console.log('📊 Parsed results:', arr.length, 'donors');
        setResults(arr);
      } else {
        console.warn('⚠️ Search failed:', res.data.message);
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleMridSearch = async (event) => {
    event.preventDefault();
    const trimmed = mrid.trim().toUpperCase(); // Convert to uppercase to match database
    if (!trimmed) {
      setMridError('Please enter a patient MRID to search.');
      setMridSuccess('');
      setMridResults([]);
      setSelectedBloodBank('');
      return;
    }

    setMridLoading(true);
    setMridError('');
    setMridSuccess('');
    setSelectedBloodBank(''); // Reset blood bank selection

    try {
      // Call donor search endpoint (not patient search!)
      let url = `/donors/searchByMrid/${encodeURIComponent(trimmed)}`;
      if (mridBloodBankFilter) {
        url += `?bloodBankId=${mridBloodBankFilter}`;
      }
      const response = await api.get(url);

      if (response.data.success) {
        const donors = response.data.data || [];
        const patientInfo = response.data.patientInfo;

        setMridResults(donors);

        if (donors.length === 0) {
          setMridError(`Patient found (MRID: ${trimmed}, Blood Group: ${patientInfo?.bloodGroup || 'Unknown'}), but no matching donors available.`);
        } else {
          setMridSuccess(`Found ${donors.length} donor(s) matching patient "${patientInfo?.name || 'Unknown'}" (MRID: ${trimmed}, Blood Group: ${patientInfo?.bloodGroup || 'Unknown'})`);
        }
      } else {
        // This is where "No patient found with this MRID" comes from if success=false
        // However, if we want to be more helpful:
        setMridError(response.data.message || `No patient found with MRID: ${trimmed}`);
        setMridResults([]);
      }
    } catch (error) {
      const message = error?.response?.data?.message || `Patient search failed for MRID: ${trimmed}`;
      setMridError(message);
      setMridResults([]);
    } finally {
      setMridLoading(false);
    }
  };

  // Fetch donation requests (both sent and received)
  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      if (res.data.success) {
        const data = res.data.data;
        // Backend returns { requests: [...], received: [...] }
        if (data && (data.requests || data.received)) {
          setSentRequests(data.requests || []);
          setReceivedRequests(data.received || []);
        } else if (Array.isArray(data)) {
          // Fallback for older structure
          setSentRequests(data);
          setReceivedRequests([]);
        }
      } else {
        setSentRequests([]);
        setReceivedRequests([]);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      // Don't clear on error to prevent flashing, or clear if critical
      // setSentRequests([]);
      // setReceivedRequests([]);
    }
    setLoading(false);
  };

  const fetchReceivedRequests = async () => {
    // No-op, handled by fetchRequests now
  };



  // Fetch unread reschedule notifications
  const fetchRescheduleNotifications = async () => {
    try {
      const res = await api.get('/notifications/unread');
      if (res.data.success) {
        // Filter only slot_reschedule notifications
        const reschedules = res.data.data.filter(n => n.type === 'slot_reschedule');
        if (reschedules.length > 0) {
          setRescheduleNotifications(reschedules);
          setShowRescheduleModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      // Remove from local state
      setRescheduleNotifications(prev =>
        prev.filter(n => n._id !== notificationId)
      );

      // If no more notifications, close modal
      if (rescheduleNotifications.length <= 1) {
        setShowRescheduleModal(false);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = sentRequests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Filter by MRID
    if (filterMRID) {
      filtered = filtered.filter((request) =>
        (request.patientId?.mrid || request.patientMRID || '').toLowerCase().includes(filterMRID.toLowerCase())
      );
    }

    // Filter by Patient Name
    if (filterPatientName) {
      filtered = filtered.filter((request) =>
        (request.patientId?.name || request.patientUsername || '').toLowerCase().includes(filterPatientName.toLowerCase())
      );
    }

    // Filter by Donor Name
    if (filterDonorName) {
      filtered = filtered.filter((request) =>
        (request.receiverId?.username || request.donorId?.userId?.username || request.donorUsername || request.receiverId?.name || '').toLowerCase().includes(filterDonorName.toLowerCase())
      );
    }

    // Filter by Date
    if (filterDate) {
      filtered = filtered.filter((request) => {
        const requestDate = request.requestedAt ? new Date(request.requestedAt).toISOString().split('T')[0] : '';
        return requestDate === filterDate;
      });
    }

    // Filter by Blood Group
    if (filterBloodGroup !== 'all') {
      filtered = filtered.filter((request) => request.bloodGroup === filterBloodGroup);
    }

    // Filter by Blood Bank Name
    if (filterBloodBankName) {
      filtered = filtered.filter((request) =>
        (request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || '').toLowerCase().includes(filterBloodBankName.toLowerCase())
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const aDate = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.requestedAt || b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [sentRequests, statusFilter, sortOrder, filterMRID, filterPatientName, filterDonorName, filterDate, filterBloodGroup, filterBloodBankName]);

  const filteredReceivedRequests = useMemo(() => {
    let filtered = receivedRequests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Filter by MRID
    if (filterMRID) {
      filtered = filtered.filter((request) =>
        (request.patientId?.mrid || request.patientMRID || '').toLowerCase().includes(filterMRID.toLowerCase())
      );
    }

    // Filter by Patient Name
    if (filterPatientName) {
      filtered = filtered.filter((request) =>
        (request.patientId?.name || request.patientUsername || '').toLowerCase().includes(filterPatientName.toLowerCase())
      );
    }

    // Filter by Donor Name (requester in received requests)
    if (filterDonorName) {
      filtered = filtered.filter((request) =>
        (request.senderId?.username || request.requesterId?.username || request.requesterUsername || request.senderId?.name || '').toLowerCase().includes(filterDonorName.toLowerCase())
      );
    }

    // Filter by Date
    if (filterDate) {
      filtered = filtered.filter((request) => {
        const requestDate = request.requestedAt ? new Date(request.requestedAt).toISOString().split('T')[0] : '';
        return requestDate === filterDate;
      });
    }

    // Filter by Blood Group
    if (filterBloodGroup !== 'all') {
      filtered = filtered.filter((request) => request.bloodGroup === filterBloodGroup);
    }

    // Filter by Blood Bank Name
    if (filterBloodBankName) {
      filtered = filtered.filter((request) =>
        (request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || '').toLowerCase().includes(filterBloodBankName.toLowerCase())
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const aDate = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.requestedAt || b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [receivedRequests, statusFilter, sortOrder, filterMRID, filterPatientName, filterDonorName, filterDate, filterBloodGroup, filterBloodBankName]);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { userId: localStorage.getItem('userId') });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    // Fetch profile data on mount for avatar display
    fetchProfileData();

    // Check for reschedule notifications on mount (after login)
    fetchRescheduleNotifications();

    // Initial donor fetch
    if (activeTab === "findDonors") {
      const e = { preventDefault: () => { } };
      handleSearch(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "myRequests") {
      fetchRequests();
      fetchReceivedRequests();
    }
    // Profile and Settings tabs have been removed
  }, [activeTab]);



  // Polling to keep My Requests up-to-date in near real-time
  useEffect(() => {
    if (activeTab !== "myRequests") return;
    const id = setInterval(() => {
      fetchRequests();
      fetchReceivedRequests();
    }, 10000); // every 10s
    return () => clearInterval(id);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "searchByMrid" || activeTab === "myRequests") {
      api.get('/bloodbank/all').then(res => {
        if (res.data.success) {
          setBloodBanks(res.data.data || []);
        }
      }).catch(err => console.error("Failed to fetch blood banks:", err));
    }
  }, [activeTab]);

  // Fetch available patients and blood banks for request
  const fetchPatientsAndBloodBanks = async () => {
    try {
      const patientsRes = await api.get('/patients');

      console.log('📊 Patients Response:', patientsRes.data);

      if (patientsRes.data.success) {
        const patientsData = patientsRes.data.data || patientsRes.data.patients || [];
        console.log('✅ Patients loaded:', patientsData.length);
        setPatients(patientsData);
      }

      // Fetch blood banks
      try {
        const bbRes = await api.get('/bloodbank/all');
        console.log('🏥 Blood Banks Response:', bbRes.data);
        if (bbRes.data.success) {
          setBloodBanks(bbRes.data.data || []);
        } else {
          setBloodBanks([]);
        }
      } catch (bbError) {
        console.error('❌ Error fetching blood banks:', bbError);
        setBloodBanks([]);
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      console.error('Error details:', error.response?.data);
      // Ensure UI has empty blood banks when feature removed
      setBloodBanks([]);
    }
  };

  // Open request modal with donor information
  const openRequestModal = (donor) => {
    if (!donor.bloodGroup) {
      alert('Donor blood group not available');
      return;
    }
    if (!["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].includes(donor.bloodGroup)) {
      alert('Invalid blood group');
      return;
    }
    setRequestModal(donor);

    // Auto-fill patient details if coming from MRID search
    if (searchMode === 'mrid' && mrid) {
      setPatientSearchMRID(mrid);
      setPatientSearchBloodBank(mridBloodBankFilter || '');
    } else {
      setPatientSearchMRID('');
      setPatientSearchBloodBank('');
    }

    fetchPatientsAndBloodBanks();
  };

  // Send request with full details
  const sendRequest = async () => {
    if (!requestModal) return;

    // Validate patient is selected
    if (!selectedPatient) {
      alert('⚠️ Please select a patient before sending the request!');
      return;
    }

    // Get patient details for confirmation
    const allPatients = [...searchedPatients, ...patients];
    const patient = allPatients.find(p => p._id === selectedPatient);

    // Validate Blood Bank is present
    const bbId = patient?.bloodBankId?._id || patient?.bloodBankId || patient?.hospital_id || patientSearchBloodBank;
    const resolvedBB = bbId ? bloodBanks.find(b => b._id === bbId) : null;
    let bbName = patient?.bloodBankId?.name || patient?.bloodBankName || resolvedBB?.name;

    // Fallback: If we have an ID but no name found, use the ID as the name (handles cases where ID is the name)
    if (bbId && !bbName) {
      bbName = bbId;
    }

    if (!bbId) {
      alert('⚠️ Unable to identify Blood Bank for this patient. Please ensure a Blood Bank is selected.');
      return;
    }

    try {
      setRequestingId(requestModal._id);
      const body = {
        bloodGroup: requestModal.bloodGroup,
        patientId: selectedPatient,
        bloodBankId: bbId // Explicitly send the resolved blood bank ID
      };

      // Debug logging
      console.log('📤 Sending donation request:');
      console.log('  Donor ID:', requestModal._id);
      console.log('  Patient ID:', selectedPatient);
      console.log('  Patient Name:', patient?.name || patient?.patientName);
      console.log('  Patient MRID:', patient?.mrid);
      console.log('  Blood Bank:', bbName);
      console.log('  Request Body:', body);

      const res = await api.post(`/donors/${requestModal._id}/requests`, body);

      console.log('✅ Request response:', res.data);

      if (res.data.success) {
        const successMsg = patient
          ? `✅ Request sent successfully!\n\n👤 Patient: ${patient.name || patient.patientName}\n🔢 MRID: ${patient.mrid}\n🏥 Blood Bank: ${bbName || 'N/A'}`
          : `Request sent successfully!\n🏥 Blood Bank: ${bbName || 'N/A'}`;

        alert(successMsg);

        // Close modal and reset
        setRequestModal(null);
        setSelectedPatient('');
        setSelectedBloodBank('');
        setPatientSearchMRID('');
        setPatientSearchBloodBank('');
        // Refresh the requests lists
        fetchRequests();
        fetchReceivedRequests();
      } else {
        alert(res.data.message || 'Failed to send request');
      }
    } catch (e) {
      console.error('❌ Error sending request:', e);
      console.error('Error response:', e?.response?.data);
      alert(e?.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestingId(null);
    }
  };

  const handleStatusChange = (requestId, newStatus) => {
    setNewStatuses(prev => ({ ...prev, [requestId]: newStatus }));
  };

  const handleUpdateStatus = async (requestId) => {
    const newStatus = newStatuses[requestId];
    if (!newStatus) {
      addNotification('Please select a status', 'error');
      return;
    }
    try {
      setUpdatingId(requestId);
      const res = await api.put(`/donors/requests/${requestId}/status`, { status: newStatus });
      if (res.data.success) {
        addNotification('Status updated successfully', 'success');
        // Refresh the requests lists
        fetchRequests();
        fetchReceivedRequests();
        setNewStatuses(prev => ({ ...prev, [requestId]: undefined }));
      } else {
        addNotification(res.data.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      addNotification(e?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }
    try {
      setUpdatingId(requestId);
      const res = await api.put(`/donors/requests/${requestId}/status`, { status: 'cancelled' });
      if (res.data.success) {
        addNotification('Request cancelled successfully', 'success');
        // Refresh the requests lists
        fetchRequests();
        fetchReceivedRequests();
      } else {
        addNotification(res.data.message || 'Failed to cancel request', 'error');
      }
    } catch (e) {
      addNotification(e?.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setUpdatingId(requestId);
      const res = await api.put(`/donors/requests/${requestId}/status`, { status: 'accepted' });
      if (res.data.success) {
        alert('Request accepted successfully');
        // Refresh the requests lists
        fetchRequests();
        fetchReceivedRequests();
      } else {
        alert(res.data.message || 'Failed to accept request');
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to accept request');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setUpdatingId(requestId);
      const res = await api.put(`/donors/requests/${requestId}/status`, { status: 'rejected' });
      if (res.data.success) {
        alert('Request rejected successfully');
        // Refresh the requests lists
        fetchRequests();
        fetchReceivedRequests();
      } else {
        alert(res.data.message || 'Failed to reject request');
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to reject request');
    } finally {
      setUpdatingId(null);
    }
  };

  const [bookingModal, setBookingModal] = useState(null); // For booking modal
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState(false); // Show medical consent form
  const [consentData, setConsentData] = useState(null); // Stored consent form data
  const [requestModal, setRequestModal] = useState(null); // For enhanced request modal
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false); // Avatar menu dropdown
  const [showProfileModal, setShowProfileModal] = useState(false); // Profile modal
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Settings modal
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }); // Password change data
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [patients, setPatients] = useState([]); // Available patients
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientSearchMRID, setPatientSearchMRID] = useState(''); // For MRID search
  const [patientSearchBloodBank, setPatientSearchBloodBank] = useState(''); // For blood bank filter
  const [searchedPatients, setSearchedPatients] = useState([]); // Patients from database search
  const [searchingPatients, setSearchingPatients] = useState(false); // Loading state for search

  // Function to search patients in database by blood bank and MRID
  const searchPatientsInDatabase = async (bloodBankId, mrid) => {
    if (!bloodBankId && !mrid) {
      setSearchedPatients([]);
      return;
    }

    try {
      setSearchingPatients(true);
      console.log('🔍 Searching database for patients:');
      console.log('  Blood Bank ID:', bloodBankId);
      console.log('  MRID:', mrid);

      const params = new URLSearchParams();
      if (bloodBankId) params.append('bloodBankId', bloodBankId);
      if (mrid) params.append('mrid', mrid);

      // Use the newly created /patients/search endpoint
      const res = await api.get(`/patients/search?${params.toString()}`);

      if (res.data.success) {
        console.log('✅ Found patients:', res.data.count);
        setSearchedPatients(res.data.data);

        // Auto-select if only one patient found
        if (res.data.count === 1) {
          const patient = res.data.data[0];
          console.log('🎯 Auto-selecting patient:', patient.name || patient.patientName, '| MRID:', patient.mrid);
          setSelectedPatient(patient._id);

          // Ensure blood bank dropdown matches the auto-selected patient
          const bbId = patient.bloodBankId?._id || patient.bloodBankId || patient.hospital_id;
          if (bbId && bbId !== patientSearchBloodBank) {
            setPatientSearchBloodBank(bbId);
          }
        }
      } else {
        setSearchedPatients([]);
      }
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      // Fallback: don't clear, maybe user is offline or API error, let local filter handle it if possible
    } finally {
      setSearchingPatients(false);
    }
  };


  // Trigger database search when blood bank or MRID changes
  useEffect(() => {
    // Only search if we have at least one filter active
    if (patientSearchBloodBank || patientSearchMRID) {
      const timeoutId = setTimeout(() => {
        searchPatientsInDatabase(patientSearchBloodBank, patientSearchMRID);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchedPatients([]);
    }
  }, [patientSearchBloodBank, patientSearchMRID]);

  // Auto-selection Logic: Reacts to search results or filter changes
  useEffect(() => {
    // Determine the source of patients: Search results take precedence
    const sourcePatients = searchedPatients.length > 0 ? searchedPatients : patients;

    if (sourcePatients.length === 0) return;

    // Filter purely based on current criteria to find a unique match
    const filteredPatients = sourcePatients.filter(p => {
      const bbId = p.bloodBankId?._id || p.bloodBankId || p.hospital_id;

      // 1. Blood Bank Match (if selected)
      const matchesBloodBank = !patientSearchBloodBank || bbId === patientSearchBloodBank;

      // 2. MRID Match (if entered)
      const matchesMRID = !patientSearchMRID || (p.mrid && p.mrid.toLowerCase().includes(patientSearchMRID.toLowerCase()));

      return matchesBloodBank && matchesMRID;
    });

    // Auto-Select Logic
    if (filteredPatients.length === 1) {
      const patient = filteredPatients[0];

      // Only select if not already selected to avoid loops
      if (selectedPatient !== patient._id) {
        console.log('🎯 Auto-selecting patient:', patient.name);
        setSelectedPatient(patient._id);
      }

      // Auto-fill Blood Bank ONLY if not already selected
      const bbId = patient.bloodBankId?._id || patient.bloodBankId || patient.hospital_id;
      if (bbId && !patientSearchBloodBank) {
        console.log('🏥 Auto-selecting Blood Bank from Patient:', bbId);
        setPatientSearchBloodBank(bbId);
      }
    }
  }, [searchedPatients, patients, patientSearchBloodBank, patientSearchMRID]);


  // Generate booking confirmation PDF with QR code
  const generateBookingPDF = async (bookingData) => {
    try {
      const doc = new jsPDF();

      // Header - Booking Confirmation
      doc.setFillColor(220, 38, 38); // Red background
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('BOOKING CONFIRMATION', 105, 18, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text('Blood Donation Appointment', 105, 28, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Token Number (Large and prominent)
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`Token #${bookingData.tokenNumber || 'PENDING'}`, 105, 52, { align: 'center' });

      // Generate QR Code
      const qrData = JSON.stringify({
        token: bookingData.tokenNumber || 'PENDING',
        donor: bookingData.donorName,
        bloodGroup: bookingData.bloodGroup,
        date: bookingData.date,
        time: bookingData.time,
        bloodBank: bookingData.bloodBankName,
        patientMRID: bookingData.patientMRID
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Add QR Code (centered)
      doc.addImage(qrCodeDataUrl, 'PNG', 55, 60, 100, 100);

      // Booking Details Section
      let yPos = 170;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Appointment Details:', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      // Two column layout
      const leftX = 20;
      const rightX = 110;

      // Left column
      doc.setFont(undefined, 'bold');
      doc.text('Date & Time:', leftX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(`${new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, leftX, yPos + 5);
      doc.text(`Time: ${bookingData.time}`, leftX, yPos + 10);

      // Right column
      doc.setFont(undefined, 'bold');
      doc.text('Blood Group:', rightX, yPos);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(16);
      doc.text(bookingData.bloodGroup || 'N/A', rightX, yPos + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      yPos += 20;

      // Donor Details
      doc.setFont(undefined, 'bold');
      doc.text('Donor Information:', leftX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${bookingData.donorName}`, leftX, yPos + 5);
      doc.text(`Phone: ${bookingData.donorPhone || 'N/A'}`, leftX, yPos + 10);

      // Patient Details
      doc.setFont(undefined, 'bold');
      doc.text('Patient Information:', rightX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${bookingData.patientName || 'N/A'}`, rightX, yPos + 5);
      doc.text(`MRID: ${bookingData.patientMRID || 'N/A'}`, rightX, yPos + 10);

      yPos += 20;

      // Blood Bank Details
      doc.setFont(undefined, 'bold');
      doc.text('Blood Bank:', leftX, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(bookingData.bloodBankName || 'N/A', leftX, yPos + 5);
      doc.text(bookingData.bloodBankAddress || '', leftX, yPos + 10);
      doc.text(`Phone: ${bookingData.bloodBankPhone || 'N/A'}`, leftX, yPos + 15);

      yPos += 25;

      // Important Instructions
      doc.setFillColor(255, 248, 220);
      doc.rect(15, yPos, 180, 25, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.rect(15, yPos, 180, 25, 'S');

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Important Instructions:', 20, yPos + 6);
      doc.setFont(undefined, 'normal');
      doc.text('• Please arrive 15 minutes before your scheduled time', 20, yPos + 11);
      doc.text('• Bring a valid ID and this confirmation', 20, yPos + 15);
      doc.text('• Ensure you have eaten and are well hydrated', 20, yPos + 19);

      // Footer
      yPos += 30;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated: ' + new Date().toLocaleString(), 105, yPos, { align: 'center' });
      doc.text('Thank you for saving lives! 💉', 105, yPos + 5, { align: 'center' });

      // Save PDF
      const fileName = `booking_confirmation_${bookingData.tokenNumber || Date.now()}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Your booking is still confirmed!');
      return false;
    }
  };

  const handleBookSlot = async (request) => {
    // Open booking modal with request details
    setBookingModal(request);
    setBookingBloodBankId(request.bloodBankId?._id || request.bloodBankId || '');
    // Set minimum date to 3 hours from now
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 3);
    setSelectedDate(minDate.toISOString().split('T')[0]);
  };

  // Step 1: Validate and show consent form
  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    const bookingDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
    const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    if (bookingDateTime < minTime) {
      alert('Booking must be at least 3 hours from now');
      return;
    }

    if (bookingDateTime > maxTime) {
      alert('Booking cannot be more than 7 days from now');
      return;
    }

    // Show consent form
    setShowConsentForm(true);
  };

  // Step 2: Proceed with booking after consent
  const proceedWithBooking = async (medicalConsentData) => {
    try {
      setBookingLoading(true);
      setShowConsentForm(false);
      setConsentData(medicalConsentData); // Store consent data

      // Create booking using the direct-book-slot endpoint
      const bookingData = {
        donorId: bookingModal?.donorId?._id || bookingModal?.donorId,
        bloodBankId: bookingModal?.bloodBankId?._id || bookingModal?.bloodBankId || bookingBloodBankId,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        donationRequestId: bookingModal?._id,
        patientName: bookingModal?.patientId?.name || 'N/A',
        donorName: bookingModal?.donorId?.name || bookingModal?.donorId?.userId?.username || 'N/A',
        requesterName: bookingModal?.requesterId?.username || bookingModal?.senderId?.username || 'N/A',
        medicalConsent: medicalConsentData // Include consent data
      };

      const res = await api.post('/users/direct-book-slot', bookingData);

      if (res.data.success) {
        alert(`✅ Booking Confirmed!\n\nToken: ${res.data.data.tokenNumber}\nDate: ${selectedDate}\nTime: ${selectedTime}`);
        setBookingModal(null);
        setSelectedDate('');
        setSelectedTime('');
        // Refresh requests to update status
        fetchRequests();
      } else {
        alert(res.data.message || 'Booking failed');
      }

    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };



  // Handle consent form cancellation
  const handleConsentCancel = () => {
    setShowConsentForm(false);
    alert('Booking cancelled. Please complete the medical consent form to proceed.');
  };

  // Fetch user profile data
  const fetchProfileData = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      const res = await api.put('/users/me', {
        name: profileData.name,
        phone: profileData.phone,
      });
      if (res.data.success) {
        alert('Profile updated successfully');
        fetchProfileData(); // Refresh data
      } else {
        alert(res.data.message || 'Failed to update profile');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alert('Please fill in all password fields');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        alert('New password must be at least 8 characters long');
        return;
      }

      setUpdatingPassword(true);
      const res = await api.put('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        alert('✅ Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowProfileModal(false);
      } else {
        alert(res.data.message || 'Failed to update password');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle account suspension
  const handleSuspendAccount = async () => {
    const confirmSuspend = window.confirm(
      'Are you sure you want to suspend your account for 3 months? You will be logged out and cannot access your account until the suspension period ends.'
    );
    if (!confirmSuspend) return;

    try {
      setDeletingAccount(true); // Reuse the loading state
      const res = await api.post('/users/me/suspend');
      if (res.data.success) {
        alert('Account suspended successfully. You will be logged out.');
        localStorage.clear();
        navigate('/login');
      } else {
        alert(res.data.message || 'Failed to suspend account');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to suspend account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Handle account unsuspension
  const handleUnsuspendAccount = async () => {
    const confirmUnsuspend = window.confirm(
      'Are you sure you want to unsuspend your account? You will regain full access to your account.'
    );
    if (!confirmUnsuspend) return;

    try {
      setDeletingAccount(true); // Reuse the loading state
      const res = await api.post('/users/me/unsuspend');
      if (res.data.success) {
        alert('Account unsuspended successfully.');
        fetchProfileData(); // Refresh profile data
      } else {
        alert(res.data.message || 'Failed to unsuspend account');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to unsuspend account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    );
    if (!confirmDelete) return;

    try {
      setDeletingAccount(true);
      const res = await api.delete('/users/me');
      if (res.data.success) {
        alert('Account deleted successfully');
        localStorage.clear();
        navigate('/login');
      } else {
        alert(res.data.message || 'Failed to delete account');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Helper to resolve blood bank name
  const resolveBloodBankName = (req) => {
    if (req.bloodBankId?.name) return req.bloodBankId.name;
    if (req.bloodBankName) return req.bloodBankName;

    // Look up via patient's hospital_id
    const bbId = req.patientId?.hospital_id || req.patientId?.bloodBankId;
    if (bbId && bloodBanks.length > 0) {
      const bb = bloodBanks.find(b => b._id === bbId || b.hospital_id === bbId);
      if (bb) return bb.name;
    }
    return 'Not Specified';
  };

  return (
    <Layout>
      {/* Notification System */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-md transition-all duration-300 ${notification.type === 'success'
                ? 'bg-green-500/90 text-white'
                : notification.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-2 text-white/80 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Header with Avatar */}
      <div className="mx-auto w-full max-w-6xl mb-8">
        <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-6 shadow-xl backdrop-blur-2xl transition dark:border-white/10">
          <div className="flex items-center gap-6">
            {/* Avatar with Dropdown */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/20 hover:ring-pink-300 transition-all cursor-pointer overflow-hidden"
              >
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profileData.name ? profileData.name.charAt(0).toUpperCase() : loginUsername.charAt(0).toUpperCase()}</span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showAvatarDropdown && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white">{profileData.name || loginUsername}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{profileData.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowAvatarDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-xl">👤</span>
                    <span className="font-medium">My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/user-settings");
                      setShowAvatarDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-xl">⚙️</span>
                    <span className="font-medium">Settings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {profileData.name || loginUsername || 'User'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {profileData.email || 'Manage your profile, find donors, and track donation requests'}
              </p>
              <div className="flex gap-3 mt-2">
                {profileData.phone && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    📱 {profileData.phone}
                  </span>
                )}
                {profileData.role && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold">
                    👤 {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex gap-4">
              <div className="text-center px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{sentRequests.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Sent</div>
              </div>
              <div className="text-center px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{receivedRequests.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Received</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap bg-white/20 rounded-full p-1 backdrop-blur-md gap-1">
          <button
            onClick={() => setActiveTab("findDonors")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "findDonors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            🔍 Find Donors
          </button>
          <button
            onClick={() => setActiveTab("searchByMrid")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "searchByMrid" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            🆔 Search by MRID
          </button>
          <button
            onClick={() => setActiveTab("myRequests")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "myRequests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            📋 My Requests
          </button>
          <button
            onClick={() => setActiveTab("leaveReviews")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "leaveReviews" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            ⭐ Leave Reviews
          </button>
        </div>
      </div>

      {activeTab === "myRequests" && receivedRequests.length > 0 && (
        <div className="mx-auto w-full max-w-4xl bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          You have {receivedRequests.length} new requests received.
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
        {activeTab === "findDonors" && (
          <>
            {/* Search Form */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8 mb-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🔍 Find Blood Donors
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Search for available blood donors in your area
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSearchMode('general')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${searchMode === 'general'
                      ? 'bg-white dark:bg-gray-700 shadow-md text-pink-600 dark:text-pink-400 transform scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    General Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('mrid')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${searchMode === 'mrid'
                      ? 'bg-white dark:bg-gray-700 shadow-md text-pink-600 dark:text-pink-400 transform scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    ⭕ Search by MRID
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => {
                if (searchMode === 'general') handleSearch(e);
                else handleMridSearch(e);
              }} className="space-y-6">

                {searchMode === 'general' ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Type</label>
                      <select
                        name="bloodGroup"
                        value={searchParams.bloodGroup}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white transition-all focus:bg-white/30"
                      >
                        <option value="" className="text-gray-800">All Blood Types</option>
                        <option value="A+" className="text-gray-800">A+</option>
                        <option value="A-" className="text-gray-800">A-</option>
                        <option value="B+" className="text-gray-800">B+</option>
                        <option value="B-" className="text-gray-800">B-</option>
                        <option value="AB+" className="text-gray-800">AB+</option>
                        <option value="AB-" className="text-gray-800">AB-</option>
                        <option value="O+" className="text-gray-800">O+</option>
                        <option value="O-" className="text-gray-800">O-</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Location</label>
                      <CitySearchDropdown
                        value={searchParams.city}
                        onChange={(city) => setSearchParams(prev => ({ ...prev, city }))}
                        placeholder="Search city with donors..."
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300 transition-all focus:bg-white/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                      <select
                        name="availability"
                        value={searchParams.availability}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white transition-all focus:bg-white/30"
                      >
                        <option value="available" className="text-gray-800">Available Only</option>
                        <option value="all" className="text-gray-800">All Donors</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Bank</label>
                      <select
                        value={mridBloodBankFilter}
                        onChange={(e) => setMridBloodBankFilter(e.target.value)}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white transition-all focus:bg-white/30"
                      >
                        <option value="" className="text-gray-800">Select Blood Bank (Optional)</option>
                        {bloodBanks.map((bb) => (
                          <option key={bb._id} value={bb._id} className="text-gray-800">
                            {bb.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient MRID</label>
                      <input
                        type="text"
                        placeholder="Enter patient MRID"
                        value={mrid}
                        onChange={(e) => setMrid(e.target.value)}
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300 transition-all focus:bg-white/30"
                      />
                    </div>
                  </div>
                )}

                {/* Feedback Messages */}
                {searchMode === 'mrid' && (
                  <>
                    {mridError && (
                      <div className="p-4 rounded-xl bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 animate-fadeIn">
                        ⚠️ {mridError}
                      </div>
                    )}
                    {mridSuccess && (
                      <div className="p-4 rounded-xl bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 animate-fadeIn">
                        ✅ {mridSuccess}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading || mridLoading}
                    className={`inline-flex items-center justify-center rounded-2xl px-10 py-4 font-bold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50
                      ${searchMode === 'general'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-pink-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/30'}`}
                  >
                    <span className="mr-2 text-xl">{searchMode === 'general' ? '🔍' : '🆔'}</span>
                    {loading || mridLoading
                      ? "Searching..."
                      : (searchMode === 'general' ? "Find Donors" : "Find Patient & Donors")}
                  </button>
                </div>
              </form>
            </div>

            {/* Search Results */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🩸 Available Donors ({(mridResults.length > 0 ? mridResults : results).length})
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Donors matching your search criteria
                </p>
              </div>

              {(mridResults.length === 0 && results.length === 0) ? (
                <div className="text-center py-8">
                  {loading ? (
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  ) : (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">No donors found. Try adjusting your search criteria.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(mridResults.length > 0 ? mridResults : results).map((donor) => (
                    <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white">
                            {(donor.userId?.name || donor.name || donor.userId?.username)?.slice(0, 2).toUpperCase() || "NA"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.userId?.name || donor.name || donor.userId?.username || "N/A"}</h4>
                              {donor.eligibilityStatus === 'eligible' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  ✓ Eligible
                                </span>
                              ) : donor.eligibilityStatus === 'not_eligible' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                  ⏳ Wait {donor.nextEligibleDate ? Math.ceil((new Date(donor.nextEligibleDate) - new Date()) / (1000 * 60 * 60 * 24)) : '?'} days
                                </span>
                              ) : null}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p>🩸 Blood Type: {donor.bloodGroup}</p>
                              <p>📍 Location: {donor.houseAddress?.city || "N/A"}</p>
                              <p>⭐ Rating: 4.8/5</p>
                              <p>📅 Last Donation: {donor.lastDonatedDate ? new Date(donor.lastDonatedDate).toLocaleDateString() : "Never"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setContactModalDonor(donor)} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-600 to-gray-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]">
                            <span className="mr-1">📞</span>
                            Contact
                          </button>
                          <button onClick={() => openRequestModal(donor)} disabled={requestingId === donor._id} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 to-purple-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50">
                            <span className="mr-1">❤️</span>
                            Request Donation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Search by MRID Tab */}
        {activeTab === "searchByMrid" && (
          <div className="space-y-6">
            {/* MRID Search Form */}
            <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  🆔 Search Patient by MRID
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Enter a patient's Medical Record ID to view their blood donation status
                </p>
              </div>

              <form onSubmit={handleMridSearch} className="max-w-2xl mx-auto space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
                    Patient MRID *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter patient MRID (e.g., MR12345)"
                    value={mrid}
                    onChange={(e) => setMrid(e.target.value.toUpperCase())}
                    required
                    className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300 uppercase"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
                    Select Blood Bank (Optional)
                  </label>
                  <select
                    value={mridBloodBankFilter}
                    onChange={(e) => setMridBloodBankFilter(e.target.value)}
                    className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  >
                    <option value="" className="text-gray-800">All Blood Banks</option>
                    {bloodBanks.map((bb) => (
                      <option key={bb._id} value={bb._id} className="text-gray-800">
                        {bb.name}
                      </option>
                    ))}
                  </select>
                </div>

                {mridError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{mridError}</p>
                  </div>
                )}

                {mridSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-sm text-green-700 dark:text-green-400">{mridSuccess}</p>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={mridLoading}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-indigo-500/30 active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="mr-2">🔍</span>
                    {mridLoading ? 'Searching...' : 'Search Patient'}
                  </button>
                </div>
              </form>
            </div>

            {/* Donor Results are already shown above in the "Available Donors" section */}

            {/* Optional: Show patient info if you want to display which patient these donors match */}
            {/* {mridResults.length > 0 && ( */}
            {/* Patient info display disabled */}
          </div>
        )}

        {activeTab === "myRequests" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                📋 My Requests
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                View and manage your donation requests
              </p>
            </div>

            {/* Request Type Slider */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
                <button
                  onClick={() => setRequestType('sent')}
                  className={`px-6 py-2 rounded-full font-semibold transition ${requestType === 'sent' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  📤 Sent Requests
                </button>
                <button
                  onClick={() => setRequestType('received')}
                  className={`px-6 py-2 rounded-full font-semibold transition ${requestType === 'received' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  📥 Received Requests
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            ) : (
              <>
                {/* Compact Filter Toggle */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-lg border border-white/30 bg-white/20 dark:border-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/30 dark:hover:bg-white/10 transition"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      🔍 Filters
                      {(statusFilter !== 'all' || filterMRID || filterPatientName || filterDonorName || filterDate || filterBloodGroup !== 'all' || filterBloodBankName) && (
                        <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">Active</span>
                      )}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{showFilters ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* Collapsible Filter Panel */}
                {showFilters && (
                  <div className="mb-4 p-4 rounded-lg border border-white/30 bg-white/20 dark:border-white/10 dark:bg-white/5 backdrop-blur-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Status & Blood Group & Sort */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>

                      <select
                        value={filterBloodGroup}
                        onChange={(e) => setFilterBloodGroup(e.target.value)}
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <option value="all">All Blood Groups</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>

                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        placeholder="Date"
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />

                      {/* Text Filters */}
                      <input
                        type="text"
                        value={filterMRID}
                        onChange={(e) => setFilterMRID(e.target.value)}
                        placeholder="🔢 MRID..."
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-400"
                      />

                      <input
                        type="text"
                        value={filterPatientName}
                        onChange={(e) => setFilterPatientName(e.target.value)}
                        placeholder="👤 Patient name..."
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-400"
                      />

                      <input
                        type="text"
                        value={filterDonorName}
                        onChange={(e) => setFilterDonorName(e.target.value)}
                        placeholder="🩸 Donor name..."
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-400"
                      />

                      <input
                        type="text"
                        value={filterBloodBankName}
                        onChange={(e) => setFilterBloodBankName(e.target.value)}
                        placeholder="🏥 Blood bank..."
                        className="w-full rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    {/* Clear Button */}
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setFilterBloodGroup('all');
                        setSortOrder('desc');
                        setFilterMRID('');
                        setFilterPatientName('');
                        setFilterDonorName('');
                        setFilterBloodBankName('');
                        setFilterDate('');
                      }}
                      className="mt-3 w-full px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-md hover:from-gray-600 hover:to-gray-700 transition font-semibold text-xs"
                    >
                      🔄 Clear All
                    </button>
                  </div>
                )}

                {requestType === 'sent' ? (
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Sent Requests ({filteredRequests.length})</h3>
                    {filteredRequests.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {statusFilter === 'all' ? 'No requests sent yet.' : 'No sent requests match the selected status.'}
                      </p>
                    ) : (
                      <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-700 dark:text-gray-300">
                              <th className="px-2 py-1">ID</th>


                              <th className="px-2 py-1">From</th>
                              <th className="px-2 py-1">To</th>
                              <th className="px-2 py-1">Blood Group</th>
                              <th className="px-2 py-1">Status</th>
                              <th className="px-2 py-1">Requested</th>
                              <th className="px-2 py-1">Active</th>
                              <th className="px-2 py-1">Blood Bank</th>
                              <th className="px-2 py-1">Patient</th>
                              <th className="px-2 py-1">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-800 dark:text-gray-200">
                            {filteredRequests.map((request) => (
                              <tr key={request._id} className="border-t border-white/10 hover:bg-white/5">
                                <td className="px-2 py-1 font-mono text-xs cursor-pointer hover:text-pink-600" onClick={() => setSelectedRequest(request)}>
                                  {request._id.substring(0, 8)}...
                                </td>
                                <td className="px-2 py-1">{loginUsername || 'Me'}</td>
                                <td className="px-2 py-1">{resolveBloodBankName(request) === 'Not Specified' ? (request.patientId?.name || 'Blood Bank') : resolveBloodBankName(request)}</td>
                                <td className="px-2 py-1">{request.bloodGroup}</td>
                                <td className="px-2 py-1">{getStatusBadge(request.status)}</td>
                                <td className="px-2 py-1">{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-2 py-1">{request.isActive ? 'Yes' : 'No'}</td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                    🏥 {resolveBloodBankName(request)}
                                  </span>
                                </td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    👤 {request.patientId?.name || request.patientUsername || 'Not Specified'}
                                    {(request.patientId?.mrid || request.patientMRID) && (
                                      <span className="ml-1 text-xs opacity-75">| MRID: {request.patientId?.mrid || request.patientMRID}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col gap-1 min-w-[180px]">
                                    {request.status === 'pending' && (
                                      <button
                                        onClick={() => handleCancelRequest(request._id)}
                                        disabled={updatingId === request._id}
                                        className="w-full px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
                                      >
                                        🚫 Cancel
                                      </button>
                                    )}
                                    {['accepted', 'booked', 'rejected', 'cancelled', 'completed'].includes(request.status) && (
                                      <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="w-full px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
                                      >
                                        👁️ View
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Received Requests ({filteredReceivedRequests.length})</h3>
                    {filteredReceivedRequests.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {statusFilter === 'all' ? 'No requests received yet.' : 'No received requests match the selected status.'}
                      </p>
                    ) : (
                      <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-700 dark:text-gray-300">
                              <th className="px-2 py-1">ID</th>
                              <th className="px-2 py-1">From</th>
                              <th className="px-2 py-1">Blood Group</th>
                              <th className="px-2 py-1">Status</th>
                              <th className="px-2 py-1">Requested</th>
                              <th className="px-2 py-1">Active</th>
                              <th className="px-2 py-1">Blood Bank</th>
                              <th className="px-2 py-1">Patient</th>
                              <th className="px-2 py-1">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-800 dark:text-gray-200">
                            {filteredReceivedRequests.map((request) => (
                              <tr
                                key={request._id}
                                className="border-t border-white/10 hover:bg-white/5"
                              >
                                <td className="px-2 py-1 font-mono text-xs cursor-pointer hover:text-pink-600" onClick={() => setSelectedRequest(request)}>
                                  {request._id.substring(0, 8)}...
                                </td>
                                <td className="px-2 py-1">{request.senderId?.username || request.requesterId?.username || request.senderId?.name || 'System/Blood Bank'}</td>
                                <td className="px-2 py-1">{request.bloodGroup}</td>
                                <td className="px-2 py-1">{getStatusBadge(request.status)}</td>
                                <td className="px-2 py-1 text-xs">{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-2 py-1">{request.isActive ? '✓' : '✗'}</td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                    🏥 {resolveBloodBankName(request)}
                                  </span>
                                </td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    👤 {request.patientId?.name || request.patientUsername || 'Not Specified'}
                                    {(request.patientId?.mrid || request.patientMRID) && (
                                      <span className="ml-1 text-xs opacity-75">| MRID: {request.patientId?.mrid || request.patientMRID}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col gap-1 min-w-[180px]">
                                    {request.status === 'pending' && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleAccept(request._id)}
                                          disabled={updatingId === request._id}
                                          className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
                                          title="Accept this donation request"
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() => handleReject(request._id)}
                                          disabled={updatingId === request._id}
                                          className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
                                          title="Reject this donation request"
                                        >
                                          ✗ Reject
                                        </button>
                                      </div>
                                    )}
                                    {request.status === 'accepted' && (
                                      <button
                                        onClick={() => setBookingModal(request)}
                                        className="w-full mb-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
                                      >
                                        📅 Book Slot
                                      </button>
                                    )}
                                    {['accepted', 'booked', 'rejected', 'cancelled', 'completed'].includes(request.status) && (
                                      <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="w-full px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
                                      >
                                        👁️ View
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "leaveReviews" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                ⭐ Leave Reviews
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Share your experience and help others
              </p>
            </div>
            <ReviewTab />
          </div>
        )}

        {/* Profile and Settings tabs have been removed */}

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Request Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request ID</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedRequest._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.requesterId?.name || selectedRequest.requesterId?.username || selectedRequest.senderId?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.bloodGroup}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <div className="text-gray-900 dark:text-white">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requested At</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : (selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleString() : 'N/A')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Active</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.isActive ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Bank</label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      🏥 {selectedRequest.bloodBankId?.name || selectedRequest.bloodBankName || selectedRequest.bloodBankUsername || 'Not Specified'}
                    </p>
                    {selectedRequest.bloodBankId?.address && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        📍 {selectedRequest.bloodBankId.address}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      👤 {selectedRequest.patientId?.patientName || selectedRequest.patientId?.name || selectedRequest.patientUsername || 'Not Specified'}
                    </p>
                    {selectedRequest.patientId?.mrid && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        🆔 MRID: {selectedRequest.patientId.mrid}
                      </p>
                    )}
                  </div>
                  {selectedRequest.patientId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Blood Group</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.patientId.bloodGroup || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Units Needed</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.patientId.requiredUnits || selectedRequest.patientId.unitsNeeded || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Needed</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.patientId.requiredDate ? new Date(selectedRequest.patientId.requiredDate).toLocaleDateString() : (selectedRequest.patientId.dateNeeded ? new Date(selectedRequest.patientId.dateNeeded).toLocaleDateString() : 'N/A')}</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedRequest.status === 'booked' && selectedRequest.bookingId && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl dark:bg-green-900/20 dark:border-green-800">
                    <h4 className="font-bold text-green-800 dark:text-green-300 mb-2">✅ Booking Confirmed</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Token Number</span>
                        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                          {selectedRequest.bookingId.tokenNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Date & Time</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedRequest.bookingId.date} at {selectedRequest.bookingId.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { handleAccept(selectedRequest._id); setSelectedRequest(null); }}
                      disabled={updatingId === selectedRequest._id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === selectedRequest._id ? 'Accepting...' : 'Accept Request'}
                    </button>
                    <button
                      onClick={() => { handleReject(selectedRequest._id); setSelectedRequest(null); }}
                      disabled={updatingId === selectedRequest._id}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {updatingId === selectedRequest._id ? 'Rejecting...' : 'Reject Request'}
                    </button>
                  </>
                )}

                {selectedRequest.status === 'accepted' && (
                  <button
                    onClick={() => {
                      setBookingModal(selectedRequest);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    📅 Book Donation Slot
                  </button>
                )}

                {selectedRequest.status === 'booked' && selectedRequest.bookingId && (
                  <button
                    onClick={async () => {
                      const pdfData = {
                        tokenNumber: selectedRequest.bookingId?.tokenNumber || 'N/A',
                        donorName: selectedRequest.donorId?.name || selectedRequest.donorId?.userId?.username || 'N/A',
                        donorPhone: selectedRequest.donorId?.userId?.phone || selectedRequest.donorId?.contactNumber || '',
                        bloodGroup: selectedRequest.bloodGroup || selectedRequest.donorId?.bloodGroup || 'N/A',
                        patientName: selectedRequest.patientId?.name || selectedRequest.patientName || 'N/A',
                        patientMRID: selectedRequest.patientId?.mrid || selectedRequest.mrid || 'N/A',
                        bloodBankName: selectedRequest.bloodBankId?.name || selectedRequest.bloodBankName || 'N/A',
                        bloodBankAddress: selectedRequest.bloodBankId?.address || '',
                        bloodBankPhone: selectedRequest.bloodBankId?.phone || '',
                        date: selectedRequest.bookingId?.date || 'N/A',
                        time: selectedRequest.bookingId?.time || 'N/A'
                      };
                      await generateBookingPDF(pdfData);
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <span>📕</span>
                    Download Confirmation PDF
                  </button>
                )}

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {contactModalDonor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Contact Donor</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.userId?.username || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.contactNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.emergencyContactNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House Address</label>
                  <p className="text-gray-900 dark:text-white">
                    {(() => {
                      if (!contactModalDonor.houseAddress || typeof contactModalDonor.houseAddress !== 'object') return 'N/A';
                      const addr = contactModalDonor.houseAddress;
                      const parts = [
                        addr.houseName,
                        addr.houseAddress,
                        addr.localBody,
                        addr.city,
                        addr.district,
                        addr.state,
                        addr.pincode
                      ].filter(part => part && typeof part === 'string');
                      return parts.join(', ') || 'N/A';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Address</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.workAddress || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Preference</label>
                  <p className="text-gray-900 dark:text-white">{contactModalDonor.contactPreference || 'phone'}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setContactModalDonor(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {bookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📅 Book Donation Slot</h3>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Request Details</h4>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Request ID:</strong> {bookingModal._id}</p>
                    <p><strong>Blood Group:</strong> {bookingModal.bloodGroup}</p>
                    <p><strong>Patient:</strong> {bookingModal.patientId?.patientName || bookingModal.patientId?.name || 'N/A'}</p>
                    <div>
                      <strong>Blood Bank:</strong>
                      {resolveBloodBankName(bookingModal) !== 'Not Specified' ? (
                        <span> {resolveBloodBankName(bookingModal)}</span>
                      ) : (
                        <select
                          value={bookingBloodBankId}
                          onChange={(e) => setBookingBloodBankId(e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select Blood Bank</option>
                          {bloodBanks.map(bb => (
                            <option key={bb._id} value={bb._id}>{bb.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p><strong>Requester:</strong> {bookingModal.requesterId?.name || bookingModal.requesterId?.username || bookingModal.senderId?.username || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📋 Booking Rules</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Minimum booking: 3 hours from now</li>
                    <li>• Maximum booking: 7 days from now</li>
                    <li>• Blood bank will confirm your appointment</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📅 Select Date *
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🕐 Select Time *
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="09:30">9:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="13:30">1:30 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="14:30">2:30 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="16:30">4:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="17:30">5:30 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || !selectedDate || !selectedTime}
                  className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      📅 Confirm Booking
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setBookingModal(null);
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👤 My Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Profile Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-4 rounded-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {profileData.isSuspended ? '⏸️ Suspended' : '✅ Active'}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📧</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {profileData.isEmailVerified ? '✅ Verified' : '⏳ Pending'}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-4 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl mb-2">👤</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Role</div>
                    <div className="font-bold text-gray-900 dark:text-white capitalize">
                      {profileData.role || 'User'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">✏️ Edit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.name || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email 🔒
                    </label>
                    <input
                      type="email"
                      value={profileData.email || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username 🔒
                    </label>
                    <input
                      type="text"
                      value={profileData.username || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🔐 Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password * (min 8 characters)
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 font-semibold"
                  >
                    {updatingPassword ? '⏳ Updating Password...' : '🔐 Update Password'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 font-semibold"
                >
                  {updatingProfile ? '⏳ Saving...' : '💾 Save Profile'}
                </button>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                >
                  Cancel
                </button>
              </div>

              {profileData.isSuspended && (
                <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded">
                  <p className="font-semibold">⚠️ Account Suspended</p>
                  <p className="text-sm mt-1">
                    Your account is suspended until {profileData.suspendedUntil ? new Date(profileData.suspendedUntil).toLocaleDateString() : 'reactivated'}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Notification Settings */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🔔 Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive donation requests via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive urgent alerts via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'donationReminders', label: 'Donation Reminders', desc: 'Periodic reminders to donate' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsData[item.key]}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🔒 Privacy</h3>
                <div className="space-y-3">
                  {[
                    { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Extra security for your account' },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional emails and updates' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsData[item.key]}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">🎨 Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={settingsData.language}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settingsData.timezone}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('userSettings', JSON.stringify(settingsData));
                    alert('✅ Settings saved successfully!');
                    setShowSettingsModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-pink-700 hover:to-purple-700 font-semibold"
                >
                  💾 Save Settings
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Consent Form */}
      {showConsentForm && bookingModal && (
        <MedicalConsentForm
          onConsent={proceedWithBooking}
          onCancel={handleConsentCancel}
          donorName={bookingModal.donorId?.name || bookingModal.donorId?.userId?.username || 'Donor'}
        />
      )}

      {/* Enhanced Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/30 bg-white p-6 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-800">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              🩸 Send Donation Request
            </h3>

            {/* Donor Information */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Donor Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Name:</strong> {requestModal.name || requestModal.userId?.name || 'N/A'}</p>
                <p><strong>Blood Group:</strong> <span className="text-red-600 dark:text-red-400 font-bold">{requestModal.bloodGroup}</span></p>
                <p><strong>City:</strong> {requestModal.houseAddress?.city || 'N/A'}</p>
                <p><strong>Contact:</strong> {requestModal.contactNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Enhanced Patient Selection with Blood Bank + MRID Search */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🔍 Find Patient by Blood Bank & MRID
              </h3>

              {/* Step 1: Select Blood Bank */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-xl">🏥</span> Step 1: Select Blood Bank
                </label>
                <select
                  value={patientSearchBloodBank}
                  onChange={(e) => setPatientSearchBloodBank(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Select Blood Bank --</option>
                  {bloodBanks && bloodBanks.length > 0 ? (
                    bloodBanks.map(bb => (
                      <option key={bb._id} value={bb._id}>
                        {bb.name || bb.bloodBankName || 'Unnamed Blood Bank'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading blood banks...</option>
                  )}
                </select>
                {/* Debug Info */}
                {bloodBanks.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    ⚠️ No blood banks found. Click "Request Donation" to load blood banks.
                  </p>
                )}
              </div>

              {/* Patient Preview Panel - Shows after blood bank selection or MRID search */}
              {(patientSearchBloodBank || (patientSearchMRID && searchedPatients.length > 0)) && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    {patientSearchMRID
                      ? `Search Results${searchedPatients.length > 0 ? ` (${searchedPatients.length})` : ''}`
                      : `Available Patients in ${bloodBanks.find(bb => bb._id === patientSearchBloodBank)?.name || 'Blood Bank'}`
                    }
                  </h4>
                  {searchingPatients ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Searching database...</p>
                    </div>
                  ) : (() => {
                    // Use searched patients if available (from DB search), otherwise filter from loaded patients
                    let displayPatients = searchedPatients.length > 0
                      ? searchedPatients
                      : patients.filter(p => {
                        const bbId = p.bloodBankId?._id || p.bloodBankId || p.hospital_id;

                        // Debug log for first few checks
                        // console.log(`Checking patient ${p.name}: bbId=${bbId}, searchBB=${patientSearchBloodBank}`);

                        // If no blood bank selected, show all. If selected, must match.
                        // We use weak equality (==) just in case one is string and other is object wrapper
                        // We also check if bbId is included in patientSearchBloodBank if ids look different
                        const matchBB = !patientSearchBloodBank ||
                          bbId == patientSearchBloodBank ||
                          (typeof bbId === 'string' && typeof patientSearchBloodBank === 'string' && bbId === patientSearchBloodBank);

                        // MRID match (if entered)
                        const matchMRID = !patientSearchMRID || (p.mrid && p.mrid.toLowerCase().includes(patientSearchMRID.toLowerCase()));

                        return matchBB && matchMRID;
                      });

                    if (displayPatients.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                          <p className="text-lg">
                            {patientSearchMRID
                              ? `📭 No patients found matching "${patientSearchMRID}"`
                              : '📭 No patients found in this blood bank'}
                          </p>
                          <p className="text-sm mt-2">
                            Check the MRID or Blood Bank selection.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {patientSearchMRID
                            ? `🔍 Found ${displayPatients.length} patient${displayPatients.length !== 1 ? 's' : ''} matching "${patientSearchMRID}"`
                            : `📊 Found ${displayPatients.length} patient${displayPatients.length !== 1 ? 's' : ''}`
                          } - Click to select
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                          {displayPatients.map((patient, index) => (
                            <div
                              key={patient._id}
                              onClick={() => {
                                setPatientSearchMRID(patient.mrid);
                                setSelectedPatient(patient._id);
                                const bbId = patient.bloodBankId?._id || patient.bloodBankId || patient.hospital_id;
                                if (bbId) {
                                  setSelectedBloodBank(bbId);
                                  setPatientSearchBloodBank(bbId);
                                }
                              }}
                              className={`p-3 bg-white dark:bg-gray-800 rounded-lg border ${selectedPatient === patient._id
                                ? 'border-green-500 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                                : 'border-blue-200 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500'
                                } cursor-pointer transition-all hover:shadow-md group`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {selectedPatient === patient._id && (
                                      <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                                    )}
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {index + 1}. {patient.name || patient.patientName}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-bold">
                                      {patient.bloodGroup}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-yellow-900 dark:text-yellow-200 font-bold">
                                      MRID: {patient.mrid}
                                    </span>
                                    {(() => {
                                      // Fix naming display for blood bank
                                      let bbName = null;

                                      // 1. Try populated object
                                      if (patient.bloodBankId && typeof patient.bloodBankId === 'object') {
                                        bbName = patient.bloodBankId.name;
                                      }

                                      // 2. Try looking up ID in bloodBanks list
                                      if (!bbName && patient.hospital_id) {
                                        const matchedBB = bloodBanks.find(bb => bb._id === patient.hospital_id);
                                        if (matchedBB) bbName = matchedBB.name;
                                      }

                                      // 3. Try looking up bloodBankId (if it's a string ID) in bloodBanks list
                                      if (!bbName && patient.bloodBankId && typeof patient.bloodBankId === 'string') {
                                        const matchedBB = bloodBanks.find(bb => bb._id === patient.bloodBankId);
                                        if (matchedBB) bbName = matchedBB.name;
                                      }

                                      return bbName ? <span className="text-xs">🏥 {bbName}</span> : null;
                                    })()}
                                  </div>
                                </div>
                                <div className={`${selectedPatient === patient._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                  <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                                    {selectedPatient === patient._id ? 'Selected ✓' : 'Click to select →'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Step 2: Enter MRID */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-xl">🔍</span> Step 2: Enter Patient MRID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter MRID to search specific patient..."
                  value={patientSearchMRID}
                  onChange={(e) => setPatientSearchMRID(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 Leave empty to see all patients from selected blood bank
                </p>
              </div>

              {/* Step 3: Select Patient from Matching Results */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-xl">👤</span> Step 3: Select Patient
                </label>

                {!patientSearchBloodBank && searchedPatients.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                    ⚠️ Please select a blood bank first OR enter an MRID to see available patients
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedPatient}
                      onChange={(e) => {
                        setSelectedPatient(e.target.value);
                        // Auto-select blood bank from patient
                        // Check both searchedPatients and patients arrays
                        const allPatients = [...searchedPatients, ...patients];
                        const patient = allPatients.find(p => p._id === e.target.value);
                        if (patient) {
                          const bbId = patient.bloodBankId?._id || patient.bloodBankId || patient.hospital_id;
                          if (bbId) {
                            setSelectedBloodBank(bbId);
                            setPatientSearchBloodBank(bbId);
                          }
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      disabled={searchingPatients}
                    >
                      <option value="">
                        {searchingPatients ? '⏳ Searching database...' : '-- Select Patient --'}
                      </option>
                      {(() => {
                        // Use searched patients if available (from DB search), otherwise filter from loaded patients
                        let filteredPatients = searchedPatients.length > 0
                          ? searchedPatients
                          : patients.filter(p => {
                            const bbId = p.bloodBankId?._id || p.bloodBankId || p.hospital_id;
                            return bbId === patientSearchBloodBank;
                          });

                        // If no results
                        if (filteredPatients.length === 0 && !searchingPatients) {
                          return <option value="" disabled>
                            {patientSearchMRID
                              ? `No patients found with MRID "${patientSearchMRID}" in database`
                              : 'No patients found in selected blood bank'}
                          </option>;
                        }

                        // Display filtered patients with complete details
                        return filteredPatients.map(patient => (
                          <option key={patient._id} value={patient._id}>
                            {patient.name || patient.patientName} - {patient.bloodGroup}
                            {patient.mrid ? ` | MRID: ${patient.mrid}` : ''}
                            {(() => {
                              const bbName = patient.bloodBankId?.name || (patient.hospital_id && bloodBanks.find(bb => bb._id === patient.hospital_id)?.name);
                              return bbName ? ` | ${bbName}` : '';
                            })()}
                          </option>
                        ));
                      })()}
                    </select>

                    {/* Results Counter */}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {searchingPatients ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          🔍 Searching database...
                        </span>
                      ) : (() => {
                        // Use searched patients if available
                        let filteredPatients = searchedPatients.length > 0
                          ? searchedPatients
                          : patients.filter(p => {
                            const bbId = p.bloodBankId?._id || p.bloodBankId || p.hospital_id;
                            return bbId === patientSearchBloodBank;
                          });

                        const count = filteredPatients.length;
                        const selectedBB = bloodBanks.find(bb => bb._id === patientSearchBloodBank);
                        // Consider it a DB search if we have searchedPatients
                        const isDbSearch = searchedPatients.length > 0;

                        return (
                          <>
                            {isDbSearch ? '🔍' : '📊'} Found {count} patient{count !== 1 ? 's' : ''}
                            {patientSearchMRID && ` with MRID "${patientSearchMRID}"`}
                            {selectedBB && ` in ${selectedBB.name}`}
                            {isDbSearch && <span className="ml-1 text-blue-600 dark:text-blue-400">(from database)</span>}
                            {count === 1 && patientSearchMRID && (
                              <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                ✅ Auto-selected!
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </p>
                  </>
                )}
              </div>

              {/* Clear Search Button */}
              {(patientSearchMRID || patientSearchBloodBank) && (
                <button
                  onClick={() => {
                    setPatientSearchMRID('');
                    setPatientSearchBloodBank('');
                    setSelectedPatient('');
                  }}
                  className="mb-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1"
                >
                  ✕ Clear search and start over
                </button>
              )}
            </div>

            {/* Selected Patient Details */}
            <div className="mb-4">
              {selectedPatient && (() => {
                // Check both searchedPatients and patients arrays
                const allPatients = [...searchedPatients, ...patients];
                const patient = allPatients.find(p => p._id === selectedPatient);
                // Check if patient was auto-selected (blood bank + MRID both provided)
                const wasAutoSelected = patientSearchBloodBank && patientSearchMRID && searchedPatients.length === 1;

                return patient ? (
                  <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        Patient Selected
                      </h4>
                      {wasAutoSelected && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white animate-pulse">
                          🎯 Auto-Selected (DB Search)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <p className="text-sm"><strong>Name:</strong> {patient.name || patient.patientName}</p>
                      <p className="text-sm"><strong>Blood Group:</strong> <span className="text-red-600 dark:text-red-400 font-bold">{patient.bloodGroup}</span></p>
                      {patient.mrid && <p className="text-sm col-span-2"><strong>MRID:</strong> <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{patient.mrid}</span></p>}
                      {patient.bloodBankId?.name && <p className="text-sm col-span-2"><strong>Blood Bank:</strong> {patient.bloodBankId.name}</p>}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Blood Bank Info (Auto-populated or Display) */}
            {selectedPatient && (() => {
              // Check both searchedPatients and patients arrays
              const allPatients = [...searchedPatients, ...patients];
              const patient = allPatients.find(p => p._id === selectedPatient);

              let bloodBankName = 'Not Specified';
              let bloodBankAddress = '';

              if (patient) {
                // Case 1: bloodBankId is populated object
                if (patient.bloodBankId?.name) {
                  bloodBankName = patient.bloodBankId.name;
                  bloodBankAddress = patient.bloodBankId.address;
                }
                // Case 2: bloodBankId is just an ID string, look up in bloodBanks list
                else if (patient.bloodBankId) {
                  const bb = bloodBanks.find(b => b._id === patient.bloodBankId || b.hospital_id === patient.bloodBankId);
                  if (bb) {
                    bloodBankName = bb.name;
                    bloodBankAddress = bb.address;
                  }
                }
                // Case 3: Fallback fields
                else if (patient.bloodBankName) {
                  bloodBankName = patient.bloodBankName;
                }

                // Case 4: Fallback to selected blood bank in Step 1
                if (bloodBankName === 'Not Specified' && patientSearchBloodBank) {
                  const bb = bloodBanks.find(b => b._id === patientSearchBloodBank);
                  if (bb) {
                    bloodBankName = bb.name;
                    bloodBankAddress = bb.address;
                  }
                }
              }

              return (
                <div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🏥</span>
                    Blood Bank (Auto-selected from Patient)
                  </h4>
                  <p className="text-lg font-bold text-pink-800 dark:text-pink-200">{bloodBankName}</p>
                  {bloodBankAddress && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      📍 {bloodBankAddress}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Request Details Summary */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📋 Request Summary</h4>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>✅ <strong>Donor:</strong> {requestModal.name || requestModal.userId?.name}</li>
                <li>✅ <strong>Blood Group:</strong> {requestModal.bloodGroup}</li>
                <li>
                  {selectedPatient ? (() => {
                    const allPatients = [...searchedPatients, ...patients];
                    const patient = allPatients.find(p => p._id === selectedPatient);
                    return <>✅ <strong>Patient:</strong> {patient?.name || patient?.patientName || 'Selected'}</>;
                  })() : (
                    <>⚠️ <strong>Patient:</strong> Not specified</>
                  )}
                </li>
                <li>
                  {selectedPatient ? (() => {
                    const allPatients = [...searchedPatients, ...patients];
                    const patient = allPatients.find(p => p._id === selectedPatient);
                    return <>✅ <strong>Blood Bank:</strong> {patient?.bloodBankId?.name || 'Auto-selected'}</>;
                  })() : (
                    <>⚠️ <strong>Blood Bank:</strong> Not specified</>
                  )}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={sendRequest}
                disabled={requestingId === requestModal._id}
                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {requestingId === requestModal._id ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Sending Request...
                  </>
                ) : (
                  <>
                    ❤️ Send Donation Request
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRequestModal(null);
                  setSelectedPatient('');
                  setSelectedBloodBank('');
                  setPatientSearchMRID('');
                  setPatientSearchBloodBank('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Tip: Selecting a patient will auto-populate blood bank information and help track the donation request.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/donor-register"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-green-500/30 active:scale-[0.99] mr-4"
        >
          <span className="mr-2">🩸</span>
          Become a Donor
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
        >
          🚪 Logout
        </button>
        <div className="mt-4">
          <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Home
          </Link>
        </div>
      </div>



      {/* Reschedule Notification Modal */}
      {showRescheduleModal && rescheduleNotifications.length > 0 && (
        <RescheduleNotificationModal
          notifications={rescheduleNotifications}
          onClose={() => setShowRescheduleModal(false)}
          onMarkAsRead={markNotificationAsRead}
        />
      )}
    </Layout>
  );
}
