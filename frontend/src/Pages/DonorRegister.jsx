// Pages/DonorRegister.jsx
// Donor profile form for authenticated users; submits to /donors/register.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          <span className="text-xl">🩸</span>
        </div>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent dark:from-rose-300 dark:to-amber-200">Blood Donation</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">Connect. Donate. Save lives.</p>
        </div>
      </Link>
      <button
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm backdrop-blur-md transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        aria-label="Toggle dark mode"
      >
        <span className="h-4 w-4">{isDark ? "🌙" : "☀️"}</span>
        <span>{isDark ? "Dark" : "Light"} mode</span>
      </button>
    </nav>
  );
}

import Layout from "../components/Layout";

export default function DonorRegister() {
  const [isDonor, setIsDonor] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    contactNumber: "",
    emergencyContactNumber: "",
    houseName: "",
    houseAddress: "",
    localBody: "",
    city: "",
    district: "",
    pincode: "",
    workAddress: "",
    availability: "available",
    lastDonationDate: "",
    contactPreference: "phone",
  });

  const validateForm = () => {
    const errors = [];

    // Contact number validation
    if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      errors.push("Contact number must be exactly 10 digits");
    }

    // Emergency contact validation
    if (!/^[0-9]{10}$/.test(formData.emergencyContactNumber)) {
      errors.push("Emergency contact must be exactly 10 digits");
    }

    if (formData.contactNumber === formData.emergencyContactNumber) {
      errors.push("Emergency contact cannot be the same as contact number");
    }

    // Pincode validation
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      errors.push("Pincode must be exactly 6 digits");
    }

    // Required fields
    const requiredFields = ['name', 'dob', 'gender', 'bloodGroup', 'contactNumber', 'emergencyContactNumber', 'houseName', 'houseAddress', 'localBody', 'city', 'district', 'pincode', 'workAddress'];
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert("❌ Validation Errors:\n" + validationErrors.join("\n"));
      return;
    }

    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        try {
          // Add token from localStorage to Authorization header
          const token = localStorage.getItem('accessToken');
          const config = {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          };
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
            ...(isDonor && {
              availability: formData.availability === "available",
              lastDonatedDate: formData.lastDonationDate || undefined,
            }),
            contactPreference: formData.contactPreference,
          };
          const endpoint = isDonor ? "/donors/register" : "/users/register";
          const res = await api.post(endpoint, payload, config);
          const successMsg = isDonor ? "✅ Donor details saved" : "✅ User details saved";
          const errorMsg = isDonor ? "Failed to save donor details" : "Failed to save user details";
          if (res?.data?.success) {
            alert(successMsg);
            break;
          } else {
            alert("❌ " + (res?.data?.message || errorMsg));
            break;
          }
        } catch (err) {
          attempt++;
          if (attempt >= maxAttempts) {
            const errorMsg = isDonor ? "Failed to save donor details" : "Failed to save user details";
            const msg = err?.response?.data?.message || errorMsg;
            alert("❌ " + msg);
            break;
          }
        }
      } catch (outerErr) {
        alert("❌ Unexpected error occurred: " + outerErr.message);
        break;
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setIsDonor(true)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              isDonor ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Become a Donor
          </button>
          <button
            onClick={() => setIsDonor(false)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              !isDonor ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            User Registration
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {isDonor ? "🩸 Become a Blood Donor" : "🏥 User Registration"}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">
            {isDonor ? "Join our heroes saving lives every day" : "Register to request blood when needed"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Date of Birth</label>
            <input
              type="date"
              name="dob"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Gender</label>
            <select
              name="gender"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="" className="text-gray-800">Select Gender</option>
              <option value="Male" className="text-gray-800">Male</option>
              <option value="Female" className="text-gray-800">Female</option>
              <option value="Other" className="text-gray-800">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood group</label>
            <select
              name="bloodGroup"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              <option value="" className="text-gray-800">Select Blood Group</option>
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
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              placeholder="10-digit number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency Contact</label>
            <input
              type="text"
              name="emergencyContactNumber"
              placeholder="10-digit number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Name</label>
            <input
              type="text"
              name="houseName"
              placeholder="House Name"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.houseName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Address</label>
            <input
              type="text"
              name="houseAddress"
              placeholder="House Address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.houseAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Local Body</label>
            <input
              type="text"
              name="localBody"
              placeholder="Local Body"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.localBody}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">City</label>
            <input
              type="text"
              name="city"
              placeholder="City"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline.none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg.white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.city}
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Pincode</label>
            <input
              type="text"
              name="pincode"
              placeholder="6-digit pincode"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.pincode}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Work Address</label>
            <input
              type="text"
              name="workAddress"
              placeholder="Work Address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.workAddress}
              onChange={handleChange}
              required
            />
          </div>

          {isDonor && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                <select
                  name="availability"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  value={formData.availability}
                  onChange={handleChange}
                  required
                >
                  <option value="available" className="text-gray-800">Available</option>
                  <option value="unavailable" className="text-gray-800">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last donation date</label>
                <input
                  type="date"
                  name="lastDonationDate"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.lastDonationDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact preference</label>
            <select
              name="contactPreference"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.contactPreference}
              onChange={handleChange}
              required
            >
              <option value="phone" className="text-gray-800">Phone</option>
              <option value="email" className="text-gray-800">Email</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99]"
          >
            {isDonor ? 'Save Donor Details 🩸' : 'Save User Details 🏥'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">{isDonor ? 'By registering, you agree to donate blood when needed and meet all health requirements.' : 'By registering, you agree to our terms and conditions for blood requests.'}</p>
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
