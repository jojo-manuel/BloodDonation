// components/RequireRole.jsx
// Route guard: checks for authentication token AND verifies user role.
// Redirects to login if no token, or to appropriate dashboard if role doesn't match.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireRole({ children, allowedRoles = [] }) {
  const location = useLocation();

  // Read token and role client-side
  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  let role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  // Check for tokens in URL (Cross-port redirect)
  const queryParams = new URLSearchParams(location.search);
  const urlToken = queryParams.get('accessToken');
  const urlRefreshToken = queryParams.get('refreshToken');

  if (urlToken) {
    console.log('RequireRole: Found tokens in URL, saving to storage');
    localStorage.setItem('accessToken', urlToken);
    if (urlRefreshToken) localStorage.setItem('refreshToken', urlRefreshToken);

    const urlRole = queryParams.get('role');
    if (urlRole) localStorage.setItem('role', urlRole);

    const urlUsername = queryParams.get('username');
    if (urlUsername) localStorage.setItem('username', urlUsername);

    const urlUserId = queryParams.get('userId');
    if (urlUserId) localStorage.setItem('userId', urlUserId);

    // Refresh variables from storage
    token = urlToken;
    role = urlRole || role;

    // Clean URL
    window.history.replaceState({}, document.title, location.pathname);
  }

  console.log('RequireRole: Checking authentication and role', {
    token: token ? 'present' : 'missing',
    role,
    allowedRoles,
    currentPath: location.pathname
  });

  // If no token, redirect to login
  if (!token) {
    console.log('RequireRole: No token found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If role is required but doesn't match, redirect based on role
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    console.log('RequireRole: Role mismatch, redirecting based on role');

    // Redirect to appropriate dashboard based on user's actual role
    if (role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (role === 'bloodbank') {
      return <Navigate to="/bloodbank/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('RequireRole: Authentication and role check passed, allowing access');
  return children;
}


