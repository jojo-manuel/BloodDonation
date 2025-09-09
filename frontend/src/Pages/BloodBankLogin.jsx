import React, { useState } from "react";
import api from "../lib/api";

export default function BloodBankLogin() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        username: formData.username,
        password: formData.password,
      });
      if (res.data.success && res.data.data) {
        localStorage.setItem("accessToken", res.data.data.accessToken);
        localStorage.setItem("refreshToken", res.data.data.refreshToken);
        alert("Login successful!");
        // Redirect to blood bank dashboard or details page
        window.location.href = "/bloodbank/dashboard";
      } else {
        alert(res.data.message || "Login failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Blood Bank Login</h2>
      <input
        type="text"
        placeholder="Username"
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
        minLength={6}
        required
        className="w-full mb-2 p-2 border rounded"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
