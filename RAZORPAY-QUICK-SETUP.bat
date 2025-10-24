@echo off
REM Quick Razorpay Setup Script for Windows
REM This script helps set up Razorpay environment variables

echo.
echo ===============================================
echo  Razorpay Payment Setup for Taxi Booking
echo ===============================================
echo.

echo Your Razorpay Credentials:
echo Key ID: rzp_test_RP6aD2gNdAuoRE
echo Key Secret: RyTIKYQ5yobfYgNaDrvErQKN
echo.

echo Step 1: Setting up Backend...
echo.

REM Check if backend .env exists
if exist backend\.env (
    echo Backend .env file already exists.
    echo.
    echo Adding Razorpay credentials to existing file...
    echo. >> backend\.env
    echo # Razorpay Configuration >> backend\.env
    echo RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE >> backend\.env
    echo RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN >> backend\.env
    echo ✓ Razorpay credentials added to backend\.env
) else (
    echo Creating new backend .env file...
    (
        echo # MongoDB Connection
        echo MONGODB_URI=mongodb://localhost:27017/blooddonation
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # CORS Configuration
        echo CORS_ORIGIN=http://localhost:5173
        echo.
        echo # JWT Secrets
        echo JWT_SECRET=your-jwt-secret-key-change-in-production
        echo JWT_REFRESH_SECRET=your-jwt-refresh-secret-change-in-production
        echo.
        echo # Razorpay Configuration
        echo RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
        echo RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
    ) > backend\.env
    echo ✓ Created backend\.env with Razorpay credentials
)

echo.
echo Step 2: Setting up Frontend...
echo.

REM Check if frontend .env exists
if exist frontend\.env (
    echo Frontend .env file already exists.
    echo.
    echo Adding Razorpay key to existing file...
    echo. >> frontend\.env
    echo # Razorpay Frontend Configuration >> frontend\.env
    echo VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE >> frontend\.env
    echo ✓ Razorpay key added to frontend\.env
) else (
    echo Creating new frontend .env file...
    (
        echo # Razorpay Frontend Configuration
        echo VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
        echo.
        echo # API Base URL
        echo VITE_API_BASE_URL=http://localhost:5000
    ) > frontend\.env
    echo ✓ Created frontend\.env with Razorpay key
)

echo.
echo ===============================================
echo  Setup Complete!
echo ===============================================
echo.
echo ✓ Backend configured: backend\.env
echo ✓ Frontend configured: frontend\.env
echo.
echo Next Steps:
echo 1. Restart backend server: cd backend ^&^& npm start
echo 2. Restart frontend server: cd frontend ^&^& npm run dev
echo 3. Test payment with test card: 4111 1111 1111 1111
echo.
echo See RAZORPAY-SETUP-GUIDE.md for detailed instructions.
echo.
pause

