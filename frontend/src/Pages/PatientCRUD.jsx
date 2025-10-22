import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function PatientCRUD() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    address: '',
    bloodGroup: '',
    requiredUnits: '',
    requiredDate: '',
  });

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchPatients();
  }, [showDeleted]);

  const fetchPatients = async () => {
    try {
      const endpoint = showDeleted ? '/patients/deleted' : '/patients';
      const { data } = await api.get(endpoint);
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('❌ Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startEdit = (patient) => {
    setEditingPatient(patient._id);
    setFormData({
      patientName: patient.name || '',
      address: patient.address || '',
      bloodGroup: patient.bloodGroup || '',
      requiredUnits: patient.unitsRequired || '',
      requiredDate: patient.dateNeeded ? patient.dateNeeded.split('T')[0] : '',
    });
  };

  const cancelEdit = () => {
    setEditingPatient(null);
    setFormData({
      patientName: '',
      address: '',
      bloodGroup: '',
      requiredUnits: '',
      requiredDate: '',
    });
  };

  const handleUpdate = async (patientId) => {
    try {
      const payload = {
        patientName: formData.patientName.trim(),
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup,
        requiredUnits: parseInt(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      };

      const { data } = await api.put(`/patients/${patientId}`, payload);

      if (data.success) {
        alert('✅ Patient updated successfully!');
        setEditingPatient(null);
        fetchPatients();
      } else {
        alert('❌ ' + (data.message || 'Failed to update patient'));
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update patient';
      alert('❌ ' + errorMessage);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      const { data } = await api.delete(`/patients/${patientId}`);
      if (data.success) {
        alert('✅ Patient deleted successfully!');
        fetchPatients();
      } else {
        alert('❌ ' + (data.message || 'Failed to delete patient'));
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('❌ Failed to delete patient');
    }
  };

  const handleRestore = async (patientId) => {
    try {
      const { data } = await api.post(`/patients/${patientId}/restore`);
      if (data.success) {
        alert('✅ Patient restored successfully!');
        fetchPatients();
      } else {
        alert('❌ ' + (data.message || 'Failed to restore patient'));
      }
    } catch (error) {
      console.error('Error restoring patient:', error);
      alert('❌ Failed to restore patient');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading patients...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patient Management
          </h1>
          <div className="flex gap-4">
            <Link
              to="/patient-register"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add New Patient
            </Link>
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showDeleted ? 'Show Active' : 'Show Deleted'}
            </button>
            <button
              onClick={() => navigate('/bloodbank/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {showDeleted ? 'No deleted patients found' : 'No patients registered yet'}
            </p>
            {!showDeleted && (
              <Link
                to="/patient-register"
                className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Register First Patient
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      MRID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Units Required
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Date Needed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Blood Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {patients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-white/5">
                      {editingPatient === patient._id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              name="patientName"
                              value={formData.patientName}
                              onChange={handleInputChange}
                              className="w-full rounded border border-white/30 bg-white/20 px-2 py-1 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.mrid}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              name="bloodGroup"
                              value={formData.bloodGroup}
                              onChange={handleInputChange}
                              className="w-full rounded border border-white/30 bg-white/20 px-2 py-1 text-gray-900 dark:text-white"
                            >
                              {BLOOD_GROUPS.map(group => (
                                <option key={group} value={group}>{group}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              name="requiredUnits"
                              value={formData.requiredUnits}
                              onChange={handleInputChange}
                              min="1"
                              className="w-full rounded border border-white/30 bg-white/20 px-2 py-1 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="date"
                              name="requiredDate"
                              value={formData.requiredDate}
                              onChange={handleInputChange}
                              className="w-full rounded border border-white/30 bg-white/20 px-2 py-1 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.bloodBankId?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(patient._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.name}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.mrid}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.bloodGroup}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.unitsRequired}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.dateNeeded ? new Date(patient.dateNeeded).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {patient.bloodBankId?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {!showDeleted ? (
                                <>
                                  <button
                                    onClick={() => startEdit(patient)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(patient._id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRestore(patient._id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
