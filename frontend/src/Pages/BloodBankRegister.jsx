import React, { useState } from "react";
import api from "../lib/api";

export default function BloodBankRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    address: "",
    district: "",
    contactNumber: "",
    licenseNumber: "",
  });
  const [userId, setUserId] = useState(null);

  const handleUserRegister = async (e) => {
    e.preventDefault();
    // Username validation: only letters, numbers, underscores, min 3 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(formData.username)) {
      alert("Username must be 3-50 characters and contain only letters, numbers, and underscores.");
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
          setUserId(res.data.data.userId);
          setStep(2);
        } else {
          alert(loginRes.data.message || "Login failed after registration");
        }
      } else {
        alert(res.data.message || "Registration failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/bloodbank/submit-details", {
        userId,
        name: formData.name,
        address: formData.address,
        district: formData.district,
        contactNumber: formData.contactNumber,
        licenseNumber: formData.licenseNumber,
      });
      if (res.data.success) {
        alert("Blood bank details submitted for approval");
        setStep(3);
      } else {
        alert(res.data.message || "Submission failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleUserRegister} className="max-w-md mx-auto p-4">
        <h2 className="text-xl font-bold mb-4">Blood Bank User Registration</h2>
        <input
          type="text"
          placeholder="Username (letters, numbers, underscores only)"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
          minLength={3}
          maxLength={50}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Register
        </button>
      </form>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={handleDetailsSubmit} className="max-w-md mx-auto p-4">
        <h2 className="text-xl font-bold mb-4">Blood Bank Details</h2>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="District"
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Contact Number"
          value={formData.contactNumber}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
            setFormData({ ...formData, contactNumber: digitsOnly });
          }}
          inputMode="numeric"
          pattern="^[0-9]{10}$"
          maxLength={10}
          title="Please enter a 10-digit contact number"
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="License Number"
          value={formData.licenseNumber}
          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
          required
          className="w-full mb-2 p-2 border rounded"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Submit Details
        </button>
      </form>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-xl font-bold mb-4">Registration Complete</h2>
        <p>Your blood bank registration is pending admin approval.</p>
      </div>
    );
  }

  return null;
}
