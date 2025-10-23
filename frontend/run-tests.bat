@echo off
echo Starting Blood Donation App Playwright Tests...
echo.

echo Checking if backend server is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend server is not running on port 5000
    echo Please start the backend server first: cd backend && npm start
    pause
    exit /b 1
)

echo Backend server is running ✓
echo.

echo Checking if frontend server is running...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo Frontend server is not running on port 5173
    echo Please start the frontend server first: npm run dev
    pause
    exit /b 1
)

echo Frontend server is running ✓
echo.

echo Running Playwright tests...
echo.

REM Run a subset of tests first to verify setup
npx playwright test auth.spec.js --project=chromium --reporter=list

echo.
echo Tests completed!
echo.
echo To run all tests: npm run test:playwright
echo To run with UI: npm run test:playwright:ui
echo To run in headed mode: npm run test:playwright:headed
echo.
pause
