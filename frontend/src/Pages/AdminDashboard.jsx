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
  }, [activeTab]);

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
      if (data.success) setDonors(data.data);
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

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/patients");
      if (data.success) {
        setPatients(data.data);
        setFilteredPatients(data.data);
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
      if (data.success) setRequests(data.data);
    } catch (error) {
      alert('Error fetching requests: ' + error.message);
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
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "donors" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Donors
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "users" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "admins" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Admins
        </button>
        <button
          onClick={() => setActiveTab("bloodbanks")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "bloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          All Blood Banks
        </button>
        <button
          onClick={() => setActiveTab("pendingBloodbanks")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "pendingBloodbanks" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Pending Blood Banks
        </button>
        <button
          onClick={() => setActiveTab("patients")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "patients" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Patients
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            activeTab === "requests" ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Requests
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
      </div>
    </Layout>
  );
}
