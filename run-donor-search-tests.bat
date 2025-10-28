@echo off
echo ================================================================================
echo  DONOR FINDING BDD TEST RUNNER
echo ================================================================================
echo.
echo  This script will run BDD tests for Donor Search by MRID feature
echo  Using Selenium WebDriver and Cucumber.js
echo.
echo  Test User: jeevan@gmail.com
echo  Browser: Chrome (visible window)
echo  Duration: ~1.5 minutes for 4 scenarios
echo.
echo ================================================================================
echo  PRE-FLIGHT CHECKS
echo ================================================================================
echo.

REM Check if frontend is running
echo [1/3] Checking if frontend is running on port 5173...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Frontend is not running!
    echo.
    echo Please start the frontend server first:
    echo    cd frontend
    echo    npm run dev
    echo.
    pause
    exit /b 1
)
echo ✅ Frontend is running

REM Check if backend is running
echo [2/3] Checking if backend is running on port 5000...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Backend is not running!
    echo.
    echo Please start the backend server first:
    echo    cd backend
    echo    npm start
    echo.
    pause
    exit /b 1
)
echo ✅ Backend is running

echo [3/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo ================================================================================
echo  ALL CHECKS PASSED - STARTING TESTS
echo ================================================================================
echo.
echo Test will:
echo  ✓ Open Chrome browser (4 times, once per scenario)
echo  ✓ Login as jeevan@gmail.com
echo  ✓ Test donor search functionality
echo  ✓ Verify search results
echo  ✓ Check validation and error handling
echo.
echo Please don't close this window or interact with the browser during tests.
echo.
pause

cd frontend

echo.
echo ================================================================================
echo  RUNNING BDD TESTS
echo ================================================================================
echo.

REM Run the tests
call npm run test:bdd:donor-search

echo.
echo ================================================================================
echo  TEST RUN COMPLETE
echo ================================================================================
echo.

if %errorlevel% equ 0 (
    echo ✅✅✅ SUCCESS! All tests passed! ✅✅✅
    echo.
    echo Test Summary:
    echo   → 4 scenarios tested
    echo   → All donor search features validated
    echo   → Login, search, validation, and UI tests passed
    echo.
    echo Next Steps:
    echo   1. Review test output above
    echo   2. Run comprehensive tests: npm run test:bdd:donor-search-mrid
    echo   3. Check DONOR-SEARCH-BDD-TESTING-COMPLETE-GUIDE.md for details
) else (
    echo ❌❌❌ TESTS FAILED ❌❌❌
    echo.
    echo Some tests did not pass. Please:
    echo   1. Review error messages above
    echo   2. Check screenshots in test-results/screenshots/
    echo   3. Verify test data exists (patient MRID 402)
    echo   4. Ensure jeevan@gmail.com user exists
    echo   5. See DONOR-SEARCH-BDD-TESTING-COMPLETE-GUIDE.md for troubleshooting
)

echo.
echo ================================================================================
pause

