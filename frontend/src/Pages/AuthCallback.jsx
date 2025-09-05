import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');
        const username = searchParams.get('username');

        if (accessToken && refreshToken && userId) {
          // Store authentication data
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userId', userId);
          localStorage.setItem('role', role);
          localStorage.setItem('username', username);

          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          // Handle error case
          console.error('Missing authentication parameters');
          navigate('/login?error=auth_failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Completing Sign In...</h2>
        <p className="text-gray-300">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}
