import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import DonorSearchForm from "../components/DonorSearchForm";
import UserSearchForm from "../components/UserSearchForm";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import { useChat } from "../context/ChatContext";

/*
// Custom Confirmation Modal Component
const ConfirmationModal_Removed = ({ isOpen, title, message, type = 'confirm', onConfirm, onCancel, inputPlaceholder }) => {
  const [inputValue, setInputValue] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {(type === 'prompt_required' || type === 'prompt_optional') && (
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
            placeholder={inputPlaceholder || "Enter value..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setInputValue(''); onCancel(); }}
            className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (type === 'prompt_required' && !inputValue.trim()) return;
              onConfirm(inputValue);
              setInputValue('');
            }}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={type === 'prompt_required' && !inputValue.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}; */

export default function BloodBankDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // Default to overview
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [bookings, setBookings] = useState([]); // Added for booking display
  const [donors, setDonors] = useState([]);
  const [bloodBankDetails, setBloodBankDetails] = useState(null);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalBooking: 0,
      completedBookings: 0,
      totalPatients: 0,
      fulfilledPatients: 0
    },
    timeBased: {
      today: { bookings: 0 },
      thisWeek: { bookings: 0 },
      thisMonth: { bookings: 0, patients: 0, requests: 0 }
    },
    bloodGroupDistribution: [],
    monthlyTrend: [],
    recentActivity: []
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null); // For reschedule modal
  const [rescheduling, setRescheduling] = useState(false);
  const [tokenSearch, setTokenSearch] = useState(''); // Frontdesk token search
  const [searchedBooking, setSearchedBooking] = useState(null); // Found booking
  const [searchingToken, setSearchingToken] = useState(false); // Loading state
  const [visitedDonors, setVisitedDonors] = useState([]); // Donors who visited
  const [showVisitHistory, setShowVisitHistory] = useState(false); // Toggle visit history view
  const [expandedDonor, setExpandedDonor] = useState(null); // Expanded donor for visit details
  const [allTokens, setAllTokens] = useState([]); // All tokens for selected date
  const [selectedTokenDate, setSelectedTokenDate] = useState(new Date().toISOString().split('T')[0]); // Today's date
  const [loadingTokens, setLoadingTokens] = useState(false); // Loading state for tokens
  const [showAllTokens, setShowAllTokens] = useState(true); // Toggle between search and view all
  const [tokenFilter, setTokenFilter] = useState('today'); // Filter: 'all', 'today', 'date'
  const [downloadFilter, setDownloadFilter] = useState('all'); // Download filter
  const [showDownloadModal, setShowDownloadModal] = useState(false); // Show download options modal
  const [reviews, setReviews] = useState([]); // Reviews for this blood bank
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 }); // Review statistics
  const [loadingReviews, setLoadingReviews] = useState(false); // Loading state for reviews

  // Suggestion: Generic Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm', 'prompt_required', 'prompt_optional'
    onConfirm: () => { },
    inputPlaceholder: ''
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Get user role
  const role = localStorage.getItem('role');

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({ name: '', role: 'frontdesk', email: '', phone: '' });
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    address: {
      houseName: "",
      houseAddress: "",
      pincode: "",
      district: "",
      city: "",
      localBody: "",
      state: ""
    },
    bloodGroup: "",
    mrid: "",
    phoneNumber: "",
    requiredUnits: "",
    requiredDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for users
  const { showToast } = useToast();
  const { startConversation } = useChat();

  // Handle starting a chat with a user
  const handleStartChat = async (userId) => {
    try {
      await startConversation(userId);
      showToast('Chat started!', 'success');
    } catch (error) {
      console.error('Failed to start chat:', error);
      showToast('Failed to start chat', 'error');
    }
  };

  // Safely format address objects for display
  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const { houseName, houseAddress, localBody, city, district, state, pincode } = addr || {};
    return [houseName, houseAddress, localBody, city, district, state, pincode]
      .filter(Boolean)
      .join(', ');
  };

  // Search states for users
  const [searchUsername, setSearchUsername] = useState('');
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [searchUserRole, setSearchUserRole] = useState('');
  const [searchUserDate, setSearchUserDate] = useState('');

  // Search states for donors
  const [searchBloodGroup, setSearchBloodGroup] = useState('');
  const [searchDonorEmail, setSearchDonorEmail] = useState('');
  const [searchPlace, setSearchPlace] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter states for booked slots
  const [filterDate, setFilterDate] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterPatientName, setFilterPatientName] = useState('');
  const [filterPatientMRID, setFilterPatientMRID] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch patients list
  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      if (res.data.success) setPatients(res.data.data);
    } catch (err) {
      // Handle error silently or show notification
      console.error("Failed to fetch patients", err);
    }
  }


  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await api.get('/bloodbank/staff');
      if (res.data.success) {
        setStaffList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Create new staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/bloodbank/staff', newStaffData);
      if (res.data.success) {
        setCreatedStaffCredentials(res.data.data); // Capture credentials including password
        setShowStaffModal(false);
        setShowCredentialsModal(true); // Show success modal
        setNewStaffData({ name: '', role: 'frontdesk', email: '', phone: '' }); // Reset form
        fetchStaff(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to create staff", err);
      showToast(err.response?.data?.message || "Failed to create staff member", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset staff password
  const handleResetPassword = (staffId, staffName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for ${staffName}? The old password will be invalid immediately.`,
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.post(`/bloodbank/staff/${staffId}/reset-password`);
          if (res.data.success) {
            setCreatedStaffCredentials({
              username: res.data.data.username,
              generatedPassword: res.data.data.newPassword
            });
            setShowCredentialsModal(true);
          }
        } catch (err) {
          console.error("Failed to reset password", err);
          showToast(err.response?.data?.message || "Failed to reset password", 'error');
        }
      }
    });
  };

  // Fetch patients list on mount
  // Fetch initial data on mount
  useEffect(() => {
    fetchPatients();
    fetchBloodBankDetails();
    fetchAnalytics();
  }, []);

  // Fetch staff when tab is active
  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab]);

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get("/bloodbank/analytics");
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch blood bank details
  const fetchBloodBankDetails = async () => {
    try {
      const res = await api.get("/bloodbank/details");
      if (res.data.success) setBloodBankDetails(res.data.data);
    } catch (err) {
      console.error("Failed to fetch blood bank details", err);
    }
  };

  // Fetch bookings, donation requests and donors when tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalytics(); // Refresh analytics when overview tab is active
    } else if (activeTab === 'users') {
      fetchUsers(); // Fetch users
    } else if (activeTab === 'bookings') {
      fetchBookings(); // Fetch actual bookings
    } else if (activeTab === 'received') {
      fetchDonationRequests(); // Fetch received donation requests
    } else if (activeTab === 'donors') {
      fetchDonors();
      fetchVisitedDonors(); // Also fetch visited donors with history
    } else if (activeTab === 'reviews') {
      fetchReviews(); // Fetch reviews when reviews tab is active
    }
  }, [activeTab]);

  // Refetch bookings when filters change
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [filterDate, filterBloodGroup, filterPatientName, filterPatientMRID, filterStatus]);

  // Refetch users when filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [searchUsername, searchUserEmail, searchUserRole, searchUserDate]);

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (searchUsername) params.append('username', searchUsername);
      if (searchUserEmail) params.append('email', searchUserEmail);
      if (searchUserRole) params.append('role', searchUserRole);
      if (searchUserDate) params.append('date', searchUserDate);

      const queryString = params.toString();
      const url = queryString ? `/bloodbank/users?${queryString}` : '/bloodbank/users';

      const res = await api.get(url);
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch bookings for "Booked Slots" tab
  const fetchBookings = async () => {
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterBloodGroup) params.append('bloodGroup', filterBloodGroup);
      if (filterPatientName) params.append('patientName', filterPatientName);
      if (filterPatientMRID) params.append('patientMRID', filterPatientMRID);
      if (filterStatus) params.append('status', filterStatus);

      const queryString = params.toString();
      const url = queryString ? `/bloodbank/bookings?${queryString}` : '/bloodbank/bookings';

      const res = await api.get(url);
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  // Fetch donation requests for "Received Requests" tab
  const fetchDonationRequests = async () => {
    try {
      const res = await api.get("/bloodbank/donation-requests");
      if (res.data.success) setDonationRequests(res.data.data);
    } catch (err) {
      console.error("Failed to fetch donation requests", err);
    }
  };

  // Handle accept donation request
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.put(`/bloodbank/donation-requests/${requestId}/status`, { status: "accepted" });
      if (res.data.success) {
        showToast('Request accepted successfully', 'success');
        fetchDonationRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept request', 'error');
    }
  };

  // Handle reject donation request
  const handleRejectRequest = (requestId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Request',
      message: "Are you sure you want to reject this donation request?",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/donation-requests/${requestId}/status`, { status: "rejected" });
          if (res.data.success) {
            showToast('Request rejected successfully', 'success');
            fetchDonationRequests();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to reject request', 'error');
        }
      }
    });
  };

  // Handle delete review
  const handleDeleteReview = (reviewId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Review',
      message: "Are you sure you want to delete this review?",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.delete(`/reviews/${reviewId}`);
          if (res.data.success) {
            showToast('Review deleted successfully', 'success');
            fetchReviews();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete review', 'error');
        }
      }
    });
  };

  // Fetch donors - Always fetch ALL available donors
  const fetchDonors = async () => {
    try {
      const res = await api.get("/bloodbank/donors");
      if (res.data.success) {
        setDonors(res.data.data);
        console.log(`✅ Fetched ${res.data.data.length} donors from database`);
      }
    } catch (err) {
      console.error("Failed to fetch donors", err);
    }
  };

  // Filter donors based on search criteria (client-side filtering)
  const filteredDonors = React.useMemo(() => {
    if (!donors || donors.length === 0) return [];

    return donors.filter(donor => {
      // Filter by blood group
      if (searchBloodGroup && donor.bloodGroup !== searchBloodGroup) {
        return false;
      }

      // Filter by email
      if (searchDonorEmail && !donor.email?.toLowerCase().includes(searchDonorEmail.toLowerCase())) {
        return false;
      }

      // Filter by place (address, district, state)
      if (searchPlace) {
        const searchLower = searchPlace.toLowerCase();
        const addressStr = formatAddress(donor.address).toLowerCase();
        if (!addressStr.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [donors, searchBloodGroup, searchDonorEmail, searchPlace]);

  // Fetch visited donors with their visit history
  const fetchVisitedDonors = async () => {
    try {
      const res = await api.get("/bloodbank/visited-donors");
      if (res.data.success) setVisitedDonors(res.data.data);
    } catch (err) {
      console.error("Failed to fetch visited donors", err);
    }
  };

  // Fetch reviews for this blood bank
  const fetchReviews = async () => {
    if (!bloodBankDetails?._id) return;

    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/bloodbank/${bloodBankDetails._id}`);
      if (res.data.success) {
        setReviews(res.data.data.reviews || []);
        setReviewStats(res.data.data.stats || { averageRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handle confirm booking
  const handleConfirmBooking = (booking) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Booking',
      message: `Confirm booking for ${booking.donorName}?`,
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/bookings/${booking._id}/status`, { status: 'confirmed' });
          if (res.data.success) {
            showToast('Booking confirmed successfully!', 'success');
            fetchBookings(); // Refresh bookings list
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to confirm booking', 'error');
        }
      }
    });
  };

  // Handle reject booking
  const handleRejectBooking = (booking) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Booking',
      message: 'Please enter a reason for rejecting this booking:',
      type: 'prompt_optional',
      inputPlaceholder: "Reason (optional)",
      onConfirm: async (reason) => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/bookings/${booking._id}/status`, {
            status: 'rejected',
            rejectionReason: reason
          });
          if (res.data.success) {
            showToast('Booking rejected', 'success');
            fetchBookings(); // Refresh bookings list
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to reject booking', 'error');
        }
      }
    });
  };

  // Handle reschedule booking
  const handleRescheduleBooking = async (newDate, newTime) => {
    if (!rescheduleModal) return;

    try {
      setRescheduling(true);
      const res = await api.put(`/bloodbank/bookings/${rescheduleModal._id}/reschedule`, {
        newDate,
        newTime
      });

      if (res.data.success) {
        showToast('Booking rescheduled successfully!', 'success');
        setRescheduleModal(null);
        fetchBookings(); // Refresh bookings list
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reschedule booking', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  // Frontdesk: Search booking by token number
  const handleTokenSearch = async () => {
    if (!tokenSearch.trim()) {
      showToast('Please enter a token number', 'warning');
      return;
    }

    try {
      setSearchingToken(true);
      const res = await api.get(`/bloodbank/bookings/token/${tokenSearch.trim()}`);

      if (res.data.success) {
        setSearchedBooking(res.data.data);
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

  // Frontdesk: Fetch all tokens based on filter
  const fetchAllTokens = async () => {
    try {
      setLoadingTokens(true);
      let url = '/bloodbank/bookings';

      // Apply filter
      if (tokenFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `?date=${today}`;
      } else if (tokenFilter === 'date' && selectedTokenDate) {
        url += `?date=${selectedTokenDate}`;
      }
      // If 'all', no date filter applied

      const res = await api.get(url);

      if (res.data.success) {
        setAllTokens(res.data.data || []);
      } else {
        setAllTokens([]);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setAllTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  // Load tokens when filter changes or tab becomes active
  useEffect(() => {
    if (activeTab === 'frontdesk' && showAllTokens) {
      fetchAllTokens();
    }
  }, [activeTab, tokenFilter, selectedTokenDate, showAllTokens]);

  // Download bookings as CSV
  const downloadBookingsCSV = (filterType) => {
    let filteredBookings = [...allTokens];
    let filename = 'bookings';

    // Apply status filters
    switch (filterType) {
      case 'completed':
        filteredBookings = allTokens.filter(b => b.status === 'completed');
        filename = 'completed_bookings';
        break;
      case 'waiting_today': {
        const today = new Date().toISOString().split('T')[0];
        filteredBookings = allTokens.filter(b =>
          b.date === today &&
          b.status !== 'completed' &&
          b.status !== 'rejected'
        );
        filename = 'waiting_today';
        break;
      }
      case 'not_completed':
        filteredBookings = allTokens.filter(b =>
          b.status !== 'completed' &&
          b.status !== 'rejected'
        );
        filename = 'pending_bookings';
        break;
      case 'rejected':
        filteredBookings = allTokens.filter(b => b.status === 'rejected');
        filename = 'rejected_bookings';
        break;
      case 'all':
      default:
        filename = 'all_bookings';
        break;
    }

    if (filteredBookings.length === 0) {
      showToast('No bookings found for the selected filter', 'info');
      return;
    }

    // Add date suffix to filename
    const dateStr = tokenFilter === 'today'
      ? 'today'
      : tokenFilter === 'date'
        ? selectedTokenDate
        : 'all_time';
    filename += `_${dateStr}_${new Date().getTime()}.csv`;

    // Create CSV content
    const headers = [
      'Token Number',
      'Date',
      'Time',
      'Donor Name',
      'Donor Phone',
      'Blood Group',
      'Patient Name',
      'Patient MRID',
      'Status',
      'Arrived',
      'Arrival Time',
      'Completed At',
      'Rejection Reason'
    ];

    const csvRows = [headers.join(',')];

    filteredBookings.forEach(booking => {
      const row = [
        booking.tokenNumber || '',
        booking.date || '',
        booking.time || '',
        `"${booking.donorName || ''}"`,
        booking.donorPhone || '',
        booking.bloodGroup || '',
        `"${booking.patientName || ''}"`,
        booking.patientMRID || '',
        booking.status || '',
        booking.arrived ? 'Yes' : 'No',
        booking.arrivalTime ? new Date(booking.arrivalTime).toLocaleString() : '',
        booking.completedAt ? new Date(booking.completedAt).toLocaleString() : '',
        `"${booking.rejectionReason || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`✅ Downloaded ${filteredBookings.length} booking(s) successfully!`, 'success');
    setShowDownloadModal(false);
  };

  // Download bookings as PDF
  const downloadBookingsPDF = (filterType) => {
    let filteredBookings = [...allTokens];
    let filename = 'bookings';
    let reportTitle = 'Booking Report';

    // Apply status filters
    switch (filterType) {
      case 'completed':
        filteredBookings = allTokens.filter(b => b.status === 'completed');
        filename = 'completed_bookings';
        reportTitle = 'Completed Donations Report';
        break;
      case 'waiting_today': {
        const today = new Date().toISOString().split('T')[0];
        filteredBookings = allTokens.filter(b =>
          b.date === today &&
          b.status !== 'completed' &&
          b.status !== 'rejected'
        );
        filename = 'waiting_today';
        reportTitle = 'Waiting Today Report';
        break;
      }
      case 'not_completed':
        filteredBookings = allTokens.filter(b =>
          b.status !== 'completed' &&
          b.status !== 'rejected'
        );
        filename = 'pending_bookings';
        reportTitle = 'Pending Bookings Report';
        break;
      case 'rejected':
        filteredBookings = allTokens.filter(b => b.status === 'rejected');
        filename = 'rejected_bookings';
        reportTitle = 'Rejected Bookings Report';
        break;
      case 'all':
      default:
        filename = 'all_bookings';
        reportTitle = 'All Bookings Report';
        break;
    }

    if (filteredBookings.length === 0) {
      showToast('No bookings found for the selected filter', 'info');
      return;
    }

    // Add date suffix to filename
    const dateStr = tokenFilter === 'today'
      ? 'today'
      : tokenFilter === 'date'
        ? selectedTokenDate
        : 'all_time';
    filename += `_${dateStr}_${new Date().getTime()}.pdf`;

    // Create PDF
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38); // Red color
    doc.text(reportTitle, 14, 15);

    // Add blood bank name (if available)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Blood Bank: ${bloodBankDetails?.name || 'N/A'}`, 14, 23);

    // Add date range
    let dateRangeText = '';
    if (tokenFilter === 'today') {
      dateRangeText = `Date: Today (${new Date().toLocaleDateString()})`;
    } else if (tokenFilter === 'date') {
      dateRangeText = `Date: ${new Date(selectedTokenDate).toLocaleDateString()}`;
    } else {
      dateRangeText = 'Date: All Time';
    }
    doc.text(dateRangeText, 14, 30);

    // Add report generated time
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    // Add summary stats
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Bookings: ${filteredBookings.length}`, 14, 42);

    // Prepare table data
    const tableData = filteredBookings.map(booking => [
      booking.tokenNumber || 'N/A',
      booking.date || 'N/A',
      booking.time || 'N/A',
      booking.donorName || 'N/A',
      booking.bloodGroup || 'N/A',
      booking.patientName || 'N/A',
      booking.status || 'N/A',
      booking.arrived ? 'Yes' : 'No',
      booking.rejectionReason || '-'
    ]);

    // Add table
    autoTable(doc, {
      head: [['Token', 'Date', 'Time', 'Donor', 'Blood', 'Patient', 'Status', 'Arrived', 'Notes']],
      body: tableData,
      startY: 48,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [220, 38, 38], // Red color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Token
        1: { cellWidth: 25 }, // Date
        2: { cellWidth: 18 }, // Time
        3: { cellWidth: 35 }, // Donor
        4: { cellWidth: 18 }, // Blood
        5: { cellWidth: 35 }, // Patient
        6: { cellWidth: 25 }, // Status
        7: { cellWidth: 18 }, // Arrived
        8: { cellWidth: 'auto' }, // Notes
      },
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(filename);

    showToast(`✅ Downloaded ${filteredBookings.length} booking(s) as PDF successfully!`, 'success');
    setShowDownloadModal(false);
  };

  // Frontdesk: Mark arrival
  const handleMarkArrival = () => {
    if (!searchedBooking) return;

    setConfirmModal({
      isOpen: true,
      title: 'Mark Arrival',
      message: `Mark arrival for ${searchedBooking.donorName}?`,
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
            status: 'confirmed',
            arrived: true,
            arrivalTime: new Date().toISOString()
          });

          if (res.data.success) {
            showToast('Arrival marked successfully!', 'success');
            setSearchedBooking(res.data.data);
            // Refresh token list
            fetchAllTokens();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to mark arrival', 'error');
        }
      }
    });
  };

  // Frontdesk: Mark rejection
  const handleMarkRejection = () => {
    if (!searchedBooking) return;

    setConfirmModal({
      isOpen: true,
      title: 'Reject Token',
      message: 'Please enter a reason for rejection:',
      type: 'prompt_required',
      inputPlaceholder: "Rejection reason",
      onConfirm: async (reason) => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
            status: 'rejected',
            rejectionReason: reason
          });

          if (res.data.success) {
            showToast('Booking rejected', 'success');
            setSearchedBooking(null);
            setTokenSearch('');
            // Refresh token list
            fetchAllTokens();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to reject booking', 'error');
        }
      }
    });
  };

  // Frontdesk: Mark completion
  const handleMarkCompletion = () => {
    if (!searchedBooking) return;

    setConfirmModal({
      isOpen: true,
      title: 'Complete Donation',
      message: `Mark donation as completed for ${searchedBooking.donorName}?`,
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.put(`/bloodbank/bookings/${searchedBooking._id}/status`, {
            status: 'completed',
            completedAt: new Date().toISOString()
          });

          if (res.data.success) {
            showToast('✅ Donation completed! Thank you for saving lives! 🎉', 'success');
            setSearchedBooking(null);
            setTokenSearch('');
            // Refresh token list
            fetchAllTokens();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to mark completion', 'error');
        }
      }
    });
  };

  // Handle user status change
  const handleUserStatusChange = (userId, action, value) => {
    const performUpdate = async (message) => {
      closeConfirmModal();
      let status = {};
      if (action === 'block') {
        status = { isBlocked: value };
      } else if (action === 'suspend') {
        status = { isSuspended: value };
      } else if (action === 'warn') {
        status = { warningMessage: message };
      }

      try {
        const res = await api.put(`/bloodbank/users/${userId}/status`, status);
        if (res.data.success) {
          setUsers(users.map(u => u._id === userId ? res.data.data : u));
          showToast("User status updated successfully", 'success');
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update user status", 'error');
      }
    };

    if (action === 'warn') {
      setConfirmModal({
        isOpen: true,
        title: 'Issue Warning',
        message: 'Enter warning message for the user:',
        type: 'prompt_required',
        inputPlaceholder: "Warning message",
        onConfirm: performUpdate
      });
    } else {
      performUpdate();
    }
  };

  // Handle donor status change
  const handleDonorStatusChange = (donorId, action, value) => {
    const performUpdate = async (message) => {
      closeConfirmModal();
      let status = {};
      if (action === 'block') {
        status = { isBlocked: value };
      } else if (action === 'suspend') {
        status = { isSuspended: value };
      } else if (action === 'warn') {
        status = { warningMessage: message };
      }

      try {
        const res = await api.put(`/bloodbank/donors/${donorId}/status`, status);
        if (res.data.success) {
          setDonors(donors.map(d => d._id === donorId ? res.data.data : d));
          showToast("Donor status updated successfully", 'success');
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update donor status", 'error');
      }
    };

    if (action === 'warn') {
      setConfirmModal({
        isOpen: true,
        title: 'Issue Warning',
        message: 'Enter warning message for the donor:',
        type: 'prompt_required',
        inputPlaceholder: "Warning message",
        onConfirm: performUpdate
      });
    } else {
      performUpdate();
    }
  };

  // Add patient handler
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/patients", {
        patientName: formData.patientName,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        mrid: formData.mrid,
        phoneNumber: formData.phoneNumber,
        requiredUnits: Number(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      });
      if (res.data.success) {
        setPatients([...patients, res.data.patient || res.data.data]);
        setFormData({
          patientName: "",
          address: {
            houseName: "",
            houseAddress: "",
            pincode: "",
            district: "",
            city: "",
            localBody: "",
            state: ""
          },
          bloodGroup: "",
          mrid: "",
          phoneNumber: "",
          requiredUnits: "",
          requiredDate: "",
        });
      } else {
        showToast(res.data.message || "Failed to add patient", 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add patient", 'error');
    }
    setLoading(false);
  };

  // Update patient handler
  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/patients/${editingPatient._id}`, {
        patientName: formData.patientName,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        requiredUnits: Number(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      });
      if (res.data.success) {
        setPatients(
          patients.map((p) =>
            p._id === editingPatient._id ? res.data.updatedPatient : p
          )
        );
        setEditingPatient(null);
        setFormData({
          patientName: "",
          address: {
            houseName: "",
            houseAddress: "",
            pincode: "",
            district: "",
            city: "",
            localBody: "",
            state: ""
          },
          bloodGroup: "",
          mrid: "",
          phoneNumber: "",
          requiredUnits: "",
          requiredDate: "",
        });
      } else {
        showToast(res.data.message || "Failed to update patient", 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update patient", 'error');
    }
    setLoading(false);
  };

  // Delete patient handler (soft delete)
  const handleDeletePatient = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Patient',
      message: "Are you sure you want to delete this patient?",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.delete(`/patients/${id}`);
          if (res.data.success) {
            setPatients(patients.filter((p) => p._id !== id));
            showToast('Patient deleted successfully', 'success');
          } else {
            showToast(res.data.message || "Failed to delete patient", 'error');
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to delete patient", 'error');
        }
      }
    });
  };

  // Restore patient handler
  const handleRestorePatient = async (id) => {
    try {
      const res = await api.post(`/patients/${id}/restore`);
      if (res.data.success) {
        // Refresh patients list after restore
        fetchPatients();
      } else {
        showToast(res.data.message || "Failed to restore patient", 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to restore patient", 'error');
    }
  };

  // Start editing
  const startEditing = (patient) => {
    setEditingPatient(patient);
    setFormData({
      patientName: patient.patientName || patient.name || "",
      address: patient.address || {
        houseName: "",
        houseAddress: "",
        pincode: "",
        district: "",
        city: "",
        localBody: "",
        state: ""
      },
      bloodGroup: patient.bloodGroup || "",
      mrid: patient.mrid || "",
      phoneNumber: patient.phoneNumber || "",
      requiredUnits: patient.requiredUnits || patient.unitsRequired || "",
      requiredDate: patient.requiredDate
        ? new Date(patient.requiredDate).toISOString().split("T")[0]
        : patient.dateNeeded
          ? new Date(patient.dateNeeded).toISOString().split("T")[0]
          : "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPatient(null);
    setFormData({
      patientName: "",
      address: {
        houseName: "",
        houseAddress: "",
        pincode: "",
        district: "",
        city: "",
        localBody: "",
        state: ""
      },
      bloodGroup: "",
      mrid: "",
      phoneNumber: "",
      requiredUnits: "",
      requiredDate: "",
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/bloodbank-login");
  };

  const isSuspended = localStorage.getItem('isSuspended') === 'true';
  const warningMessage = localStorage.getItem('warningMessage');

  return (
    <Layout>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {bloodBankDetails ? bloodBankDetails.name : "Blood Bank"}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Online Status
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: '📊' },
              { id: 'patients', label: 'Manage Patients', icon: '🏥' },
              { id: 'bookings', label: 'Booked Slots', icon: '📅' },
              { id: 'donors', label: 'Manage Donors', icon: '🩸' },
              { id: 'received', label: 'Received Requests', icon: '📥' },
              { id: 'users', label: 'Manage Users', icon: '👥' },
              { id: 'staff', label: 'Manage Staff', icon: '👔' },
              { id: 'frontdesk', label: 'Frontdesk', icon: '🖥️' },
              { id: 'reviews', label: 'Reviews', icon: '⭐' },
            ]
              .filter(item => {
                // Only allow 'bloodbank' role (owner) to see Manage Staff
                if (item.id === 'staff') return role === 'bloodbank';
                return true;
              })
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-lg hover:shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex-1 overflow-auto p-4 md:p-8">
            {warningMessage && (
              <div className="mb-6 text-center bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl shadow-sm relative animate-fadeIn" role="alert">
                <strong className="font-bold">Notice:</strong>
                <span className="block sm:inline ml-1"> {warningMessage}</span>
              </div>
            )}
            {isSuspended && (
              <div className="mb-6 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl shadow-sm relative animate-fadeIn" role="alert">
                <strong className="font-bold">Account Suspended!</strong>
                <span className="block sm:inline ml-1"> Your account is currently suspended. Some features may be restricted.</span>
              </div>
            )}

            <div className="mx-auto w-full max-w-7xl animate-fadeIn">
              {activeTab === 'overview' && (
                <>
                  {loadingAnalytics ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Overview Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-pink-500/20 to-red-500/20 p-6 shadow-2xl backdrop-blur-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {analytics.overview.totalBookings}
                              </p>
                            </div>
                            <div className="text-4xl">📅</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 shadow-2xl backdrop-blur-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {analytics.overview.completedBookings}
                              </p>
                            </div>
                            <div className="text-4xl">✅</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 shadow-2xl backdrop-blur-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {analytics.overview.totalPatients}
                              </p>
                            </div>
                            <div className="text-4xl">🏥</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 shadow-2xl backdrop-blur-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fulfilled Patients</p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {analytics.overview.fulfilledPatients}
                              </p>
                            </div>
                            <div className="text-4xl">❤️</div>
                          </div>
                        </div>
                      </div>

                      {/* Time-based Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Bookings:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{analytics.timeBased.today.bookings}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Bookings:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{analytics.timeBased.thisWeek.bookings}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Month</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Bookings:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{analytics.timeBased.thisMonth.bookings}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Patients:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{analytics.timeBased.thisMonth.patients}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Requests:</span>
                              <span className="font-bold text-gray-900 dark:text-white">{analytics.timeBased.thisMonth.requests}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Blood Group Distribution */}
                      {analytics.bloodGroupDistribution && analytics.bloodGroupDistribution.length > 0 && (
                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Blood Group Distribution (Completed)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {analytics.bloodGroupDistribution.map((stat) => (
                              <div key={stat._id} className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat._id || 'N/A'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.count} donations</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monthly Trend */}
                      {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 && (
                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend (Last 6 Months)</h3>
                          <div className="space-y-3">
                            {analytics.monthlyTrend.map((month, index) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <span className="font-medium text-gray-900 dark:text-white">{month.month}</span>
                                <div className="flex gap-4">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Bookings: <span className="font-bold text-gray-900 dark:text-white">{month.bookings}</span>
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Completed: <span className="font-bold text-green-600">{month.completed}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Activity */}
                      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                        <div className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {analytics.recentActivity.map((booking, index) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {booking.donorId?.name || 'Unknown Donor'} - {booking.bloodGroup}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {booking.patientName} ({booking.patientMRID}) - {new Date(booking.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                  booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-600' :
                                    'bg-yellow-500/20 text-yellow-600'
                                  }`}>
                                  {booking.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'patients' && (
                <>
                  {/* Add/Edit Patient Form */}
                  <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8 mb-8">
                    <div className="mb-6 text-center">
                      <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                        {editingPatient ? "✏️ Edit Patient" : "🏥 Add New Patient"}
                      </h2>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {editingPatient ? "Update patient information" : "Add a patient requiring blood transfusion"}
                      </p>
                    </div>

                    <form onSubmit={editingPatient ? handleUpdatePatient : handleAddPatient} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Patient Name</label>
                          <input
                            type="text"
                            placeholder="Enter patient name"
                            value={formData.patientName}
                            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            required
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Group</label>
                          <select
                            value={formData.bloodGroup}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            required
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            <option value="" className="text-gray-800">Select Blood Group</option>
                            <option value="A+" className="text-gray-800">A+</option>
                            <option value="A-" className="text-gray-800">A-</option>
                            <option value="B+" className="text-gray-800">B+</option>
                            <option value="B-" className="text-gray-800">B-</option>
                            <option value="O+" className="text-gray-800">O+</option>
                            <option value="O-" className="text-gray-800">O-</option>
                            <option value="AB+" className="text-gray-800">AB+</option>
                            <option value="AB-" className="text-gray-800">AB-</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Medical Record ID (MRID)</label>
                          <input
                            type="text"
                            placeholder="Enter MRID"
                            value={formData.mrid}
                            onChange={(e) => setFormData({ ...formData, mrid: e.target.value })}
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            pattern="[0-9]{10}"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            required
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Required Units</label>
                          <input
                            type="number"
                            placeholder="Number of units needed"
                            min="1"
                            value={formData.requiredUnits}
                            onChange={(e) => setFormData({ ...formData, requiredUnits: e.target.value })}
                            required
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Required Date</label>
                          <input
                            type="date"
                            value={formData.requiredDate}
                            onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address Details</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">House Name</label>
                              <input
                                type="text"
                                placeholder="Enter house name"
                                value={formData.address.houseName}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, houseName: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">House Address</label>
                              <input
                                type="text"
                                placeholder="Enter house address"
                                value={formData.address.houseAddress}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, houseAddress: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Pincode *</label>
                              <input
                                type="text"
                                placeholder="Enter pincode"
                                pattern="[0-9]{6}"
                                maxLength="6"
                                value={formData.address.pincode}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, pincode: e.target.value }
                                })}
                                required
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">District</label>
                              <input
                                type="text"
                                placeholder="Enter district"
                                value={formData.address.district}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, district: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">City</label>
                              <input
                                type="text"
                                placeholder="Enter city"
                                value={formData.address.city}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, city: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Local Body</label>
                              <input
                                type="text"
                                placeholder="Enter local body"
                                value={formData.address.localBody}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, localBody: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">State</label>
                              <input
                                type="text"
                                placeholder="Enter state"
                                value={formData.address.state}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, state: e.target.value }
                                })}
                                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99] disabled:opacity-50"
                        >
                          <span className="mr-2">{editingPatient ? "✏️" : "🏥"}</span>
                          {loading ? (editingPatient ? "Updating..." : "Adding...") : (editingPatient ? "Update Patient" : "Add Patient")}
                        </button>
                        {editingPatient && (
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-gray-600 to-gray-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-gray-500/30 active:scale-[0.99]"
                          >
                            <span className="mr-2">❌</span>
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Patients List */}
                  <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                    <div className="mb-6 text-center">
                      <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                        🏥 Patients List
                      </h2>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Manage all patients requiring blood transfusions
                      </p>
                    </div>

                    {patients.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">No patients added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patients.map((p) => (
                          <div key={p._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{p.patientName || p.name}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  <p>🩸 Blood Group: {p.bloodGroup}</p>
                                  <p>🏠 Address: {formatAddress(p.address)}</p>
                                  <p>📋 MRID: {p.mrid}</p>
                                  <p>📱 Phone: {p.phoneNumber}</p>
                                  <p>🩸 Units Required: {p.requiredUnits || p.unitsRequired}</p>
                                  <p>📅 Date Needed: {new Date(p.requiredDate || p.dateNeeded).toLocaleDateString()}</p>
                                </div>
                                {/* Donation Requests Section */}
                                {p.donationRequests && p.donationRequests.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🩸 Donation Requests:</h5>
                                    <div className="space-y-2">
                                      {p.donationRequests.map((request) => (
                                        <div key={request._id} className="bg-white/20 rounded-lg p-2 text-xs">
                                          <p><strong>Donor:</strong> {request.donorName}</p>
                                          <p><strong>Status:</strong> <span className={`font-semibold ${request.status === 'confirmed' ? 'text-green-600' : request.status === 'pending' ? 'text-yellow-600' : request.status === 'booked' ? 'text-blue-600' : 'text-red-600'}`}>{request.status}</span></p>
                                          {request.requestedDate && <p><strong>Date:</strong> {new Date(request.requestedDate).toLocaleDateString()}</p>}
                                          {request.requestedTime && <p><strong>Time:</strong> {request.requestedTime}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditing(p)}
                                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                >
                                  <span className="mr-1">✏️</span>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePatient(p._id)}
                                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                >
                                  <span className="mr-1">🗑️</span>
                                  Delete
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

              {activeTab === 'bookings' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      📅 Booked Slots
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      View and manage all confirmed booking slots
                    </p>
                  </div>

                  {/* Filter Section */}
                  <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        Filter Bookings
                      </h3>
                      <button
                        onClick={() => {
                          setFilterDate('');
                          setFilterBloodGroup('');
                          setFilterPatientName('');
                          setFilterPatientMRID('');
                          setFilterStatus('');
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      {/* Date Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          📅 Date
                        </label>
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        />
                      </div>

                      {/* Blood Group Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          🩸 Blood Group
                        </label>
                        <select
                          value={filterBloodGroup}
                          onChange={(e) => setFilterBloodGroup(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        >
                          <option value="">All Blood Groups</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      {/* Patient Name Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          🙋 Patient Name
                        </label>
                        <input
                          type="text"
                          value={filterPatientName}
                          onChange={(e) => setFilterPatientName(e.target.value)}
                          placeholder="Search by name..."
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        />
                      </div>

                      {/* Patient MRID Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          🏥 MRID
                        </label>
                        <input
                          type="text"
                          value={filterPatientMRID}
                          onChange={(e) => setFilterPatientMRID(e.target.value)}
                          placeholder="Search by MRID..."
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        />
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          📊 Status
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Filters Display */}
                    {(filterDate || filterBloodGroup || filterPatientName || filterPatientMRID || filterStatus) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Filters:</span>
                        {filterDate && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-bold flex items-center gap-1">
                            📅 {new Date(filterDate).toLocaleDateString()}
                            <button onClick={() => setFilterDate('')} className="hover:text-red-600">×</button>
                          </span>
                        )}
                        {filterBloodGroup && (
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-bold flex items-center gap-1">
                            🩸 {filterBloodGroup}
                            <button onClick={() => setFilterBloodGroup('')} className="hover:text-red-600">×</button>
                          </span>
                        )}
                        {filterPatientName && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-bold flex items-center gap-1">
                            🙋 {filterPatientName}
                            <button onClick={() => setFilterPatientName('')} className="hover:text-red-600">×</button>
                          </span>
                        )}
                        {filterPatientMRID && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-bold flex items-center gap-1">
                            🏥 {filterPatientMRID}
                            <button onClick={() => setFilterPatientMRID('')} className="hover:text-red-600">×</button>
                          </span>
                        )}
                        {filterStatus && (
                          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-bold flex items-center gap-1">
                            📊 {filterStatus}
                            <button onClick={() => setFilterStatus('')} className="hover:text-red-600">×</button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📥</div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">No bookings yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Bookings will appear here once donors book their slots</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking._id} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5 hover:border-pink-300 dark:hover:border-pink-700 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                                  Booking ID: {booking.bookingId}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                      booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                  {booking.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">🎫 Token:</span>
                                  <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded font-bold text-yellow-900 dark:text-yellow-200">
                                    #{booking.tokenNumber || 'N/A'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">👤 Donor:</span>
                                  <span>{booking.donorName || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">🩸 Blood Group:</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">{booking.bloodGroup}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">📧 Email:</span>
                                  <span className="text-xs">{booking.donorId?.userId?.email || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">📱 Phone:</span>
                                  <span>{booking.donorId?.userId?.phone || booking.donorId?.contactNumber || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">📅 Date:</span>
                                  <span className="font-semibold">{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">🕒 Time:</span>
                                  <span className="font-semibold">{booking.time}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">🙋 Patient:</span>
                                  <span>{booking.patientName || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">🏥 MRID:</span>
                                  <span className="font-mono">{booking.patientMRID || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">📝 Requester:</span>
                                  <span>{booking.requesterName || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setRescheduleModal(booking)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <span>📅</span>
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleConfirmBooking(booking)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <span>✅</span>
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => handleRejectBooking(booking)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <span>✖️</span>
                                    Reject
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => setRescheduleModal(booking)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                                >
                                  <span>📅</span>
                                  Reschedule
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'donors' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      🩸 Manage Donors
                    </h2>
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        onClick={() => setShowVisitHistory(false)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${!showVisitHistory ? 'bg-pink-600 text-white shadow-lg' : 'bg-white/20 text-gray-600 hover:bg-white/40'}`}
                      >
                        All Donors
                      </button>
                      <button
                        onClick={() => setShowVisitHistory(true)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${showVisitHistory ? 'bg-pink-600 text-white shadow-lg' : 'bg-white/20 text-gray-600 hover:bg-white/40'}`}
                      >
                        Visit History
                      </button>
                    </div>
                  </div>

                  {!showVisitHistory ? (
                    <>
                      <div className="mb-6">
                        <DonorSearchForm
                          searchBloodGroup={searchBloodGroup}
                          setSearchBloodGroup={setSearchBloodGroup}
                          searchPlace={searchPlace}
                          setSearchPlace={setSearchPlace}
                          searchEmail={searchDonorEmail}
                          setSearchEmail={setSearchDonorEmail}
                          showDropdown={showDropdown}
                          setShowDropdown={setShowDropdown}
                          onClear={() => {
                            setSearchBloodGroup("");
                            setSearchPlace("");
                            setSearchDonorEmail("");
                          }}
                        />
                      </div>

                      {donors.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400">No donors found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredDonors.map((donor) => (
                            <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5 relative">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                  {donor.bloodGroup}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white">{donor.name || 'Unknown Donor'}</h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{donor.email}</div>
                                </div>
                              </div>
                              <div className="text-sm space-y-1 mb-4">
                                <p><strong>Address:</strong> {formatAddress(donor.address)}</p>
                                <p><strong>Last Donation:</strong> {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                                {donor.isBlocked && <p className="text-red-500 font-bold">🚫 BLOCKED</p>}
                                {donor.isSuspended && <p className="text-yellow-500 font-bold">⚠️ SUSPENDED</p>}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleDonorStatusChange(donor._id, 'block', !donor.isBlocked)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${donor.isBlocked ? 'bg-green-600' : 'bg-red-600'}`}
                                >
                                  {donor.isBlocked ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                  onClick={() => handleDonorStatusChange(donor._id, 'suspend', !donor.isSuspended)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${donor.isSuspended ? 'bg-green-600' : 'bg-yellow-600'}`}
                                >
                                  {donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleDonorStatusChange(donor._id, 'warn', true)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-orange-500"
                                >
                                  Warn
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      {visitedDonors.length === 0 ? (
                        <p className="text-center text-gray-600 dark:text-gray-400">No visit history available.</p>
                      ) : (
                        visitedDonors.map((record) => (
                          <div key={record._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => setExpandedDonor(expandedDonor === record._id ? null : record._id)}
                            >
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{record.donorDetails?.name || 'Unknown'} ({record.donorDetails?.bloodGroup})</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits: {record.visitCount}</p>
                              </div>
                              <button className="text-pink-600 font-bold">
                                {expandedDonor === record._id ? 'Collapse' : 'Expand'}
                              </button>
                            </div>

                            {expandedDonor === record._id && (
                              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h5 className="font-semibold mb-2">Visit History:</h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {record.history.map((visit, index) => (
                                    <div key={index} className="flex justify-between text-sm bg-white/5 p-2 rounded">
                                      <span>{new Date(visit.date).toLocaleDateString()}</span>
                                      <span className={visit.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}>
                                        {visit.status}
                                      </span>
                                      {visit.patientName && <span className="text-gray-500">For: {visit.patientName}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'received' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      📥 Received Donation Requests
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Manage requests from donors who want to donate here
                    </p>
                  </div>

                  {donationRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📥</div>
                      <p className="text-gray-600 dark:text-gray-400">No pending donation requests.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {donationRequests.map((req) => (
                        <div key={req._id} className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{req.donorName}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{req.email}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                              {req.bloodGroup}
                            </div>
                          </div>

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Requested Date:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(req.requestedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Requested Time:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{req.requestedTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <span className={`font-bold ${req.status === 'pending' ? 'text-yellow-500' :
                                req.status === 'accepted' ? 'text-green-500' :
                                  'text-red-500'
                                }`}>{req.status.toUpperCase()}</span>
                            </div>
                          </div>

                          {req.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleAcceptRequest(req._id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req._id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'staff' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl flex items-center gap-2">
                        <span>👔</span> Manage Staff
                      </h2>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        Create and manage staff accounts
                      </p>
                    </div>
                    <button
                      onClick={() => setShowStaffModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition flex items-center gap-2"
                    >
                      <span>➕</span> Add Staff Member
                    </button>
                  </div>

                  {loadingStaff ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Loading staff list...</p>
                    </div>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="text-6xl mb-4">👔</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Staff Members Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">Start by adding your first staff member</p>
                      <button
                        onClick={() => setShowStaffModal(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Add Staff
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
                      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-xs uppercase text-gray-700 dark:text-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-bold">Name / Username</th>
                            <th className="px-6 py-4 font-bold">Role</th>
                            <th className="px-6 py-4 font-bold">Contact</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {staffList.map((staff) => (
                            <tr key={staff._id} className="hover:bg-white/50 dark:hover:bg-white/5 transition duration-150">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white text-lg">{staff.name}</div>
                                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded inline-block mt-1">
                                  @{staff.username}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${staff.role === 'doctor' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300' :
                                  staff.role === 'frontdesk' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' :
                                    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                  }`}>
                                  {staff.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-1.5 text-xs">
                                    📧 {staff.email}
                                  </span>
                                  {staff.phone && (
                                    <span className="flex items-center gap-1.5 text-xs">
                                      📱 {staff.phone}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg w-fit">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleResetPassword(staff._id, staff.name)}
                                  className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                                  title="Reset Password"
                                >
                                  🔐 Reset
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add Staff Modal */}
                  {showStaffModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <span>👔</span> Add New Staff
                          </h3>
                          <button onClick={() => setShowStaffModal(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input
                              type="text"
                              required
                              value={newStaffData.name}
                              onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                              placeholder="e.g. Dr. Sarah Smith"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <select
                              value={newStaffData.role}
                              onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            >
                              <option value="frontdesk">Front Desk</option>
                              <option value="doctor">Doctor</option>
                              <option value="bleeding_staff">Bleeding Staff</option>
                              <option value="store_staff">Store Staff</option>
                              <option value="store_manager">Store Manager</option>
                              <option value="centrifuge_staff">Centrifuge Staff</option>
                              <option value="other_staff">Other Staff</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                              <input
                                type="email"
                                value={newStaffData.email}
                                onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="Auto-generated if empty"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone (Optional)</label>
                              <input
                                type="tel"
                                value={newStaffData.phone}
                                onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="10-digit number"
                              />
                            </div>
                          </div>

                          <div className="pt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setShowStaffModal(false)}
                              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                              {loading ? 'Creating...' : 'Create Staff Member'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Credentials Modal */}
                  {showCredentialsModal && createdStaffCredentials && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-green-500 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                        <div className="p-8 text-center">
                          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">✅</span>
                          </div>
                          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Staff Created!</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Please copy these credentials immediately. The password will not be shown again.
                          </p>

                          <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-5 mb-6 text-left border border-gray-200 dark:border-gray-700 select-all">
                            <div className="mb-3 border-b border-gray-300 dark:border-gray-700 pb-3">
                              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Username</p>
                              <p className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">{createdStaffCredentials.username}</p>
                            </div>
                            <div className="mb-3 border-b border-gray-300 dark:border-gray-700 pb-3">
                              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Password</p>
                              <p className="font-mono text-xl font-bold text-green-600 dark:text-green-400 tracking-wider">{createdStaffCredentials.generatedPassword}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500 font-bold mb-1">Login URL</p>
                              <p className="font-mono text-xs text-gray-600 dark:text-gray-400">/login</p>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowCredentialsModal(false)}
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg transform hover:scale-[1.02]"
                          >
                            I have copied these credentials
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      👥 Manage Users
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      View and manage registered users
                    </p>
                  </div>

                  {/* User Search Form */}
                  <div className="mb-4">
                    <UserSearchForm
                      searchRole={searchUserRole}
                      setSearchRole={setSearchUserRole}
                      searchUsername={searchUsername}
                      setSearchUsername={setSearchUsername}
                      searchUserDate={searchUserDate}
                      setSearchUserDate={setSearchUserDate}
                      searchEmail={searchUserEmail}
                      setSearchEmail={setSearchUserEmail}
                      onClear={() => {
                        setSearchUserRole("");
                        setSearchUsername("");
                        setSearchUserDate("");
                        setSearchUserEmail("");
                      }}
                    />
                  </div>

                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👥</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Users Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Try adjusting your search filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm">
                      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-white/10 text-xs uppercase text-gray-700 dark:text-gray-200">
                          <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user._id} className="border-b border-white/10 hover:bg-white/5 transition">
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                              <td className="px-6 py-4">{user.email}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold dark:bg-blue-900 dark:text-blue-200">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {user.isBlocked ? (
                                  <span className="text-red-600 font-bold">Blocked</span>
                                ) : user.isSuspended ? (
                                  <span className="text-yellow-600 font-bold">Suspended</span>
                                ) : (
                                  <span className="text-green-600 font-bold">Active</span>
                                )}
                              </td>
                              <td className="px-6 py-4 flex justify-center gap-2">
                                {!user.isBlocked && (
                                  <button
                                    onClick={() => handleUserStatusChange(user._id, 'block', true)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition"
                                  >
                                    Block
                                  </button>
                                )}
                                {user.isBlocked && (
                                  <button
                                    onClick={() => handleUserStatusChange(user._id, 'block', false)}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition"
                                  >
                                    Unblock
                                  </button>
                                )}

                                {!user.isSuspended && (
                                  <button
                                    onClick={() => handleUserStatusChange(user._id, 'suspend', true)}
                                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-xs hover:bg-yellow-700 transition"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {user.isSuspended && (
                                  <button
                                    onClick={() => handleUserStatusChange(user._id, 'suspend', false)}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition"
                                  >
                                    Unsuspend
                                  </button>
                                )}

                                {/* Chat Button */}
                                <button
                                  onClick={() => handleStartChat(user._id)}
                                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700 transition flex items-center gap-1"
                                  title="Chat with user"
                                >
                                  💬 Chat
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'donors' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      🩸 Donors Management
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Manage donor accounts and view visit history
                    </p>
                  </div>

                  {/* Toggle View Button */}
                  <div className="mb-6 flex justify-center gap-4">
                    <button
                      onClick={() => setShowVisitHistory(false)}
                      className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${!showVisitHistory
                        ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <span>👥</span>
                      All Donors
                    </button>
                    <button
                      onClick={() => setShowVisitHistory(true)}
                      className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${showVisitHistory
                        ? 'bg-gradient-to-r from-blue-600 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <span>📊</span>
                      Visit History ({visitedDonors.length})
                    </button>
                  </div>

                  {!showVisitHistory ? (
                    <>
                      {/* Search Form */}
                      <DonorSearchForm
                        searchBloodGroup={searchBloodGroup}
                        setSearchBloodGroup={setSearchBloodGroup}
                        searchPlace={searchPlace}
                        setSearchPlace={setSearchPlace}
                        searchEmail={searchDonorEmail}
                        setSearchEmail={setSearchDonorEmail}
                        showDropdown={showDropdown}
                        setShowDropdown={setShowDropdown}
                        onClear={() => {
                          setSearchBloodGroup('');
                          setSearchDonorEmail('');
                          setSearchPlace('');
                        }}
                      />

                      {/* Donor Count Summary */}
                      <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 shadow-md">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👥</span>
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Total Available Donors in Database
                              </p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {donors.length} Donors
                              </p>
                            </div>
                          </div>
                          {(searchBloodGroup || searchDonorEmail || searchPlace) && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🔍</span>
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  Filtered Results
                                </p>
                                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                                  {filteredDonors.length} Donors
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {donors.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading donors from database...</p>
                        </div>
                      ) : filteredDonors.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🔍</div>
                          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                            No donors match your search criteria
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Try adjusting your filters or clear the search
                          </p>
                          <button
                            onClick={() => {
                              setSearchBloodGroup('');
                              setSearchDonorEmail('');
                              setSearchPlace('');
                            }}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredDonors.map((donor) => (
                            <div key={donor._id} className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">{donor.name}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <p>🆔 User ID: <strong>{donor.userId?._id || donor.userId}</strong></p>
                                    <p>👤 Username: <strong>{donor.userId?.username}</strong></p>
                                    <p>📧 Email: {donor.email}</p>
                                    <p>📱 Phone: {donor.phone}</p>
                                    <p>🩸 Blood Group: {donor.bloodGroup}</p>
                                    <p>📍 Address: {formatAddress(donor.address)}</p>
                                    <p>📅 Last Donation: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                                    <p>🚫 Blocked: <span className={`font-semibold ${donor.isBlocked ? 'text-red-600' : 'text-green-600'}`}>{donor.isBlocked ? 'Yes' : 'No'}</span></p>
                                    <p>⏸️ Suspended: <span className={`font-semibold ${donor.isSuspended ? 'text-yellow-600' : 'text-green-600'}`}>{donor.isSuspended ? 'Yes' : 'No'}</span></p>
                                    <p>⚠️ Warning: <span className={`font-semibold ${donor.warningMessage ? 'text-orange-600' : 'text-green-600'}`}>{donor.warningMessage ? 'Yes' : 'No'}</span></p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleDonorStatusChange(donor._id, 'block', !donor.isBlocked)}
                                    className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${donor.isBlocked
                                      ? 'bg-gradient-to-r from-green-600 to-green-500'
                                      : 'bg-gradient-to-r from-red-600 to-rose-500'
                                      }`}
                                  >
                                    <span className="mr-1">{donor.isBlocked ? '✅' : '🚫'}</span>
                                    {donor.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                  <button
                                    onClick={() => handleDonorStatusChange(donor._id, 'suspend', !donor.isSuspended)}
                                    className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${donor.isSuspended
                                      ? 'bg-gradient-to-r from-green-600 to-green-500'
                                      : 'bg-gradient-to-r from-yellow-600 to-orange-500'
                                      }`}
                                  >
                                    <span className="mr-1">{donor.isSuspended ? '▶️' : '⏸️'}</span>
                                    {donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                  <button
                                    onClick={() => handleDonorStatusChange(donor._id, 'warn', true)}
                                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-3 py-2 font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99]"
                                  >
                                    <span className="mr-1">⚠️</span>
                                    Warn
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Visit History View
                    <div>
                      {visitedDonors.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📥</div>
                          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                            No donor visits yet
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Donors who visit your blood bank will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {visitedDonors.map((donorData) => (
                            <div
                              key={donorData.donor._id}
                              className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-6 shadow-xl"
                            >
                              {/* Donor Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className="text-3xl">🩸</span>
                                    {donorData.donor.name}
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">Blood Group:</span>
                                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-bold">
                                        {donorData.donor.bloodGroup}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <span className="font-semibold">📧</span>
                                      <span>{donorData.donor.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <span className="font-semibold">📱</span>
                                      <span>{donorData.donor.phone || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setExpandedDonor(expandedDonor === donorData.donor._id ? null : donorData.donor._id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                                >
                                  {expandedDonor === donorData.donor._id ? '▲ Hide Visits' : '▼ View Visits'}
                                </button>
                              </div>

                              {/* Statistics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{donorData.totalVisits}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Visits</p>
                                </div>
                                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{donorData.completedDonations}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                                </div>
                                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{donorData.pendingBookings}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                                </div>
                                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Visit</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {donorData.lastVisit ? new Date(donorData.lastVisit).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {/* Visit Details (Expandable) */}
                              {expandedDonor === donorData.donor._id && (
                                <div className="mt-4 space-y-3 animate-fadeIn">
                                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span>📋</span>
                                    Visit History ({donorData.visits.length})
                                  </h4>

                                  {donorData.visits.map((visit, index) => (
                                    <div
                                      key={visit.bookingId || index}
                                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                          <span className="text-xl">{index + 1}.</span>
                                          <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                              {new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                              {visit.time} • Token #{visit.tokenNumber || 'N/A'}
                                            </p>
                                          </div>
                                        </div>

                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${visit.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                          visit.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                            visit.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                          }`}>
                                          {visit.status.toUpperCase()}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300 mt-3">
                                        {visit.patientName && (
                                          <p><span className="font-semibold">🙋 Patient:</span> {visit.patientName}</p>
                                        )}
                                        {visit.patientMRID && (
                                          <p><span className="font-semibold">🏥 MRID:</span> {visit.patientMRID}</p>
                                        )}
                                        {visit.arrived && (
                                          <p><span className="font-semibold">✅ Arrived:</span> {new Date(visit.arrivalTime).toLocaleString()}</p>
                                        )}
                                        {visit.completedAt && (
                                          <p><span className="font-semibold">🎉 Completed:</span> {new Date(visit.completedAt).toLocaleString()}</p>
                                        )}
                                        {visit.rejectionReason && (
                                          <p className="col-span-2"><span className="font-semibold">❌ Rejection Reason:</span> {visit.rejectionReason}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'frontdesk' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      🖥️ Frontdesk Management
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      View all bookings or search by token number
                    </p>
                  </div>

                  {/* Toggle: View All / Search */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-lg border border-white/30 bg-white/20 dark:border-white/10 dark:bg-white/5 p-1">
                      <button
                        onClick={() => setShowAllTokens(true)}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${showAllTokens
                          ? 'bg-gradient-to-r from-blue-600 to-purple-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10'
                          }`}
                      >
                        📋 View All Tokens
                      </button>
                      <button
                        onClick={() => setShowAllTokens(false)}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${!showAllTokens
                          ? 'bg-gradient-to-r from-blue-600 to-purple-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10'
                          }`}
                      >
                        🔍 Search Token
                      </button>
                    </div>
                  </div>

                  {showAllTokens ? (
                    /* View All Tokens Section */
                    <div>
                      {/* Filter Options */}
                      <div className="max-w-4xl mx-auto mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-700">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-xl">🔍</span>
                            Filter Bookings
                          </h3>

                          {/* Filter Buttons */}
                          <div className="flex flex-wrap gap-3 mb-4">
                            <button
                              onClick={() => setTokenFilter('all')}
                              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${tokenFilter === 'all'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                                }`}
                            >
                              <span className="text-xl">📚</span>
                              All Bookings
                            </button>

                            <button
                              onClick={() => setTokenFilter('today')}
                              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${tokenFilter === 'today'
                                ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white shadow-lg'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
                                }`}
                            >
                              <span className="text-xl">📆</span>
                              Today's Bookings
                            </button>

                            <button
                              onClick={() => setTokenFilter('date')}
                              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${tokenFilter === 'date'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                            >
                              <span className="text-xl">📅</span>
                              Specific Date
                            </button>
                          </div>

                          {/* Date Picker (only show when 'date' filter is selected) */}
                          {tokenFilter === 'date' && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                                Select Date:
                              </label>
                              <input
                                type="date"
                                value={selectedTokenDate}
                                onChange={(e) => setSelectedTokenDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* All Tokens List */}
                      {loadingTokens ? (
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
                        </div>
                      ) : allTokens.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📥</div>
                          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                            {tokenFilter === 'all' && 'No bookings found'}
                            {tokenFilter === 'today' && 'No bookings for today'}
                            {tokenFilter === 'date' && `No bookings found for ${new Date(selectedTokenDate).toLocaleDateString()}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            {tokenFilter === 'all' && 'No bookings have been made yet'}
                            {tokenFilter === 'today' && 'No one is scheduled to donate today'}
                            {tokenFilter === 'date' && 'Try selecting a different date'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              🎫 {allTokens.length} Booking{allTokens.length !== 1 ? 's' : ''}
                              {tokenFilter === 'all' && ' (All Time)'}
                              {tokenFilter === 'today' && ` (Today - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })})`}
                              {tokenFilter === 'date' && ` (${new Date(selectedTokenDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`}
                            </h3>

                            {/* Download Button */}
                            <button
                              onClick={() => setShowDownloadModal(true)}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-600 transition flex items-center gap-2 shadow-lg"
                            >
                              <span className="text-lg">⬇️</span>
                              Download Report
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allTokens.map((booking) => (
                              <div
                                key={booking._id}
                                className={`rounded-xl border-2 p-4 shadow-lg transition cursor-pointer hover:shadow-xl ${booking.status === 'completed'
                                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                                  : booking.status === 'rejected'
                                    ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                                    : booking.arrived
                                      ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                                      : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                  }`}
                                onClick={() => {
                                  setSearchedBooking(booking);
                                  setShowAllTokens(false);
                                }}
                              >
                                {/* Token Number Badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-2xl font-bold font-mono text-yellow-700 dark:text-yellow-400">
                                    #{booking.tokenNumber}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${booking.status === 'completed' ? 'bg-blue-500 text-white' :
                                    booking.status === 'rejected' ? 'bg-red-500 text-white' :
                                      booking.arrived ? 'bg-yellow-500 text-white' :
                                        'bg-green-500 text-white'
                                    }`}>
                                    {booking.status === 'completed' ? '✓ DONE' :
                                      booking.status === 'rejected' ? '✗ REJECTED' :
                                        booking.arrived ? '🕒 ARRIVED' :
                                          '⏳ PENDING'}
                                  </span>
                                </div>

                                {/* Donor Info */}
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Donor</p>
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{booking.donorName}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{booking.bloodGroup}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">• {booking.time}</span>
                                  </div>
                                  {booking.patientName && (
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Patient</p>
                                      <p className="text-sm text-gray-900 dark:text-white truncate">{booking.patientName}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Click to view indicator */}
                                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    Click to view details →
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Token Search Section */
                    <div className="max-w-2xl mx-auto mb-8">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="text-2xl">🔍</span>
                          Search by Token Number
                        </h3>

                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter token number (e.g., 25)"
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTokenSearch()}
                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                          />
                          <button
                            onClick={handleTokenSearch}
                            disabled={searchingToken}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                          >
                            {searchingToken ? (
                              <>
                                <span className="inline-block animate-spin">🕒</span>
                                Searching...
                              </>
                            ) : (
                              <>
                                <span>🔍</span>
                                Search
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking Details */}
                  {searchedBooking ? (
                    <div className="max-w-4xl mx-auto">
                      <div className="rounded-2xl border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">✅</span>
                            Booking Found!
                          </h3>
                          <button
                            onClick={() => {
                              setSearchedBooking(null);
                              setTokenSearch('');
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
                          >
                            Clear
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-4">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${searchedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            searchedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              searchedBooking.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                            {searchedBooking.status.toUpperCase()}
                            {searchedBooking.arrived && ' - ARRIVED'}
                          </span>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🎫 Token Number</span>
                            <span className="text-2xl font-mono font-bold text-yellow-700 dark:text-yellow-400">#{searchedBooking.tokenNumber}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📋 Booking ID</span>
                            <span className="text-lg font-mono text-gray-900 dark:text-white">{searchedBooking.bookingId}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">👤 Donor Name</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{searchedBooking.donorName}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🩸 Blood Group</span>
                            <span className="text-xl font-bold text-red-600 dark:text-red-400">{searchedBooking.bloodGroup}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📧 Email</span>
                            <span className="text-sm text-gray-900 dark:text-white">{searchedBooking.donorId?.userId?.email || 'N/A'}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📱 Phone</span>
                            <span className="text-sm text-gray-900 dark:text-white">{searchedBooking.donorId?.userId?.phone || searchedBooking.donorId?.contactNumber || 'N/A'}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">📅 Appointment Date</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {new Date(searchedBooking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🕒 Time</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{searchedBooking.time}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🙋 Patient Name</span>
                            <span className="text-lg text-gray-900 dark:text-white">{searchedBooking.patientName || 'N/A'}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">🏥 Patient MRID</span>
                            <span className="text-lg font-mono text-gray-900 dark:text-white">{searchedBooking.patientMRID || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {searchedBooking.status !== 'completed' && searchedBooking.status !== 'rejected' && (
                          <div className="flex flex-wrap gap-3 justify-center">
                            {!searchedBooking.arrived && (
                              <button
                                onClick={handleMarkArrival}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-600 transition flex items-center gap-2 shadow-lg"
                              >
                                <span className="text-xl">✅</span>
                                Mark Arrival
                              </button>
                            )}

                            {searchedBooking.arrived && (
                              <button
                                onClick={handleMarkCompletion}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 transition flex items-center gap-2 shadow-lg"
                              >
                                <span className="text-xl">🎉</span>
                                Mark Completed
                              </button>
                            )}

                            <button
                              onClick={handleMarkRejection}
                              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-600 transition flex items-center gap-2 shadow-lg"
                            >
                              <span className="text-xl">❌</span>
                              Reject
                            </button>
                          </div>
                        )}

                        {searchedBooking.status === 'completed' && (
                          <div className="text-center p-6 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                              🎉 Donation Completed!
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                              Thank you for saving lives!
                            </p>
                          </div>
                        )}

                        {searchedBooking.status === 'rejected' && (
                          <div className="text-center p-6 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                              ❌ Booking Rejected
                            </p>
                            {searchedBooking.rejectionReason && (
                              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                                Reason: {searchedBooking.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎫</div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        Enter a token number to view booking details
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Donors will present their token number when they arrive
                      </p>
                    </div>
                  )}

                  {/* Download Modal */}
                  {showDownloadModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border-2 border-pink-200 dark:border-pink-700">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-3xl">⬇️</span>
                            Download Booking Report
                          </h3>
                          <button
                            onClick={() => setShowDownloadModal(false)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-3xl leading-none"
                          >
                            ×
                          </button>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Choose the type of report and format you want to download.
                        </p>

                        <div className="space-y-3">
                          {/* All Bookings */}
                          <div className="border-2 border-purple-300 dark:border-purple-700 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">📚</span>
                              <div className="text-left flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">All Bookings</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Download all bookings shown in current view ({allTokens.length} booking{allTokens.length !== 1 ? 's' : ''})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadBookingsCSV('all')}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📄 CSV
                              </button>
                              <button
                                onClick={() => downloadBookingsPDF('all')}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📕 PDF
                              </button>
                            </div>
                          </div>

                          {/* Completed Bookings */}
                          <div className="border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">✅</span>
                              <div className="text-left flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Completed Donations</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Only successfully completed donations ({allTokens.filter(b => b.status === 'completed').length} booking{allTokens.filter(b => b.status === 'completed').length !== 1 ? 's' : ''})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadBookingsCSV('completed')}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📄 CSV
                              </button>
                              <button
                                onClick={() => downloadBookingsPDF('completed')}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📕 PDF
                              </button>
                            </div>
                          </div>

                          {/* Waiting Today */}
                          <div className="border-2 border-yellow-300 dark:border-yellow-700 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">🕒</span>
                              <div className="text-left flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Waiting Today</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Bookings scheduled for today that are pending ({allTokens.filter(b => b.date === new Date().toISOString().split('T')[0] && b.status !== 'completed' && b.status !== 'rejected').length} booking{allTokens.filter(b => b.date === new Date().toISOString().split('T')[0] && b.status !== 'completed' && b.status !== 'rejected').length !== 1 ? 's' : ''})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadBookingsCSV('waiting_today')}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📄 CSV
                              </button>
                              <button
                                onClick={() => downloadBookingsPDF('waiting_today')}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📕 PDF
                              </button>
                            </div>
                          </div>

                          {/* Pending (Not Completed) */}
                          <div className="border-2 border-green-300 dark:border-green-700 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">⏳</span>
                              <div className="text-left flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Pending Bookings</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  All bookings not yet completed ({allTokens.filter(b => b.status !== 'completed' && b.status !== 'rejected').length} booking{allTokens.filter(b => b.status !== 'completed' && b.status !== 'rejected').length !== 1 ? 's' : ''})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadBookingsCSV('not_completed')}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📄 CSV
                              </button>
                              <button
                                onClick={() => downloadBookingsPDF('not_completed')}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📕 PDF
                              </button>
                            </div>
                          </div>

                          {/* Rejected Bookings */}
                          <div className="border-2 border-red-300 dark:border-red-700 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">❌</span>
                              <div className="text-left flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">Rejected Bookings</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Bookings that were rejected by the blood bank ({allTokens.filter(b => b.status === 'rejected').length} booking{allTokens.filter(b => b.status === 'rejected').length !== 1 ? 's' : ''})
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadBookingsCSV('rejected')}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📄 CSV
                              </button>
                              <button
                                onClick={() => downloadBookingsPDF('rejected')}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                              >
                                📕 PDF
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>📄 File Formats:</strong> CSV (spreadsheet) or PDF (formatted report)
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            <strong>📊 Included Data:</strong> Token #, Date, Time, Donor Details, Patient Info, Status, and more
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            <strong>💡 Tip:</strong> Use CSV for data analysis, PDF for printing/sharing
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                      ⭐ Reviews & Ratings
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      See what people are saying about {bloodBankDetails?.name || 'your blood bank'}
                    </p>
                  </div>

                  {/* Review Statistics */}
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 text-center">
                      <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                        {reviewStats.averageRating.toFixed(1)}
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-300 font-semibold mt-2">
                        Average Rating
                      </div>
                      <div className="flex justify-center mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-2xl ${star <= Math.round(reviewStats.averageRating)
                              ? 'text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 text-center">
                      <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                        {reviewStats.totalReviews}
                      </div>
                      <div className="text-blue-700 dark:text-blue-300 font-semibold mt-2">
                        Total Reviews
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        From satisfied users
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700 text-center">
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400">
                        {reviewStats.totalReviews > 0 ? '✓' : '-'}
                      </div>
                      <div className="text-green-700 dark:text-green-300 font-semibold mt-2">
                        Status
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                        {reviewStats.totalReviews > 0 ? 'Reviews Available' : 'No Reviews Yet'}
                      </div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loadingReviews && (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
                    </div>
                  )}

                  {/* Reviews List */}
                  {!loadingReviews && reviews.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        💬 What people are saying
                      </h3>
                      {reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-white/50 dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {review.reviewerId?.name || review.reviewerId?.username || 'Anonymous User'}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                              <span className="text-yellow-500 text-lg">★</span>
                              <span className="font-bold text-yellow-700 dark:text-yellow-400">
                                {review.rating}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {review.comment}
                          </p>

                          {/* Star Rating Display */}
                          <div className="flex mt-3 justify-between items-center">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xl ${star <= review.rating
                                    ? 'text-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition opacity-0 group-hover:opacity-100"
                              title="Delete this review"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Reviews State */}
                  {!loadingReviews && reviews.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">⭐</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No Reviews Yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        You haven't received any reviews yet. Keep providing excellent service!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-w-md w-full rounded-2xl border border-white/30 bg-white p-6 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-800">
                  <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    📅 Reschedule Booking
                  </h3>

                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Booking ID:</strong> {rescheduleModal.bookingId}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Donor:</strong> {rescheduleModal.donorName}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Current Date:</strong> {new Date(rescheduleModal.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Current Time:</strong> {rescheduleModal.time}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Date
                    </label>
                    <input
                      type="date"
                      id="reschedule-date"
                      min={new Date().toISOString().split('T')[0]}
                      defaultValue={new Date(rescheduleModal.date).toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Time
                    </label>
                    <input
                      type="time"
                      id="reschedule-time"
                      defaultValue={rescheduleModal.time}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const newDate = document.getElementById('reschedule-date').value;
                        const newTime = document.getElementById('reschedule-time').value;
                        if (!newDate || !newTime) {
                          showToast('Please select both date and time', 'warning');
                          return;
                        }
                        handleRescheduleBooking(newDate, newTime);
                      }}
                      disabled={rescheduling}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {rescheduling ? (
                        <>
                          <span className="inline-block animate-spin mr-2">â³</span>
                          Rescheduling...
                        </>
                      ) : (
                        <>✅ Confirm Reschedule</>
                      )}
                    </button>
                    <button
                      onClick={() => setRescheduleModal(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div >
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        inputPlaceholder={confirmModal.inputPlaceholder}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </Layout >
  );
}
