import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function DonorCRUD() {
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    contactNumber: '',
    emergencyContactNumber: '',
    houseName: '',
    houseAddress: '',
    localBody: '',
    city: '',
    district: '',
    pincode: '',
    workAddress: '',
    weight: '',
    availability: 'available',
    lastDonationDate: '',
    contactPreference: 'phone',
  });

  useEffect(() => {
    fetchDonorProfile();
  }, []);

  const fetchDonorProfile = async () => {
    try {
      const { data } = await api.get('/donors/me');
      if (data.success) {
        setDonor(data.data);
        // Populate form with existing data
        const d = data.data;
        setFormData({
          name: d.name || '',
          dob: d.dob ? d.dob.split('T')[0] : '',
          gender: d.gender || '',
          bloodGroup: d.bloodGroup || '',
          contactNumber: d.contactNumber || '',
          emergencyContactNumber: d.emergencyContactNumber || '',
          houseName: d.houseAddress?.houseName || '',
          houseAddress: d.houseAddress?.houseAddress || '',
          localBody: d.houseAddress?.localBody || '',
          city: d.houseAddress?.city || '',
          district: d.houseAddress?.district || '',
          pincode: d.houseAddress?.pincode || '',
          workAddress: d.workAddress || '',
          weight: d.weight || '',
          availability: d.availability ? 'available' : 'unavailable',
          lastDonationDate: d.lastDonatedDate ? d.lastDonatedDate.split('T')[0] : '',
          contactPreference: d.contactPreference || 'phone',
        });
      }
    } catch (error) {
      console.error('Error fetching donor profile:', error);
      if (error.response?.status === 404) {
        alert('Donor profile not found. Please register as a donor first.');
        navigate('/donor-register');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        contactNumber: formData.contactNumber,
        emergencyContactNumber: formData.emergencyContactNumber,
        houseAddress: {
          houseName: formData.houseName,
          houseAddress: formData.houseAddress,
          localBody: formData.localBody,
          city: formData.city,
          district: formData.district,
          pincode: formData.pincode,
        },
        workAddress: formData.workAddress,
        weight: parseFloat(formData.weight),
        availability: formData.availability === 'available',
        lastDonatedDate: formData.lastDonationDate || null,
        contactPreference: formData.contactPreference,
      };

      const { data } = await api.put('/donors/update', payload);
      if (data.success) {
        alert('✅ Donor profile updated successfully!');
        setDonor(data.data);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating donor profile:', error);
      alert('❌ Failed to update donor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your donor profile? This action cannot be undone.')) {
      return;
    }

    try {
      const { data } = await api.delete('/donors/delete');
      if (data.success) {
        alert('✅ Donor profile deleted successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting donor profile:', error);
      alert('❌ Failed to delete donor profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading donor profile...</div>
        </div>
      </Layout>
    );
  }

  if (!donor) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="text-xl mb-4">Donor profile not found</div>
          <Link
            to="/donor-register"
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Register as Donor
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Donor Profile Management
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form fields - same as DonorRegister.jsx */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  required
                >
                  <option value="">Select Blood Group</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  name="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  House Name
                </label>
                <input
                  type="text"
                  name="houseName"
                  value={formData.houseName}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  House Address
                </label>
                <input
                  type="text"
                  name="houseAddress"
                  value={formData.houseAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local Body
                </label>
                <input
                  type="text"
                  name="localBody"
                  value={formData.localBody}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Address
                </label>
                <input
                  type="text"
                  name="workAddress"
                  value={formData.workAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  required
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Donation Date
                </label>
                <input
                  type="date"
                  name="lastDonationDate"
                  value={formData.lastDonationDate}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Preference
                </label>
                <select
                  name="contactPreference"
                  value={formData.contactPreference}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  required
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.userId?._id || donor.userId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blood Group</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.bloodGroup}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Number</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.contactNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Availability</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.availability ? 'Available' : 'Unavailable'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Weight</p>
                <p className="text-lg text-gray-900 dark:text-white">{donor.weight} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Donation</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {donor.lastDonatedDate ? new Date(donor.lastDonatedDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Delete Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
