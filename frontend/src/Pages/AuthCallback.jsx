import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Starting callback processing');
        console.log('🔄 AuthCallback: Current URL:', window.location.href);
        console.log('🔄 AuthCallback: Search params:', searchParams.toString());

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');
        const username = searchParams.get('username');

        console.log('🔄 AuthCallback: Received parameters:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          userId,
          role,
          username
        });

        if (accessToken && refreshToken && userId) {
          console.log('✅ AuthCallback: All required parameters present, storing tokens...');

          // Store authentication data
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userId', userId);
          localStorage.setItem('role', role);
          localStorage.setItem('username', username);

          console.log('✅ AuthCallback: Tokens stored successfully');

          // Verify storage
          const storedToken = localStorage.getItem('accessToken');
          const storedRole = localStorage.getItem('role');
          console.log('✅ AuthCallback: Verification - stored token:', storedToken ? 'present' : 'missing');
          console.log('✅ AuthCallback: Verification - stored role:', storedRole);

          // Redirect based on user role
          let redirectPath = '/dashboard'; // default for regular users
          if (role === 'bloodbank') {
            redirectPath = '/bloodbank/dashboard';
          } else if (role === 'admin') {
            redirectPath = '/admin-dashboard';
          }

          console.log('🚀 AuthCallback: Redirecting to:', redirectPath);

          // Add a small delay to ensure localStorage is updated
          setTimeout(() => {
            console.log('🚀 AuthCallback: Executing navigation to:', redirectPath);
            navigate(redirectPath, { replace: true });
          }, 100);

        } else {
          console.error('❌ AuthCallback: Missing authentication parameters');
          console.error('❌ AuthCallback: Missing params:', {
            accessToken: !accessToken,
            refreshToken: !refreshToken,
            userId: !userId
          });
          navigate('/login?error=auth_failed');
        }
      } catch (error) {
        console.error('❌ AuthCallback error:', error);
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
