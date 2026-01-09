import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Layout from "../components/Layout";
import UserAvatar from "../components/UserAvatar";

function Navbar() {
  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
      <a href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          <span className="text-xl" role="img" aria-label="Blood drop">🩸</span>
        </div>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent dark:from-rose-300 dark:to-amber-200">Blood Donation</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">Connect. Donate. Save lives.</p>
        </div>
      </a>
      <UserAvatar />
    </nav>
  );
}

export default function BloodBankAdminRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    hospitalName: "",
    email: "",
    password: "",
    pincode: "",
    localBody: "",
    district: "",
    state: "",
    phone: "",
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Blood bank name is required");
    if (!formData.hospitalName.trim()) errors.push("Hospital name is required");
    if (!formData.email.trim()) errors.push("Email/Username is required");
    if (!formData.password.trim()) errors.push("Password is required");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters");
    if (!formData.pincode.trim()) errors.push("Pincode is required");
    if (!/^[0-9]{6}$/.test(formData.pincode)) errors.push("Pincode must be 6 digits");
    if (!formData.localBody.trim()) errors.push("Local body is required");
    if (!formData.district.trim()) errors.push("District is required");
    if (!formData.state.trim()) errors.push("State is required");
    if (!formData.phone.trim()) errors.push("Phone number is required");
    if (!/^[6-9]\d{9}$/.test(formData.phone)) errors.push("Phone number must be a valid 10-digit Indian number");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      const payload = {
        name: formData.name,
        hospitalName: formData.hospitalName,
        email: formData.email,
        password: formData.password,
        pincode: formData.pincode,
        localBody: formData.localBody,
        district: formData.district,
        state: formData.state,
        phone: formData.phone,
        userId: userId || null
      };

      const res = await api.post("/bloodbank/register", payload);

      if (res?.data?.success) {
        alert("✅ Blood bank registration submitted successfully! Waiting for admin approval.");
        navigate("/bloodbank-pending-approval");
      } else {
        alert(res?.data?.message || "Failed to register blood bank");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed";
      alert(errorMsg);
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Navbar />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-8">
          <h1 className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            🏥 Blood Bank Admin Registration
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Fill in the details below. Your registration will be reviewed by an admin.
          </p>

          {errors.length > 0 && (
            <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Blood Bank Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter blood bank name"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="hospitalName" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Hospital Name *
              </label>
              <input
                type="text"
                id="hospitalName"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                required
                placeholder="Enter hospital name"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Username (Email) *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email for login"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Create a password"
                minLength={6}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pincode" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Pincode *
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="6 digits"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  placeholder="10 digits"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="localBody" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Local Body *
              </label>
              <input
                type="text"
                id="localBody"
                name="localBody"
                value={formData.localBody}
                onChange={handleInputChange}
                required
                placeholder="Enter local body (Panchayat/Municipality/Corporation)"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="district" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                District *
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                placeholder="Enter district"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                State *
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                placeholder="Enter state"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-r hover:from-pink-700 hover:to-rose-600 focus:outline-none focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-800 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit for Admin Approval"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}


