// components/RequireAuth.jsx
// Route guard: redirects to /login if there is no access token in localStorage.
// Also checks for suspended/blocked users and restricts access accordingly.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const location = useLocation();
  // Read token and user status client-side
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const isSuspended = typeof window !== 'undefined' ? localStorage.getItem('isSuspended') === 'true' : false;
  const isBlocked = typeof window !== 'undefined' ? localStorage.getItem('isBlocked') === 'true' : false;

  console.log('RequireAuth: Checking authentication', {
    token: token ? 'present' : 'missing',
    role,
    isSuspended,
    isBlocked,
    currentPath: location.pathname
  });

  if (!token) {
    console.log('RequireAuth: No token found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user is blocked - redirect to login with error
  if (isBlocked) {
    console.log('RequireAuth: User is blocked, redirecting to login');
    localStorage.clear(); // Clear all stored data
    alert('Your account has been blocked. Please contact administrator.');
    return <Navigate to="/login" replace />;
  }

  // Check if user is suspended - allow access but with restrictions
  if (isSuspended) {
    console.log('RequireAuth: User is suspended, allowing access with restrictions');
    // For suspended users, we allow access but the individual pages will show restrictions
  }

  console.log('RequireAuth: Authentication passed, allowing access');
  return children;
}
