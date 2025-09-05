// components/RequireAuth.jsx
// Route guard: redirects to /login if there is no access token in localStorage.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const location = useLocation();
  // Read token client-side; if missing, send user to login and remember where they were
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}



