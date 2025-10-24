import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();
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
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const validateForm = () => {
    const errors = [];

    // Registration validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((formData.username || "").trim())) {
      errors.push("Username must be a valid email address.");
    }

    if (!formData.password || formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    }

    // Blood bank details validation
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
    const requiredFields = ['username', 'password', 'name', 'address', 'district', 'contactNumber', 'licenseNumber'];

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
      // Register blood bank user
      const res = await api.post("/bloodbank/register", {
        username: formData.username,
        password: formData.password,
      });

      if (res.data.success) {
        // Automatically log in the user to get tokens
        const loginRes = await api.post("/auth/login", {
          username: formData.username,
          password: formData.password,
        });

        if (loginRes.data.success && loginRes.data.data) {
          localStorage.setItem("accessToken", loginRes.data.data.accessToken);
          localStorage.setItem("refreshToken", loginRes.data.data.refreshToken);
          localStorage.setItem("userId", loginRes.data.data.user.id);
          localStorage.setItem("role", loginRes.data.data.user.role);
          localStorage.setItem("username", loginRes.data.data.user.username);

          const newUserId = res.data.data.userId;
          setUserId(newUserId);

          // Submit blood bank details
          await submitBloodBankDetails(newUserId);
        } else {
          alert(loginRes.data.message || "Login failed after registration");
        }
      } else {
        alert(res.data.message || "Registration failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert("❌ Validation Errors:\n" + validationErrors.join("\n"));
      setLoading(false);
      return;
    }

    try {
      await submitBloodBankDetails(userId);
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
    setLoading(false);
  };

  const submitBloodBankDetails = async (userId) => {
    const res = await api.post("/bloodbank/submit-details", {
      userId,
      name: formData.name,
      address: formData.address,
      district: formData.district,
      contactNumber: formData.contactNumber,
      licenseNumber: formData.licenseNumber,
    });

    if (res.data.success) {
      if (isRegister) {
        alert("✅ Blood bank registration submitted for approval!");
        navigate("/bloodbank-pending-approval");
      } else {
        alert("✅ Blood bank details updated successfully!");
        navigate("/bloodbank/dashboard");
      }
    } else {
      alert(res.data.message || "Submission failed");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
    } else if (name === 'username') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <Layout>
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setIsRegister(true)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              isRegister ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Register Blood Bank
          </button>
          <button
            onClick={() => setIsRegister(false)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              !isRegister ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Update Details
          </button>
        </div>
      </div>

      <form
        onSubmit={isRegister ? handleRegister : handleUpdate}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {isRegister ? "🏥 Register Blood Bank" : "🔄 Update Blood Bank Details"}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">
            {isRegister ? "Join our network of life-saving blood banks" : "Update your blood bank information"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {isRegister && (
            <>
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
            </>
          )}

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
            {loading ? "⏳ Processing..." : (isRegister ? '🏥 Register Blood Bank' : '🔄 Update Details')}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {isRegister ? 'By registering, you agree to our terms and conditions for blood bank operations.' : 'Update your details to keep your information current.'}
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
