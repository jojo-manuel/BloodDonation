@echo off
echo ========================================
echo  SETUP EMAIL CREDENTIALS FOR BACKEND
echo ========================================
echo.

cd backend

echo Creating .env file...
echo.

(
echo # ============================================
echo # EMAIL CONFIGURATION FOR NOTIFICATIONS
echo # ============================================
echo GMAIL_USER=jojo2001p@gmail.com
echo GMAIL_PASS=nfgetyyeqonkvtmc
echo.
echo # ============================================
echo # DATABASE CONFIGURATION
echo # ============================================
echo MONGODB_URI=mongodb://localhost:27017/blooddonation
echo.
echo # ============================================
echo # SERVER CONFIGURATION
echo # ============================================
echo PORT=5000
echo NODE_ENV=development
echo.
echo # ============================================
echo # JWT CONFIGURATION
echo # ============================================
echo JWT_SECRET=blooddonation-jwt-secret-2025-secure-key
echo.
echo # ============================================
echo # RAZORPAY CONFIGURATION
echo # ============================================
echo RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
echo RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
echo.
echo # ============================================
echo # CORS CONFIGURATION
echo # ============================================
echo CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3000
echo.
echo # ============================================
echo # SESSION CONFIGURATION
echo # ============================================
echo SESSION_SECRET=blooddonation-session-secret-2025
) > .env

echo.
echo ========================================
echo  SUCCESS!
echo ========================================
echo.
echo .env file created in backend folder
echo.
echo Email Configuration:
echo   Username: jojo2001p@gmail.com
echo   Password: ******** (hidden for security)
echo.
echo ========================================
echo  NEXT STEPS:
echo ========================================
echo.
echo 1. Restart your backend server
echo 2. Test the reschedule notification feature
echo.
echo To restart backend:
echo   Ctrl + C (stop current server)
echo   .\start_backend.bat
echo.
pause

