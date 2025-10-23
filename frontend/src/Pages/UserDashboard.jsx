import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';
import ReviewTab from '../components/ReviewTab';

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
  const [mridResults, setMridResults] = useState([]);
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
  const [profileData, setProfileData] = useState({});
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // For request details modal
  const [notifications, setNotifications] = useState([]); // For notifications
  const loginUsername = (typeof window !== 'undefined' && localStorage.getItem('username')) || '';

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
      const res = await api.get(`/donors/search?${query}`);
      if (res.data.success) {
        const node = res?.data?.data;
        const arr = Array.isArray(node) ? node : (node?.data || []);
        setResults(arr);
      } else {
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
    const trimmed = mrid.trim();
    if (!trimmed) {
      setMridError('Please enter a patient MRID to search.');
      setMridSuccess('');
      setMridResults([]);
      return;
    }

    setMridLoading(true);
    setMridError('');
    setMridSuccess('');

    try {
      const response = await api.get(`/donors/searchByMrid/${encodeURIComponent(trimmed)}`);
      // Support both shapes: { data: Donor[] } or { data: { data: Donor[] } }
      const dataNode = response?.data?.data;
      const payload = Array.isArray(dataNode) ? dataNode : (dataNode?.data || []);
      setMridResults(payload);
      if (payload.length === 0) {
        setMridError('No available donors matched this MRID.');
      } else {
        setMridSuccess(`Found ${payload.length} donor${payload.length > 1 ? 's' : ''} for MRID ${trimmed}.`);
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to fetch donors for the provided MRID.';
      setMridError(message);
      setMridResults([]);
    } finally {
      setMridLoading(false);
    }
  };

  // Fetch donation requests sent by the authenticated user
  const fetchRequests = async () => {
    try {
      const username = localStorage.getItem('username');
      const sentRes = await api.get(`/donors/requests/sent?username=${username}`);
      if (sentRes.data.success) {
        setSentRequests(sentRes.data.data);
      } else {
        setSentRequests([]);
      }
    } catch (err) {
      setSentRequests([]);
    }
    setLoading(false);
  };

  // Fetch donation requests received by the authenticated user
  const fetchReceivedRequests = async () => {
    try {
      const receivedRes = await api.get('/donors/requests/all');
      if (receivedRes.data.success) {
        setReceivedRequests(receivedRes.data.data);
      } else {
        setReceivedRequests([]);
      }
    } catch (err) {
      setReceivedRequests([]);
    }
  };

  const filteredRequests = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? sentRequests
      : sentRequests.filter((request) => request.status === statusFilter);

    return filtered.sort((a, b) => {
      const aDate = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.requestedAt || b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [sentRequests, statusFilter, sortOrder]);

  const filteredReceivedRequests = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? receivedRequests
      : receivedRequests.filter((request) => request.status === statusFilter);

    return filtered.sort((a, b) => {
      const aDate = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.requestedAt || b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [receivedRequests, statusFilter, sortOrder]);

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
    if (activeTab === "myRequests") {
      fetchRequests();
      fetchReceivedRequests();

    } else if (activeTab === "profile") {
      fetchProfileData();
    }
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

  // Fetch available patients and blood banks for request
  const fetchPatientsAndBloodBanks = async () => {
    try {
      const [patientsRes, bloodBanksRes] = await Promise.all([
        api.get('/patients'),
        api.get('/bloodbank/approved')
      ]);
      
      console.log('📊 Patients Response:', patientsRes.data);
      console.log('🏥 Blood Banks Response:', bloodBanksRes.data);
      
      if (patientsRes.data.success) {
        const patientsData = patientsRes.data.data || patientsRes.data.patients || [];
        console.log('✅ Patients loaded:', patientsData.length);
        setPatients(patientsData);
      }
      
      if (bloodBanksRes.data.success) {
        const bloodBanksData = bloodBanksRes.data.data || bloodBanksRes.data.bloodBanks || [];
        console.log('✅ Blood Banks loaded:', bloodBanksData.length);
        console.log('🏥 Blood Banks data:', bloodBanksData);
        setBloodBanks(bloodBanksData);
      }
    } catch (error) {
      console.error('❌ Error fetching patients/blood banks:', error);
      console.error('Error details:', error.response?.data);
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
    const patient = patients.find(p => p._id === selectedPatient);
    
    try {
      setRequestingId(requestModal._id);
      const body = {
        bloodGroup: requestModal.bloodGroup,
        patientId: selectedPatient,
      };
      
      // Debug logging
      console.log('📤 Sending donation request:');
      console.log('  Donor ID:', requestModal._id);
      console.log('  Patient ID:', selectedPatient);
      console.log('  Patient Name:', patient?.name || patient?.patientName);
      console.log('  Patient MRID:', patient?.mrid);
      console.log('  Blood Bank:', patient?.bloodBankId?.name);
      console.log('  Request Body:', body);
      
      const res = await api.post(`/donors/${requestModal._id}/requests`, body);
      
      console.log('✅ Request response:', res.data);
      
      if (res.data.success) {
        const successMsg = patient 
          ? `✅ Request sent successfully!\n\n👤 Patient: ${patient.name || patient.patientName}\n🔢 MRID: ${patient.mrid}\n🏥 Blood Bank: ${patient.bloodBankId?.name || 'N/A'}`
          : 'Request sent successfully with patient and blood bank details!';
        
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
  const [requestModal, setRequestModal] = useState(null); // For enhanced request modal
  const [patients, setPatients] = useState([]); // Available patients
  const [bloodBanks, setBloodBanks] = useState([]); // Available blood banks
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedBloodBank, setSelectedBloodBank] = useState('');
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

      const res = await api.get(`/patients/search?${params.toString()}`);
      
      if (res.data.success) {
        console.log('✅ Found patients:', res.data.count);
        setSearchedPatients(res.data.data);
        
        // Auto-select if only one patient found
        if (res.data.count === 1) {
          const patient = res.data.data[0];
          console.log('🎯 Auto-selecting patient:', patient.name, '| MRID:', patient.mrid);
          setSelectedPatient(patient._id);
          setSelectedBloodBank(patient.bloodBankId?._id || patient.bloodBankId);
        } else if (res.data.count === 0) {
          console.log('❌ No patients found matching criteria');
          setSelectedPatient('');
        } else {
          console.log(`📋 Found ${res.data.count} patients - user needs to select one`);
        }
      } else {
        setSearchedPatients([]);
      }
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      setSearchedPatients([]);
    } finally {
      setSearchingPatients(false);
    }
  };

  // Trigger database search when blood bank or MRID changes
  useEffect(() => {
    if (patientSearchBloodBank || patientSearchMRID) {
      // Debounce search by 500ms to avoid too many requests
      const timeoutId = setTimeout(() => {
        searchPatientsInDatabase(patientSearchBloodBank, patientSearchMRID);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchedPatients([]);
    }
  }, [patientSearchBloodBank, patientSearchMRID]);

  // Auto-populate patient when blood bank + MRID uniquely identify a patient
  useEffect(() => {
    console.log('🔍 Auto-selection check triggered:');
    console.log('  Blood Bank Selected:', patientSearchBloodBank);
    console.log('  MRID Entered:', patientSearchMRID);
    console.log('  Total Patients Loaded:', patients.length);
    
    if (!patientSearchBloodBank || !patientSearchMRID || patients.length === 0) {
      console.log('⏸️ Skipping auto-selection (missing criteria)');
      return; // Need both blood bank and MRID to auto-populate
    }

    // Filter patients by blood bank and MRID
    let filteredPatients = patients.filter(p => {
      const bbId = p.bloodBankId?._id || p.bloodBankId;
      const matchesBloodBank = bbId === patientSearchBloodBank;
      const matchesMRID = p.mrid && p.mrid.toLowerCase().includes(patientSearchMRID.toLowerCase());
      
      console.log(`  Checking patient: ${p.name} (MRID: ${p.mrid})`);
      console.log(`    Blood Bank Match: ${matchesBloodBank} (${bbId} === ${patientSearchBloodBank})`);
      console.log(`    MRID Match: ${matchesMRID}`);
      
      return matchesBloodBank && matchesMRID;
    });

    console.log(`📊 Filtered Results: ${filteredPatients.length} patient(s)`);

    // If exactly 1 patient matches, auto-select it
    if (filteredPatients.length === 1) {
      const patient = filteredPatients[0];
      console.log('🎯 Auto-selecting patient:');
      console.log('  Name:', patient.name || patient.patientName);
      console.log('  MRID:', patient.mrid);
      console.log('  Blood Group:', patient.bloodGroup);
      console.log('  Blood Bank:', patient.bloodBankId?.name);
      setSelectedPatient(patient._id);
      setSelectedBloodBank(patient.bloodBankId?._id || patient.bloodBankId);
    } else if (filteredPatients.length === 0) {
      // No matches - clear selection
      console.log('❌ No patients found with MRID:', patientSearchMRID);
      setSelectedPatient('');
    } else {
      // Multiple matches - user needs to choose
      console.log(`📋 Found ${filteredPatients.length} patients with MRID containing "${patientSearchMRID}"`);
      console.log('  Patient options:');
      filteredPatients.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.name || p.patientName} - MRID: ${p.mrid}`);
      });
      // Don't auto-select, let user choose from dropdown
    }
  }, [patients, patientSearchBloodBank, patientSearchMRID]);

  const handleBookSlot = async (request) => {
    // Open booking modal with request details
    setBookingModal(request);
    // Set minimum date to 3 hours from now
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 3);
    setSelectedDate(minDate.toISOString().split('T')[0]);
  };

  const handleConfirmBooking = async () => {
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

    try {
      setBookingLoading(true);

      // Create booking using the direct-book-slot endpoint
      const bookingData = {
        donorId: bookingModal.donorId._id || bookingModal.donorId,
        bloodBankId: bookingModal.bloodBankId._id || bookingModal.bloodBankId,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        donationRequestId: bookingModal._id,
        patientName: bookingModal.patientId?.name || 'N/A',
        donorName: bookingModal.donorId?.name || bookingModal.donorId?.userId?.username || 'N/A',
        requesterName: bookingModal.requesterId?.username || bookingModal.senderId?.username || 'N/A'
      };

      const res = await api.post('/users/direct-book-slot', bookingData);

      if (res.data.success) {
        alert('Booking request sent successfully! The blood bank will confirm your appointment.');
        setBookingModal(null);
        setSelectedDate('');
        setSelectedTime('');
        // Refresh requests
        fetchRequests();
        fetchReceivedRequests();
      } else {
        alert(res.data.message || 'Failed to book slot');
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to book slot');
    } finally {
      setBookingLoading(false);
    }
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

  return (
    <Layout>
      {/* Notification System */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-md transition-all duration-300 ${
                notification.type === 'success' 
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

      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("findDonors")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "findDonors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            🔍 Find Donors
          </button>
          <button
            onClick={() => setActiveTab("searchByMrid")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "searchByMrid" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            🆔 Search by MRID
          </button>
          <button
            onClick={() => setActiveTab("myRequests")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "myRequests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            📋 My Requests
          </button>
          <button
            onClick={() => setActiveTab("leaveReviews")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "leaveReviews" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            ⭐ Leave Reviews
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "profile" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            👤 Profile
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

              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Type</label>
                    <select
                      name="bloodGroup"
                      value={searchParams.bloodGroup}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
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
                    <input
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      value={searchParams.city}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                    <select
                      name="availability"
                      value={searchParams.availability}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                      <option value="available" className="text-gray-800">Available Only</option>
                      <option value="all" className="text-gray-800">All Donors</option>
                    </select>
                  </div>
                </div>

                {/* MRID quick search inside Find Donors tab */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient MRID</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter patient MRID"
                      value={mrid}
                      onChange={(e) => setMrid(e.target.value)}
                      className="flex-1 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleMridSearch}
                      disabled={mridLoading}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-indigo-500/30 active:scale-[0.99] disabled:opacity-50"
                    >
                      <span className="mr-2">🆔</span>
                      {mridLoading ? 'Searching...' : 'Search by MRID'}
                    </button>
                  </div>
                  {mridError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{mridError}</p>
                  )}
                  {mridSuccess && (
                    <p className="mt-2 text-sm text-green-700 dark:text-green-400">{mridSuccess}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="mr-2">🔍</span>
                    {loading ? "Searching..." : "Search Donors"}
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
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">No donors found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(mridResults.length > 0 ? mridResults : results).map((donor) => (
                    <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center font-bold text-lg text-white">
                            {donor.userId?.username?.slice(0, 2).toUpperCase() || "NA"}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.userId?.username || "N/A"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p>🩸 Blood Type: {donor.bloodGroup}</p>
                              <p>📍 Location: {donor.houseAddress?.city || "N/A"}</p>
                              <p>⭐ Rating: 4.8/5</p>
                              <p>📅 Last Donation: {donor.lastDonatedDate ? new Date(donor.lastDonatedDate).toLocaleDateString() : "N/A"}</p>
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
                  className={`px-6 py-2 rounded-full font-semibold transition ${
                    requestType === 'sent' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📤 Sent Requests
                </button>
                <button
                  onClick={() => setRequestType('received')}
                  className={`px-6 py-2 rounded-full font-semibold transition ${
                    requestType === 'received' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200" htmlFor="request-status-filter">
                      Filter by status
                    </label>
                    <select
                      id="request-status-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200" htmlFor="request-sort-order">
                      Sort by date
                    </label>
                    <select
                      id="request-sort-order"
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                      className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                              <th className="px-2 py-1">Issued</th>
                              <th className="px-2 py-1">Active</th>
                              <th className="px-2 py-1">Blood Bank</th>
                              <th className="px-2 py-1">Patient</th>
                              <th className="px-2 py-1">Update Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-800 dark:text-gray-200">
                            {filteredRequests.map((request) => (
                              <tr key={request._id} className="border-t border-white/10">
                                <td className="px-2 py-1 font-mono text-xs">{request._id}</td>
                                <td className="px-2 py-1">{loginUsername || 'Me'}</td>
                                <td className="px-2 py-1">{request.receiverId?.username || request.donorId?.userId?.username || request.donorUsername || request.receiverId?.name || 'N/A'}</td>
                                <td className="px-2 py-1">{request.bloodGroup}</td>
                                <td className="px-2 py-1">{getStatusBadge(request.status)}</td>
                                <td className="px-2 py-1">{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-2 py-1">{request.issuedAt ? new Date(request.issuedAt).toLocaleString() : '—'}</td>
                                <td className="px-2 py-1">{request.isActive ? 'Yes' : 'No'}</td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                    🏥 {request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'Not Specified'}
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
                                <td className="px-2 py-1">
                                  <select
                                    value={newStatuses[request._id] || request.status}
                                    onChange={(e) => handleStatusChange(request._id, e.target.value)}
                                    className="mr-2 px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="pending_booking">Pending Booking</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="booked">Booked</option>
                                  </select>
                                  <button
                                    onClick={() => handleUpdateStatus(request._id)}
                                    disabled={updatingId === request._id}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:opacity-50"
                                  >
                                    {updatingId === request._id ? 'Updating...' : 'Update'}
                                  </button>
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
                              <th className="px-2 py-1">Issued</th>
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
                                className="border-t border-white/10 cursor-pointer hover:bg-white/5"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <td className="px-2 py-1 font-mono text-xs">{request._id}</td>
                                <td className="px-2 py-1">{request.senderId?.username || request.requesterId?.username || request.requesterUsername || request.senderId?.name || 'N/A'}</td>
                                <td className="px-2 py-1">{request.bloodGroup}</td>
                                <td className="px-2 py-1">{getStatusBadge(request.status)}</td>
                                <td className="px-2 py-1">{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-2 py-1">{request.issuedAt ? new Date(request.issuedAt).toLocaleString() : '—'}</td>
                                <td className="px-2 py-1">{request.isActive ? 'Yes' : 'No'}</td>
                                <td className="px-2 py-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                    🏥 {request.bloodBankId?.name || request.bloodBankName || request.bloodBankUsername || 'Not Specified'}
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
                                <td className="px-2 py-1">
                                  {request.status === 'pending' ? (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleAccept(request._id); }}
                                        disabled={updatingId === request._id}
                                        className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                                      >
                                        {updatingId === request._id ? 'Accepting...' : 'Accept'}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleReject(request._id); }}
                                        disabled={updatingId === request._id}
                                        className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                                      >
                                        {updatingId === request._id ? 'Rejecting...' : 'Reject'}
                                      </button>
                                    </div>
                                  ) : request.status === 'accepted' ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleBookSlot(request); }}
                                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                      📅 Book Slot
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-500">{request.status}</span>
                                  )}
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

        {activeTab === "profile" && (
          <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                👤 My Profile
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Update your profile information
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileData.name || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your email"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={profileData.username || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your username"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile}
                  className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {updatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
                {profileData.isSuspended ? (
                  <>
                    <button
                      onClick={handleUnsuspendAccount}
                      disabled={deletingAccount}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {deletingAccount ? 'Unsuspending...' : 'Unsuspend Account'}
                    </button>
                    <div className="flex-1 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                      Account suspended - you can login but won't appear in donor searches
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleSuspendAccount}
                    disabled={deletingAccount}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {deletingAccount ? 'Suspending...' : 'Suspend Account (3 Months)'}
                  </button>
                )}
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}



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
                    <p className="text-gray-900 dark:text-white">{selectedRequest.senderId?.username || 'N/A'}</p>
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
                    <p className="text-gray-900 dark:text-white">{selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issued At</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.issuedAt ? new Date(selectedRequest.issuedAt).toLocaleString() : '—'}</p>
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
                      👤 {selectedRequest.patientId?.name || selectedRequest.patientUsername || 'Not Specified'}
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
                        <p className="text-gray-900 dark:text-white">{selectedRequest.patientId.unitsNeeded || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Needed</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.patientId.dateNeeded ? new Date(selectedRequest.patientId.dateNeeded).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
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
                    <p><strong>Patient:</strong> {bookingModal.patientId?.name || 'N/A'}</p>
                    <p><strong>Blood Bank:</strong> {bookingModal.bloodBankId?.name || bookingModal.bloodBankName || 'N/A'}</p>
                    <p><strong>Requester:</strong> {bookingModal.requesterId?.username || bookingModal.senderId?.username || 'N/A'}</p>
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

              {/* Patient Preview Panel - Shows after blood bank selection */}
              {patientSearchBloodBank && (
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
                    // Use searched patients if MRID is entered, otherwise filter from loaded patients
                    const displayPatients = (patientSearchMRID && searchedPatients.length > 0) 
                      ? searchedPatients 
                      : patients.filter(p => {
                          const bbId = p.bloodBankId?._id || p.bloodBankId;
                          return bbId === patientSearchBloodBank;
                        });

                    if (displayPatients.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                          <p className="text-lg">
                            {patientSearchMRID 
                              ? `📭 No patients found with MRID "${patientSearchMRID}"`
                              : '📭 No patients found in this blood bank'}
                          </p>
                          <p className="text-sm mt-2">
                            {patientSearchMRID 
                              ? 'Try a different MRID or check the blood bank selection.'
                              : 'This blood bank hasn\'t registered any patients yet.'}
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
                                setSelectedBloodBank(patient.bloodBankId?._id || patient.bloodBankId);
                              }}
                              className={`p-3 bg-white dark:bg-gray-800 rounded-lg border ${
                                selectedPatient === patient._id 
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
                                    {patient.bloodBankId?.name && (
                                      <span className="text-xs">🏥 {patient.bloodBankId.name}</span>
                                    )}
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
                
                {!patientSearchBloodBank ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                    ⚠️ Please select a blood bank first to see available patients
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
                        if (patient && patient.bloodBankId) {
                          setSelectedBloodBank(patient.bloodBankId._id || patient.bloodBankId);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      disabled={searchingPatients}
                    >
                      <option value="">
                        {searchingPatients ? '⏳ Searching database...' : '-- Select Patient --'}
                      </option>
                      {(() => {
                        // Use searched patients if MRID is entered, otherwise filter from loaded patients
                        let filteredPatients = (patientSearchMRID && searchedPatients.length > 0) 
                          ? searchedPatients 
                          : patients.filter(p => {
                              const bbId = p.bloodBankId?._id || p.bloodBankId;
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
                            {patient.bloodBankId?.name ? ` | ${patient.bloodBankId.name}` : ''}
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
                        // Use searched patients if MRID is entered
                        let filteredPatients = (patientSearchMRID && searchedPatients.length > 0) 
                          ? searchedPatients 
                          : patients.filter(p => {
                              const bbId = p.bloodBankId?._id || p.bloodBankId;
                              return bbId === patientSearchBloodBank;
                            });
                        
                        const count = filteredPatients.length;
                        const selectedBB = bloodBanks.find(bb => bb._id === patientSearchBloodBank);
                        const isDbSearch = patientSearchMRID && searchedPatients.length > 0;
                        
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
              const bloodBankName = patient?.bloodBankId?.name || 'Not Specified';
              return (
                <div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🏥</span>
                    Blood Bank (Auto-selected from Patient)
                  </h4>
                  <p className="text-lg font-bold text-pink-800 dark:text-pink-200">{bloodBankName}</p>
                  {patient?.bloodBankId?.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      📍 {patient.bloodBankId.address}
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
    </Layout>
  );
}
