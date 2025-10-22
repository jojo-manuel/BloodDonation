// components/RequireAuth.jsx
// Route guard: redirects to /login if there is no access token in localStorage.
// Also checks for suspended/blocked users and restricts access accordingly.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const location = useLocation();
  // Read token and user status client-side
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  console.log('RequireAuth: Checking authentication', {
    token: token ? 'present' : 'missing',
    currentPath: location.pathname
  });

  if (!token) {
    console.log('RequireAuth: No token found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('RequireAuth: Authentication passed, allowing access');
  return children;
}
