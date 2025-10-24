// Pages/Login.jsx
// Login page: collects email/password, calls /auth/login, stores tokens and user, and redirects by role.

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import UserAvatar from "../components/UserAvatar";
import { app } from '../firebase';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function ProgressBar() {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-4">
      <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-pink-400 text-sm">
        ← Back to Home
      </Link>
      <div className="flex gap-4 items-center">
        <span className="flex items-center gap-1 text-pink-400 font-bold">
          <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">🔐</span></span>
          Login
        </span>
        <span className="h-1 w-8 bg-gray-400/30 rounded-full" />
        <span className="flex items-center gap-1 text-gray-400">
          <span className="bg-gray-400/20 rounded-full p-2"><span className="text-xl">📝</span></span>
          Register
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-pink-400 font-bold">
          <span className="bg-pink-400/20 rounded-full p-2"><span className="text-xl">❤️</span></span>
          Hope Web
        </span>
        <UserAvatar />
      </div>
    </div>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);

  const navigate = useNavigate();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();

          // Send ID token to backend for verification and app token generation
          const response = await api.post('/auth/firebase', { idToken });

          if (response.data.success) {
            const { user, accessToken, refreshToken } = response.data.data;

            // Construct callback URL with tokens as query parameters
            const params = new URLSearchParams({
              accessToken,
              refreshToken,
              userId: user.id,
              role: user.role,
              username: user.username
            });

            // Redirect to AuthCallback page for proper handling
            navigate(`/auth/callback?${params.toString()}`, { replace: true });
          } else {
            alert('Authentication failed: ' + response.data.message);
          }
        }
      } catch (error) {
        console.error('Firebase redirect error:', error);
        if (error.code === 'auth/user-cancelled') {
          alert('Sign-in was cancelled.');
        } else {
          alert('Firebase sign-in failed. Please try again.');
        }
      }
    };

    handleRedirectResult();
  }, [navigate]);

// Firebase sign-in with Google provider using popup (fallback for redirect issues)
const handleFirebaseSignIn = async () => {
  setFirebaseLoading(true);
  try {
    // Use popup sign-in instead of redirect to avoid sessionStorage issues
    const result = await signInWithPopup(auth, provider);
    if (result) {
      const idToken = await result.user.getIdToken();

      // Send ID token to backend for verification and app token generation
      const response = await api.post('/auth/firebase', { idToken });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;

        // Store user data and tokens
        if (user?.id) localStorage.setItem('userId', user.id);
        if (user?.role) localStorage.setItem('role', user.role);
        if (user?.username) localStorage.setItem('username', user.username);
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        // Redirect based on user role and suspension/block status
        if (user?.isSuspended) {
          alert('Your account is suspended. Some features may be restricted.');
          navigate('/dashboard');
        } else if (user?.isBlocked) {
          alert('Your account is blocked. Please contact support.');
          navigate('/login');
        } else if (user?.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (user?.role === 'bloodbank') {
          navigate('/bloodbank/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert('Authentication failed: ' + response.data.message);
      }
    }
  } catch (error) {
    console.error('Firebase popup sign-in error:', error);
    alert('Failed to sign in with Google. Please try again.');
  } finally {
    setFirebaseLoading(false);
  }
};

  // Firebase forgot password
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      alert('Please enter your email.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('Password reset email sent! Check your inbox.');
      setShowReset(false);
      setResetEmail('');
    } catch (error) {
      console.error('Firebase reset error:', error);
      alert('Error: ' + error.message);
    }
  };

  // Submit credentials and persist tokens + user; redirect to dashboard
  const handleSubmit = (e) => {
    e.preventDefault();
    // Use email directly as username for login
    const username = formData.email;

    const payload = { email: username, password: formData.password };
    
    // Debug logging to see what's being sent
    console.log('🔍 Login Debug Info:');
    console.log('  Email:', formData.email);
    console.log('  Email length:', formData.email?.length);
    console.log('  Password length:', formData.password?.length);
    console.log('  Payload:', { email: payload.email, passwordLength: payload.password?.length });
    
    api.post('/auth/login', payload)
      .then(({ data }) => {
          if (data?.success && data?.data) {
            const { user, accessToken, refreshToken } = data.data;
            if (user?.id) localStorage.setItem('userId', user.id);
            if (user?.role) localStorage.setItem('role', user.role);
            if (user?.username) localStorage.setItem('username', user.username);
            if (user?.isSuspended) localStorage.setItem('isSuspended', user.isSuspended);
            if (user?.isBlocked) localStorage.setItem('isBlocked', user.isBlocked);
            if (user?.warningMessage) localStorage.setItem('warningMessage', user.warningMessage);
            if (accessToken) localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

            if (user?.warningMessage) {
              alert(`Warning: ${user.warningMessage}`);
            }
            if (user?.isSuspended) {
              alert('Your account is suspended. Some features may be restricted.');
            }

            if (user?.role === 'admin') {
              navigate('/admin-dashboard');
            } else if (user?.role === 'bloodbank') {
              navigate('/bloodbank/dashboard');
            } else {
              navigate('/dashboard');
            }
          } else {
            alert(data?.message || 'Login failed');
          }
      })
      .catch((err) => {
        console.error('❌ Login error:', err);
        console.error('❌ Error response:', err.response?.data);
        console.error('❌ Error status:', err.response?.status);
        
        const msg = err?.response?.data?.message || 'Login failed';
        alert(`Login Failed: ${msg}\n\n💡 Tip: Make sure you're using your EMAIL ADDRESS (not username)\nExample: test@example.com`);
      });
  };



  return (
    <div className="fixed inset-0 min-h-screen w-full overflow-auto bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      {/* Progress Bar */}
      <ProgressBar />

      {/* Login Card */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-24 pt-4 md:px-6 md:pb-24 md:pt-8">
        <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <span className="bg-pink-400/20 rounded-full p-4 text-4xl">🔐</span>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Login to Hope Web</h2>
            <p className="text-sm text-gray-300 md:text-base">Sign in to your account to continue</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Firebase Sign-In Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleFirebaseSignIn}
                disabled={firebaseLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-gray-500/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {firebaseLoading ? (
                  <span>Redirecting to Google...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Firebase
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center mb-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99]"
            >
              <span className="mr-2">🔐</span> Login
            </button>



            {showReset && (
              <div className="mt-4 space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email for password reset"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none focus:ring-2 focus:ring-pink-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-pink-500/30 active:scale-[0.99]"
                  >
                    Send Reset Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="rounded-2xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-gray-500/30 active:scale-[0.99]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-300">
              Don't have an account? Contact admin for registration.
            </p>
            <p className="text-sm">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-pink-400 underline-offset-4 hover:underline dark:text-pink-300"
              >
                Forgot your password?
              </button>
            </p>
            <div className="pt-2">
              <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200 dark:text-gray-400 dark:hover:text-gray-200">
                ← Back to Home
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
