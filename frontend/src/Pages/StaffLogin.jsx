import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import api from "../lib/api";

function ProgressBar() {
    return (
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-4">
            <Link to="/login" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-sm">
                ← Back to User Login
            </Link>
            <div className="flex gap-4 items-center">
                <span className="flex items-center gap-1 text-gray-400">
                    <span className="bg-gray-400/20 rounded-full p-2"><span className="text-xl">🔐</span></span>
                    User Login
                </span>
                <span className="h-1 w-8 bg-blue-500 rounded-full" />
                <span className="flex items-center gap-1 text-blue-500 font-bold">
                    <span className="bg-blue-500/20 rounded-full p-2"><span className="text-xl">👔</span></span>
                    Staff Login
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-blue-500 font-bold">
                    <span className="bg-blue-500/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
                    Hope Web
                </span>
                <UserAvatar />
            </div>
        </div>
    );
}

export default function StaffLogin() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Always use dark mode
    useEffect(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", {
                email: formData.username, // Sending username as email/username field
                password: formData.password,
            });

            if (res.data.success && res.data.data) {
                localStorage.setItem("accessToken", res.data.data.accessToken);
                localStorage.setItem("refreshToken", res.data.data.refreshToken);
                localStorage.setItem("userId", res.data.data.user.id);
                localStorage.setItem("role", res.data.data.user.role);
                localStorage.setItem("username", res.data.data.user.username);

                if (res.data.data.user.isSuspended) localStorage.setItem('isSuspended', res.data.data.user.isSuspended);
                if (res.data.data.user.isBlocked) localStorage.setItem('isBlocked', res.data.data.user.isBlocked);
                if (res.data.data.user.warningMessage) localStorage.setItem('warningMessage', res.data.data.user.warningMessage);

                if (res.data.data.user.warningMessage) {
                    alert(`Warning: ${res.data.data.user.warningMessage}`);
                }
                if (res.data.data.user.isSuspended) {
                    alert('Your account is suspended. Some features may be restricted.');
                }

                // Validate Role
                const allowedRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff', 'bloodbank'];

                if (allowedRoles.includes(res.data.data.user.role)) {
                    // Redirect to Blood Bank App (Port 3003)
                    console.log('Login Response:', res.data);

                    const user = res.data.data.user;
                    const token = res.data.data.token || res.data.data.accessToken;
                    const userId = user._id || user.id;

                    if (!token || !userId) {
                        alert('Login failed: Missing token or user ID from server response');
                        console.error('Missing auth data:', { token, userId, data: res.data.data });
                        return;
                    }

                    const authParams = new URLSearchParams({
                        accessToken: token,
                        refreshToken: token, // Backend currently only returns one token
                        userId: userId,
                        role: user.role,
                        username: user.username
                    }).toString();

                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                    // Determine the target path based on role
                    let targetPath = '/bloodbank/dashboard';
                    if (res.data.data.user.role === 'bleeding_staff') {
                        targetPath = '/bloodbank/bleeding-staff';
                    } else if (res.data.data.user.role === 'store_manager') {
                        targetPath = '/bloodbank/store-manager';
                    } else if (res.data.data.user.role === 'store_staff') {
                        targetPath = '/bloodbank/store-staff';
                    } else if (res.data.data.user.role === 'centrifuge_staff') {
                        targetPath = '/bloodbank/centrifuge-staff';
                    } else if (res.data.data.user.role === 'doctor') {
                        targetPath = '/bloodbank/doctor';
                    }

                    // Append target path to callback params so AuthCallback knows where to go next
                    // Note: AuthCallback needs to support this 'redirect' param, or we rely on its default role-based routing
                    // If AuthCallback doesn't support 'redirect', we might rely on it to route correctly by role.
                    // To be safe, let's assume it routes by role, but passing the specific app port is crucial.

                    if (isLocalhost) {
                        window.location.href = `http://localhost:3003/auth/callback?${authParams}`;
                    } else {
                        // In production, structure might differ, but for now assuming similar subdomain or routing
                        // If we are on same domain, navigate is fine? No, separate apps.
                        // Assuming production uses different domains/subdomains.
                        window.location.href = `${window.location.protocol}//${window.location.hostname}:3003/auth/callback?${authParams}`;
                    }
                } else {
                    alert("Access denied. This login is for blood bank staff only.");
                    // Clear auth if invalid role
                    localStorage.clear();
                }
            } else {
                alert(res.data.message || "Login failed");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Login failed");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#172554] dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
            {/* Progress Bar */}
            <ProgressBar />

            {/* Login Card */}
            <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-24 pt-4 md:px-6 md:pb-24 md:pt-8">
                <form onSubmit={handleLogin} className="w-full rounded-2xl border border-white/20 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5">
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-2">
                            <span className="bg-blue-500/20 rounded-full p-4 text-4xl">👔</span>
                        </div>
                        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Staff Login</h2>
                        <p className="text-sm text-gray-300 md:text-base">Login with your staff credentials</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-200">Username / Email</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your username (e.g. frontdesk.hospital...)"
                                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-gray-900 placeholder-gray-500 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-200">Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-gray-900 placeholder-gray-500 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-[0.99] disabled:opacity-50"
                        >
                            {loading ? "⏳ Processing..." : '👔 Login as Staff'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                {/* Spacer */}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-300">
                            Forgot Password? Contact your Blood Bank Admin.
                        </p>
                        <div className="mt-2">
                            <Link to="/bloodbank-login" className="text-sm text-blue-400 transition hover:text-blue-300">
                                Are you an Admin? Login here →
                            </Link>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
