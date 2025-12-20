import React, { useState, useEffect } from "react";
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import api from "../lib/api";
import Layout from "../components/Layout";
import DonorSearchForm from "../components/DonorSearchForm";
import UserSearchForm from "../components/UserSearchForm";
import PatientSearchForm from "../components/PatientSearchForm";
import Navbar from "../components/Navbar";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("donors");
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [bloodbanks, setBloodbanks] = useState([]);
  const [pendingBloodbanks, setPendingBloodbanks] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedBloodBank, setSelectedBloodBank] = useState(null);
  const [sectionUsers, setSectionUsers] = useState([]);
  const [showSectionUserForm, setShowSectionUserForm] = useState(false);
  const [sectionUserForm, setSectionUserForm] = useState({
    section: '',
    username: '',
    password: '',
    name: '',
    email: '',
    phone: ''
  });

  // Activities state
  const [activities, setActivities] = useState([]);
  const [activityUsername, setActivityUsername] = useState("");
  const [activityAction, setActivityAction] = useState("all");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);

  // Safely format address objects for display
  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const { houseName, houseAddress, localBody, city, district, state, pincode } = addr || {};
    return [houseName, houseAddress, localBody, city, district, state, pincode]
      .filter(Boolean)
      .join(', ');
  };

  // Search states for donors
  const [searchBloodGroup, setSearchBloodGroup] = useState("");
  const [searchPlace, setSearchPlace] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Search states for users
  const [searchUserRole, setSearchUserRole] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [searchUserDate, setSearchUserDate] = useState("");

  // Search states for patients
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchPatientBloodGroup, setSearchPatientBloodGroup] = useState("");
  const [searchPatientUnits, setSearchPatientUnits] = useState("");
  const [searchPatientDate, setSearchPatientDate] = useState("");
  const [searchPatientMRID, setSearchPatientMRID] = useState("");
  const [patientShowDropdown, setPatientShowDropdown] = useState(false);

  useEffect(() => {
    if (activeTab === "donors") fetchDonors();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "admins") fetchAdmins();
    else if (activeTab === "bloodbanks") fetchBloodbanks();
    else if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    else if (activeTab === "patients") fetchPatients();
    else if (activeTab === "requests") fetchRequests();
    else if (activeTab === "activities") fetchActivities();
    else if (activeTab === "bloodbankRegistration") fetchBloodbanks();
  }, [activeTab]);

  // Fetch activities when filters change
  useEffect(() => {
    if (activeTab === "activities") {
      fetchActivities();
    }
  }, [activityUsername, activityAction, activityStartDate, activityEndDate, activityPage]);

  // Filter donors based on search criteria
  useEffect(() => {
    if (activeTab === "donors") {
      let filtered = donors;
      if (searchBloodGroup) {
        filtered = filtered.filter(donor => donor.bloodGroup === searchBloodGroup);
      }
      if (searchPlace) {
        filtered = filtered.filter(donor =>
          donor.userId?.address?.toLowerCase().includes(searchPlace.toLowerCase()) ||
          donor.userId?.district?.toLowerCase().includes(searchPlace.toLowerCase()) ||
          donor.userId?.state?.toLowerCase().includes(searchPlace.toLowerCase())
        );
      }
      setFilteredDonors(filtered);
    }
  }, [donors, searchBloodGroup, searchPlace, activeTab]);

  // Filter users based on search criteria
  useEffect(() => {
    if (activeTab === "users") {
      let filtered = users;
      if (searchUsername) {
        filtered = filtered.filter(user => user.username.toLowerCase().includes(searchUsername.toLowerCase()));
      }
      if (searchUserRole) {
        filtered = filtered.filter(user => user.role.toLowerCase().includes(searchUserRole.toLowerCase()));
      }
      if (searchUserDate) {
        const searchDate = new Date(searchUserDate).toDateString();
        filtered = filtered.filter(user => new Date(user.createdAt).toDateString() === searchDate);
      }
      setFilteredUsers(filtered);
    }
  }, [users, searchUsername, searchUserRole, searchUserDate, activeTab]);

  // Filter patients based on search criteria
  useEffect(() => {
    if (activeTab === "patients") {
      let filtered = patients;
      if (searchPatientName) {
        filtered = filtered.filter(patient => patient.name.toLowerCase().includes(searchPatientName.toLowerCase()));
      }
      if (searchPatientBloodGroup) {
        filtered = filtered.filter(patient => patient.bloodGroup === searchPatientBloodGroup);
      }
      if (searchPatientUnits) {
        filtered = filtered.filter(patient => patient.unitsRequired == parseInt(searchPatientUnits));
      }
      if (searchPatientDate) {
        const searchDate = new Date(searchPatientDate).toDateString();
        filtered = filtered.filter(patient => new Date(patient.dateNeeded).toDateString() === searchDate);
      }
      if (searchPatientMRID) {
        filtered = filtered.filter(patient => patient.mrid.toLowerCase().includes(searchPatientMRID.toLowerCase()));
      }
      setFilteredPatients(filtered);
    }
  }, [patients, searchPatientName, searchPatientBloodGroup, searchPatientUnits, searchPatientDate, searchPatientMRID, activeTab]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/donors");
      if (data.success) {
        // api returns { data: { donors: [], pagination: {} } }
        setDonors(data.data.donors || data.data);
      }
    } catch (error) {
      alert("Error fetching donors: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      }
    } catch (error) {
      alert("Error fetching users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/admins");
      if (data.success) setAdmins(data.data);
    } catch (error) {
      alert("Error fetching admins: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodbanks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/bloodbanks");
      if (data.success) setBloodbanks(data.data);
    } catch (error) {
      alert("Error fetching bloodbanks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBloodbanks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/bloodbanks");
      console.log("All bloodbanks data:", data.data);
      if (data.success) {
        const pending = data.data.filter(bb => bb.status === "pending");
        console.log("Filtered pending bloodbanks:", pending);
        setPendingBloodbanks(pending);
      }
    } catch (error) {
      console.log("Error fetching pending bloodbanks:", error);
      alert("Error fetching pending bloodbanks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionUsers = async (bloodBankId) => {
    try {
      const { data } = await api.get(`/admin/bloodbanks/${bloodBankId}/section-users`);
      if (data.success) {
        setSectionUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching section users:", error);
      alert("Error fetching section users: " + error.message);
    }
  };

  const handleCreateSectionUser = async (e) => {
    e.preventDefault();
    if (!selectedBloodBank) {
      alert("Please select a blood bank first");
      return;
    }

    try {
      const { data } = await api.post(
        `/admin/bloodbanks/${selectedBloodBank._id}/section-users`,
        sectionUserForm
      );
      if (data.success) {
        alert("Section user created successfully!");
        setSectionUserForm({
          section: '',
          username: '',
          password: '',
          name: '',
          email: '',
          phone: ''
        });
        setShowSectionUserForm(false);
        fetchSectionUsers(selectedBloodBank._id);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error creating section user");
    }
  };

  const handleDeleteSectionUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this section user?")) {
      return;
    }

    try {
      const { data } = await api.delete(
        `/admin/bloodbanks/${selectedBloodBank._id}/section-users/${userId}`
      );
      if (data.success) {
        alert("Section user deleted successfully!");
        fetchSectionUsers(selectedBloodBank._id);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error deleting section user");
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/patients");
      if (data.success) {
        // Handle both array and paginated response
        const patientsData = data.data.patients || data.data;
        setPatients(patientsData);
        setFilteredPatients(patientsData);
      }
    } catch (error) {
      alert("Error fetching patients: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/donation-requests');
      if (data.success) {
        // api returns { data: { requests: [], pagination: {} } }
        setRequests(data.data.requests || data.data);
      }
    } catch (error) {
      alert('Error fetching requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (activityUsername && activityUsername.trim()) {
        params.append('username', activityUsername.trim());
      }
      if (activityAction && activityAction !== 'all') {
        params.append('action', activityAction);
      }
      if (activityStartDate) {
        params.append('startDate', activityStartDate);
      }
      if (activityEndDate) {
        params.append('endDate', activityEndDate);
      }
      params.append('page', activityPage);
      params.append('limit', 50);

      const { data } = await api.get(`/admin/activities?${params.toString()}`);
      if (data.success) {
        setActivities(data.data);
        setActivityTotal(data.total);
        setActivityTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('Error fetching activities: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/approve`);
      alert("Bloodbank approved");
      fetchBloodbanks();
      if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    } catch (error) {
      alert("Error approving: " + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/bloodbanks/${id}/reject`);
      alert("Bloodbank rejected");
      fetchBloodbanks();
      if (activeTab === "pendingBloodbanks") fetchPendingBloodbanks();
    } catch (error) {
      alert("Error rejecting: " + error.message);
    }
  };

  const handleSetStatus = async (type, id, status) => {
    const { isBlocked, isSuspended, warningMessage } = status;
    try {
      await api.put(`/admin/${type}/${id}/status`, { isBlocked, isSuspended, warningMessage });
      alert(`${type} status updated`);
      if (type === "donors") fetchDonors();
      else if (type === "users") fetchUsers();
      else if (type === "bloodbanks") fetchBloodbanks();
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const handleRequestDonation = async (donorId) => {
    const message = prompt("Enter a custom message for the donation request (optional):");
    if (message === null) return; // User cancelled

    try {
      const { data } = await api.post(`/admin/donors/${donorId}/request-donation`, { message });
      if (data.success) {
        alert("Donation request sent successfully!");
      } else {
        alert("Failed to send donation request: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      alert("Error sending donation request: " + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Layout>
      <Navbar onLogout={handleLogout} />
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("donors")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "donors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Donors
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "users" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "admins" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Admins
          </button>
          <button
            onClick={() => setActiveTab("bloodbanks")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "bloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            All Blood Banks
          </button>
          <button
            onClick={() => setActiveTab("pendingBloodbanks")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "pendingBloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Pending Blood Banks
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "patients" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Patients
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "requests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeTab === "activities" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
          >
            📊 Activities
          </button>
          <button
            onClick={() => window.location.href = "/bloodbank-admin-register"}
            className="px-6 py-2 rounded-full font-semibold transition text-gray-700 dark:text-gray-300 hover:bg-pink-600 hover:text-white"
          >
            🏥 Blood Bank Registration
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-auto max-h-[70vh]">
        {activeTab === "donors" && (
          <>
            <DonorSearchForm
              searchBloodGroup={searchBloodGroup}
              setSearchBloodGroup={setSearchBloodGroup}
              searchPlace={searchPlace}
              setSearchPlace={setSearchPlace}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              onClear={() => {
                setSearchBloodGroup("");
                setSearchPlace("");
              }}
            />

            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader aria-label="donors table" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Donor Name</StyledTableCell>
                    <StyledTableCell>Blood Group</StyledTableCell>
                    <StyledTableCell>Contact</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell>Warning</StyledTableCell>
                    <StyledTableCell align="center">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={6} align="center">
                        Loading donors...
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : donors.length === 0 ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={6} align="center">
                        No donors found.
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : (
                    filteredDonors.map((donor) => (
                      <StyledTableRow key={donor._id}>
                        <StyledTableCell>{donor.userId?.name || "N/A"}</StyledTableCell>
                        <StyledTableCell>{donor.bloodGroup}</StyledTableCell>
                        <StyledTableCell>{donor.contactNumber}</StyledTableCell>
                        <StyledTableCell>{donor.isBlocked ? 'Blocked' : donor.isSuspended ? 'Suspended' : 'Active'}</StyledTableCell>
                        <StyledTableCell>{donor.warningMessage || 'None'}</StyledTableCell>
                        <StyledTableCell align="center" sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleRequestDonation(donor._id)}
                            style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title="Request Donation"
                          >
                            📧
                          </button>
                          <button
                            onClick={() => handleSetStatus('donors', donor._id, { isBlocked: !donor.isBlocked, isSuspended: donor.isSuspended, warningMessage: donor.warningMessage })}
                            style={{ backgroundColor: donor.isBlocked ? '#dc2626' : '#ef4444', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title={donor.isBlocked ? 'Unblock' : 'Block'}
                          >
                            {donor.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleSetStatus('donors', donor._id, { isBlocked: donor.isBlocked, isSuspended: !donor.isSuspended, warningMessage: donor.warningMessage })}
                            style={{ backgroundColor: donor.isSuspended ? '#f97316' : '#f59e0b', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title={donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                          >
                            {donor.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => {
                              const message = prompt('Enter warning message:');
                              if (message !== null) handleSetStatus('donors', donor._id, { isBlocked: donor.isBlocked, isSuspended: donor.isSuspended, warningMessage: message });
                            }}
                            style={{ backgroundColor: '#0ea5e9', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title="Warn"
                          >
                            Warn
                          </button>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {activeTab === "users" && (
          <>
            <UserSearchForm
              searchRole={searchUserRole}
              setSearchRole={setSearchUserRole}
              searchUsername={searchUsername}
              setSearchUsername={setSearchUsername}
              searchUserDate={searchUserDate}
              setSearchUserDate={setSearchUserDate}
              onClear={() => {
                setSearchUserRole("");
                setSearchUsername("");
                setSearchUserDate("");
              }}
            />
            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader aria-label="users table" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Username</StyledTableCell>
                    <StyledTableCell>Email</StyledTableCell>
                    <StyledTableCell>Role</StyledTableCell>
                    <StyledTableCell>Created Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={4} align="center">
                        Loading users...
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : filteredUsers.length === 0 ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={4} align="center">
                        No users found.
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <StyledTableRow key={user._id}>
                        <StyledTableCell>{user.username}</StyledTableCell>
                        <StyledTableCell>{user.email}</StyledTableCell>
                        <StyledTableCell>{user.role}</StyledTableCell>
                        <StyledTableCell>{new Date(user.createdAt).toLocaleDateString()}</StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {activeTab === "admins" && (
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader aria-label="admins table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Username</StyledTableCell>
                  <StyledTableCell>Email</StyledTableCell>
                  <StyledTableCell>Role</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={3} align="center">
                      Loading admins...
                    </StyledTableCell>
                  </StyledTableRow>
                ) : admins.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={3} align="center">
                      No admins found.
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  admins.map((admin) => (
                    <StyledTableRow key={admin._id}>
                      <StyledTableCell>{admin.username}</StyledTableCell>
                      <StyledTableCell>{admin.email}</StyledTableCell>
                      <StyledTableCell>{admin.role}</StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {activeTab === "bloodbanks" && (
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader aria-label="bloodbanks table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Address</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4} align="center">
                      Loading blood banks...
                    </StyledTableCell>
                  </StyledTableRow>
                ) : bloodbanks.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4} align="center">
                      No blood banks found.
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  bloodbanks.map((bb) => (
                    <StyledTableRow key={bb._id}>
                      <StyledTableCell>{bb.name}</StyledTableCell>
                      <StyledTableCell>{formatAddress(bb.address)}</StyledTableCell>
                      <StyledTableCell>{bb.status}</StyledTableCell>
                      <StyledTableCell align="center">
                        {bb.status === "pending" && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(bb._id)}
                              style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                              title="Approve"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(bb._id)}
                              style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                              title="Reject"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {activeTab === "pendingBloodbanks" && (
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader aria-label="pending bloodbanks table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Address</StyledTableCell>
                  <StyledTableCell>District</StyledTableCell>
                  <StyledTableCell>Contact</StyledTableCell>
                  <StyledTableCell>License</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={7} align="center">
                      Loading pending blood banks...
                    </StyledTableCell>
                  </StyledTableRow>
                ) : pendingBloodbanks.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={7} align="center">
                      No pending blood bank approvals.
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  pendingBloodbanks.map((bb) => (
                    <StyledTableRow key={bb._id}>
                      <StyledTableCell>{bb.name}</StyledTableCell>
                      <StyledTableCell>{formatAddress(bb.address)}</StyledTableCell>
                      <StyledTableCell>{bb.district}</StyledTableCell>
                      <StyledTableCell>{bb.contactNumber}</StyledTableCell>
                      <StyledTableCell>{bb.licenseNumber}</StyledTableCell>
                      <StyledTableCell>Pending Approval</StyledTableCell>
                      <StyledTableCell align="center">
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleApprove(bb._id)}
                            style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(bb._id)}
                            style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: 12, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            title="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {activeTab === "patients" && (
          <>
            <PatientSearchForm
              searchPatientName={searchPatientName}
              setSearchPatientName={setSearchPatientName}
              searchPatientBloodGroup={searchPatientBloodGroup}
              setSearchPatientBloodGroup={setSearchPatientBloodGroup}
              searchPatientUnits={searchPatientUnits}
              setSearchPatientUnits={setSearchPatientUnits}
              searchPatientDate={searchPatientDate}
              setSearchPatientDate={setSearchPatientDate}
              searchPatientMRID={searchPatientMRID}
              setSearchPatientMRID={setSearchPatientMRID}
              patientShowDropdown={patientShowDropdown}
              setPatientShowDropdown={setPatientShowDropdown}
              onClear={() => {
                setSearchPatientName("");
                setSearchPatientBloodGroup("");
                setSearchPatientUnits("");
                setSearchPatientDate("");
                setSearchPatientMRID("");
              }}
            />
            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader aria-label="patients table" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Name</StyledTableCell>
                    <StyledTableCell>Blood Group</StyledTableCell>
                    <StyledTableCell>MRID</StyledTableCell>
                    <StyledTableCell>Units Required</StyledTableCell>
                    <StyledTableCell>Address</StyledTableCell>
                    <StyledTableCell>Date Needed</StyledTableCell>
                    <StyledTableCell>Blood Bank</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={7} align="center">
                        Loading patients...
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : filteredPatients.length === 0 ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={7} align="center">
                        No patients found.
                      </StyledTableCell>
                    </StyledTableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <StyledTableRow key={patient._id}>
                        <StyledTableCell>{patient.name}</StyledTableCell>
                        <StyledTableCell>{patient.bloodGroup}</StyledTableCell>
                        <StyledTableCell>{patient.mrid}</StyledTableCell>
                        <StyledTableCell>{patient.unitsRequired}</StyledTableCell>
                        <StyledTableCell>{formatAddress(patient.address)}</StyledTableCell>
                        <StyledTableCell>{new Date(patient.dateNeeded).toLocaleDateString()}</StyledTableCell>
                        <StyledTableCell>{patient.bloodBankId?.name || "N/A"}</StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {activeTab === "requests" && (
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader aria-label="requests table" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Request ID</StyledTableCell>
                  <StyledTableCell>User Name</StyledTableCell>
                  <StyledTableCell>Donor Name</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4} align="center">Loading requests...</StyledTableCell>
                  </StyledTableRow>
                ) : requests.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4} align="center">No requests found.</StyledTableCell>
                  </StyledTableRow>
                ) : (
                  requests.map((r) => (
                    <StyledTableRow key={r.id}>
                      <StyledTableCell>{r.id}</StyledTableCell>
                      <StyledTableCell>{r.userName}</StyledTableCell>
                      <StyledTableCell>{r.donorName}</StyledTableCell>
                      <StyledTableCell>{r.date ? new Date(r.date).toLocaleString() : 'N/A'}</StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === "activities" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Activities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={activityUsername}
                    onChange={(e) => {
                      setActivityUsername(e.target.value);
                      setActivityPage(1); // Reset to page 1 on filter change
                    }}
                    placeholder="Search username..."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action
                  </label>
                  <select
                    value={activityAction}
                    onChange={(e) => {
                      setActivityAction(e.target.value);
                      setActivityPage(1);
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Actions</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="booking_created">Booking Created</option>
                    <option value="booking_updated">Booking Updated</option>
                    <option value="booking_cancelled">Booking Cancelled</option>
                    <option value="booking_rescheduled">Booking Rescheduled</option>
                    <option value="request_created">Request Created</option>
                    <option value="request_accepted">Request Accepted</option>
                    <option value="request_rejected">Request Rejected</option>
                    <option value="user_blocked">User Blocked</option>
                    <option value="user_unblocked">User Unblocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={activityStartDate}
                    onChange={(e) => {
                      setActivityStartDate(e.target.value);
                      setActivityPage(1);
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={activityEndDate}
                    onChange={(e) => {
                      setActivityEndDate(e.target.value);
                      setActivityPage(1);
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setActivityUsername("");
                    setActivityAction("all");
                    setActivityStartDate("");
                    setActivityEndDate("");
                    setActivityPage(1);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => fetchActivities()}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
                >
                  Apply Filters
                </button>
              </div>

              {activityTotal > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Showing {activities.length} of {activityTotal} activities (Page {activityPage} of {activityTotalPages})
                </div>
              )}
            </div>

            {/* Activities Table */}
            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader aria-label="activities table" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Timestamp</StyledTableCell>
                    <StyledTableCell>Username</StyledTableCell>
                    <StyledTableCell>Role</StyledTableCell>
                    <StyledTableCell>Action</StyledTableCell>
                    <StyledTableCell>Details</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={5} align="center">Loading activities...</StyledTableCell>
                    </StyledTableRow>
                  ) : activities.length === 0 ? (
                    <StyledTableRow>
                      <StyledTableCell colSpan={5} align="center">No activities found.</StyledTableCell>
                    </StyledTableRow>
                  ) : (
                    activities.map((activity) => (
                      <StyledTableRow key={activity._id}>
                        <StyledTableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </StyledTableCell>
                        <StyledTableCell>
                          {activity.userId?.username || 'Unknown'}
                          {activity.userId?.name && (
                            <div className="text-xs text-gray-500">{activity.userId.name}</div>
                          )}
                        </StyledTableCell>
                        <StyledTableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${activity.role === 'admin' ? 'bg-red-100 text-red-800' :
                            activity.role === 'bloodbank' ? 'bg-blue-100 text-blue-800' :
                              activity.role === 'donor' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {activity.role}
                          </span>
                        </StyledTableCell>
                        <StyledTableCell>{activity.action}</StyledTableCell>
                        <StyledTableCell>
                          <pre className="text-xs max-w-md overflow-auto">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {activityTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                  disabled={activityPage === 1}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-900 dark:text-white">
                  Page {activityPage} of {activityTotalPages}
                </span>
                <button
                  onClick={() => setActivityPage(Math.min(activityTotalPages, activityPage + 1))}
                  disabled={activityPage === activityTotalPages}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bloodbankRegistration" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🏥 Blood Bank Registration & Section User Management
              </h2>

              {/* Blood Bank Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Blood Bank
                </label>
                <select
                  value={selectedBloodBank?._id || ''}
                  onChange={(e) => {
                    const bb = bloodbanks.find(b => b._id === e.target.value);
                    setSelectedBloodBank(bb);
                    if (bb) {
                      fetchSectionUsers(bb._id);
                    } else {
                      setSectionUsers([]);
                    }
                  }}
                  className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">-- Select a Blood Bank --</option>
                  {bloodbanks.filter(bb => bb.status === 'approved').map(bb => (
                    <option key={bb._id} value={bb._id}>
                      {bb.name} ({bb.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBloodBank && (
                <>
                  {/* Blood Bank Info */}
                  <div className="mb-6 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedBloodBank.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Address:</strong> {selectedBloodBank.address}
                    </p>
                    {selectedBloodBank.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Email:</strong> {selectedBloodBank.email}
                      </p>
                    )}
                    {selectedBloodBank.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Phone:</strong> {selectedBloodBank.phone}
                      </p>
                    )}
                  </div>

                  {/* Section Users List */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Section Users
                      </h3>
                      <button
                        onClick={() => setShowSectionUserForm(!showSectionUserForm)}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                      >
                        {showSectionUserForm ? 'Cancel' : '+ Add Section User'}
                      </button>
                    </div>

                    {/* Section User Form */}
                    {showSectionUserForm && (
                      <form onSubmit={handleCreateSectionUser} className="mb-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-800">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Create New Section User
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Section *
                            </label>
                            <select
                              value={sectionUserForm.section}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, section: e.target.value })}
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select Section</option>
                              <option value="centrifuge">Centrifuge Unit</option>
                              <option value="frontdesk">Front Desk</option>
                              <option value="store">Store</option>
                              <option value="bleeding">Bleeding Unit</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Username *
                            </label>
                            <input
                              type="text"
                              value={sectionUserForm.username}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, username: e.target.value })}
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Password *
                            </label>
                            <input
                              type="password"
                              value={sectionUserForm.password}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, password: e.target.value })}
                              required
                              minLength={6}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={sectionUserForm.name}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, name: e.target.value })}
                              required
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={sectionUserForm.email}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, email: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={sectionUserForm.phone}
                              onChange={(e) => setSectionUserForm({ ...sectionUserForm, phone: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                        >
                          Create Section User
                        </button>
                      </form>
                    )}

                    {/* Section Users Table */}
                    <TableContainer component={Paper} sx={{ maxHeight: '50vh' }}>
                      <Table stickyHeader aria-label="section users table">
                        <TableHead>
                          <TableRow>
                            <StyledTableCell>Section</StyledTableCell>
                            <StyledTableCell>Username</StyledTableCell>
                            <StyledTableCell>Name</StyledTableCell>
                            <StyledTableCell>Email</StyledTableCell>
                            <StyledTableCell>Phone</StyledTableCell>
                            <StyledTableCell>Status</StyledTableCell>
                            <StyledTableCell>Actions</StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sectionUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center">
                                No section users found. Create one to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            sectionUsers.map((user) => (
                              <StyledTableRow key={user._id}>
                                <TableCell>
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {user.section === 'centrifuge' ? '🔄 Centrifuge' :
                                      user.section === 'frontdesk' ? '🖥️ Front Desk' :
                                        user.section === 'store' ? '📦 Store' :
                                          '🩸 Bleeding Unit'}
                                  </span>
                                </TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email || 'N/A'}</TableCell>
                                <TableCell>{user.phone || 'N/A'}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive && !user.isBlocked
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                    {user.isActive && !user.isBlocked ? 'Active' : 'Inactive'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => handleDeleteSectionUser(user._id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                  >
                                    Delete
                                  </button>
                                </TableCell>
                              </StyledTableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
