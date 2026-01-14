import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

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

          // Redirect based on user role and enforce correct port (service)
          let redirectPath = '/dashboard'; // default for regular users
          const currentPort = window.location.port;
          const currentHostname = window.location.hostname;
          const authParams = searchParams.toString();

          const staffRoles = ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'store_manager', 'centrifuge_staff', 'other_staff'];

          if (role === 'bloodbank' || staffRoles.includes(role)) {
            // Blood Bank Roles -> Port 3003
            if (currentPort !== '3003') {
              console.log('🚀 AuthCallback: Wrong port for blood bank staff. Redirecting to Port 3003.');
              window.location.href = `http://${currentHostname}:3003/auth/callback?${authParams}`;
              return; // Stop execution
            }

            if (role === 'bleeding_staff') {
              redirectPath = '/bloodbank/bleeding-staff';
            } else {
              redirectPath = '/bloodbank/dashboard';
            }
          } else if (role === 'admin') {
            // Admin Role -> Port 3001
            if (currentPort !== '3001') {
              console.log('🚀 AuthCallback: Wrong port for admin. Redirecting to Port 3001.');
              window.location.href = `http://${currentHostname}:3001/auth/callback?${authParams}`;
              return;
            }
            redirectPath = '/admin-dashboard';
          } else {
            // Donor/User Role -> Port 3002 (or 3000 if acting as main, but usually 3002)
            // If we want to enforce 3002 for donors:
            if (['3001', '3003'].includes(currentPort)) {
              // If a donor accidentally lands on admin/bloodbank port, verify if we should move them?
              // Usually OK to let them stay if the app supports it, but strictly 3002 is better for API routing.
              console.log('🚀 AuthCallback: Wrong port for donor. Redirecting to Port 3002.');
              window.location.href = `http://${currentHostname}:3002/auth/callback?${authParams}`;
              return;
            }
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
      <div className="absolute top-8 right-8">
        <UserAvatar />
      </div>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Completing Sign In...</h2>
          <p className="text-gray-300">Please wait while we set up your account.</p>
        </div>
      </div>
    </div>
  );
}
