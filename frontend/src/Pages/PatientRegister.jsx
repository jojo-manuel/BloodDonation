import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    address: '',
    bloodGroup: '',
    mrid: '',
    phoneNumber: '',
    requiredUnits: '',
    requiredDate: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.patientName.trim()) {
      errors.push('Patient name is required');
    }

    if (!formData.address.trim()) {
      errors.push('Address is required');
    }

    if (!BLOOD_GROUPS.includes(formData.bloodGroup)) {
      errors.push('Please select a valid blood group');
    }

    if (!formData.mrid.trim()) {
      errors.push('MRID is required');
    }

    if (!formData.phoneNumber.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.push('Phone number must be exactly 10 digits');
    }

    if (!formData.requiredUnits || formData.requiredUnits < 1) {
      errors.push('Units required must be at least 1');
    }

    if (!formData.requiredDate) {
      errors.push('Required date is required');
    } else {
      const selectedDate = new Date(formData.requiredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.push('Required date must be today or in the future');
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('❌ Validation Errors:\n' + validationErrors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        patientName: formData.patientName.trim(),
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup,
        mrid: formData.mrid.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        requiredUnits: parseInt(formData.requiredUnits),
        requiredDate: formData.requiredDate,
      };

      const { data } = await api.post('/patients', payload);

      if (data.success) {
        alert('✅ Patient registered successfully!');
        navigate('/patient-crud');
      } else {
        alert('❌ ' + (data.message || 'Failed to register patient'));
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register patient';
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Register New Patient
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add a new patient requiring blood transfusion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient Name *
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                placeholder="Enter patient name"
                required
              />
            </div>

            <div>
              <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Blood Group *
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                required
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                MRID *
              </label>
              <input
                type="text"
                name="mrid"
                value={formData.mrid}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                placeholder="Medical Record ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                placeholder="10-digit phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Units Required *
              </label>
              <input
                type="number"
                name="requiredUnits"
                value={formData.requiredUnits}
                onChange={handleInputChange}
                min="1"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                placeholder="Number of units"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Needed *
              </label>
              <input
                type="date"
                name="requiredDate"
                value={formData.requiredDate}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              placeholder="Enter patient address"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/patient-crud')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
