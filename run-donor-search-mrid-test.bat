@echo off
echo =====================================
echo  Donor Search by MRID - BDD Testing
echo  Testing donor search functionality
echo =====================================
echo.

REM Check if servers are running
echo [1/4] Checking if servers are running...
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo [ERROR] Frontend server is not running on http://localhost:5173
    echo Please start the frontend server first using: start_frontend.bat
    echo.
    pause
    exit /b 1
)

curl -s http://localhost:5000/api/health > nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend server might not be running on http://localhost:5000
    echo Some tests may fail. Consider starting backend with: start_backend.bat
    echo.
)

echo [OK] Frontend server is running
echo.

REM Navigate to frontend directory
echo [2/4] Navigating to frontend directory...
cd frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to navigate to frontend directory
    pause
    exit /b 1
)
echo [OK] In frontend directory
echo.

REM Install dependencies if needed
echo [3/4] Checking dependencies...
if not exist "node_modules\@cucumber\cucumber" (
    echo Installing Cucumber dependencies...
    npm install @cucumber/cucumber selenium-webdriver --save-dev
)
echo [OK] Dependencies ready
echo.

REM Run the BDD tests
echo [4/4] Running BDD tests for Donor Search by MRID...
echo.
echo ========================================
echo          EXECUTING TESTS
echo ========================================
echo.

npm run test:bdd:donor-search-mrid

echo.
echo ========================================
echo          TEST EXECUTION COMPLETE
echo ========================================
echo.

echo Test execution completed!
echo.

cd ..

pause

