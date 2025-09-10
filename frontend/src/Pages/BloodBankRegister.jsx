import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";

// Allowed values and regex patterns for client-side validation
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;              // letters + common name punctuation
const CITY_DISTRICT_REGEX = /^[A-Za-z\s]{2,50}$/;                 // letters and spaces
const ALNUM_SPACE_ADDR_REGEX = /^[A-Za-z0-9\s.,-]{3,200}$/;       // letters/numbers/spaces with , . -
const PHONE_IN_REGEX = /^[6-9]\d{9}$/;                            // Indian 10-digit starting 6-9
const LICENSE_REGEX = /^[A-Za-z0-9\s-]{5,50}$/;                   // license number format

export default function BloodBankRegister() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    address: "",
    district: "",
    contactNumber: "",
    licenseNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = [];

    // Common validation for blood bank details
    if (!NAME_REGEX.test((formData.name || "").trim())) {
      errors.push("Blood bank name must contain only letters, spaces, and basic punctuation (.'-)");
    }

    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.address || "").trim())) {
      errors.push("Address must contain only letters, numbers, spaces or , . -");
    }

    if (!CITY_DISTRICT_REGEX.test((formData.district || "").trim())) {
      errors.push("District must contain only letters and spaces");
    }

    if (!PHONE_IN_REGEX.test(formData.contactNumber)) {
      errors.push("Contact number must be a valid Indian number (10 digits, starts with 6-9)");
    }

    if (!LICENSE_REGEX.test((formData.licenseNumber || "").trim())) {
      errors.push("License number must be 5-50 characters and contain only letters, numbers, spaces, and hyphens");
    }

    // Required fields
    const requiredFields = ['name', 'address', 'district', 'contactNumber', 'licenseNumber'];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    });

    // Validate no fields with only spaces
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() === '') {
        errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} cannot be empty or only spaces`);
      }
    });

    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert("❌ Validation Errors:\n" + validationErrors.join("\n"));
      setLoading(false);
      return;
    }

    try {
      // First register the blood bank user
      const registerRes = await api.post("/bloodbank/register", {
        username: formData.username,
        password: formData.password,
      });

      if (!registerRes.data.success) {
        throw new Error(registerRes.data.message || "Registration failed");
      }

      // Blood bank details submission now uses authenticated user context on backend
      const submitRes = await api.post("/bloodbank/submit-details", {
        name: formData.name,
        address: formData.address,
        district: formData.district,
        contactNumber: formData.contactNumber,
        licenseNumber: formData.licenseNumber,
      });

      if (!submitRes.data.success) {
        throw new Error(submitRes.data.message || "Failed to submit blood bank details");
      }

      alert("✅ Blood bank registered successfully! Please login to continue.");
      navigate("/bloodbank-login");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Registration failed");
    }
    setLoading(false);
  };



  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <Layout>
      <form
        onSubmit={handleRegister}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            🏥 Register Blood Bank
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">
            Join our network of life-saving blood banks
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Username (Email)</label>
            <input
              type="email"
              name="username"
              placeholder="Enter your email address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood Bank Name</label>
            <input
              type="text"
              name="name"
              placeholder="Blood Bank Name"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.contactNumber}
              onChange={handleChange}
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Full Address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">District</label>
            <input
              type="text"
              name="district"
              placeholder="District"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.district}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">License Number</label>
            <input
              type="text"
              name="licenseNumber"
              placeholder="Blood Bank License Number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "⏳ Processing..." : '🏥 Register Blood Bank'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            By registering, you agree to our terms and conditions for blood bank operations.
          </p>
          <div className="mt-2">
            <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              ← Back to Home
            </Link>
          </div>
        </div>
      </form>
    </Layout>
  );
}
