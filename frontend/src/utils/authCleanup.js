// utils/authCleanup.js
// Utility to clean up invalid authentication state

export const cleanupAuthState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If we have an access token but no refresh token, clear everything
  if (accessToken && !refreshToken) {
    console.warn('⚠️ Found access token without refresh token - clearing auth state');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    return false;
  }
  
  // Check if tokens are valid (not undefined, null, or "undefined" string)
  const invalidTokens = [
    accessToken === 'undefined',
    accessToken === 'null',
    refreshToken === 'undefined',
    refreshToken === 'null',
  ];
  
  if (invalidTokens.some(invalid => invalid)) {
    console.warn('⚠️ Found invalid token values - clearing auth state');
    localStorage.clear();
    return false;
  }
  
  return !!(accessToken && refreshToken);
};

export const clearAuthState = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
};

export const hasValidAuthTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return (
    accessToken &&
    refreshToken &&
    accessToken !== 'undefined' &&
    accessToken !== 'null' &&
    refreshToken !== 'undefined' &&
    refreshToken !== 'null' &&
    accessToken.trim() !== '' &&
    refreshToken.trim() !== ''
  );
};

